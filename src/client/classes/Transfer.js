/**
 * Transfer: Stores and manages all information about the current transfer
 */
import SimplePeer from 'simple-peer';
import socket from 'socket.io-client';
import { saveAs } from 'file-saver';
import debugging from 'debug';

const debug = debugging('blymp:transfer');

export default class Transfer {
  /**
   * Transfer method
   * One of: 'webrtc', 'socket'
   * @type String
   */
  method = SimplePeer.WEBRTC_SUPPORT ? 'webrtc' : 'socket';

  /**
   * Current socket.io connection
   */
  socket = null;

  /**
   * Is this page the sending end of the transfer?
   * @type Boolean
   */
  isSender = false;

  /**
   * ID of the socket.io socket. This will be saved so we can resume
   * a socket after the connection has been lost
   * @type String
   */
  socketId = null;

  /**
   * Our own receiver id
   * @type Number, 4 digit
   */
  receiverId = null;

  /**
   * Is the current input receiver ID valid?
   * Used to display the invalid animation
   * @type Boolean
   */
  isValidId = true;

  /**
   * Handler that gets called once an important change happens.
   * This allows us to update the React UI when there are changes in the transfer
   * @type Function
   */
  updateHandler = () => {};

  /**
   * WebRTC peer that we are connected to
   */
  peer = null;

  /**
   * Signal that we got from our peer
   * @type Object
   */
  peerSignal = null;

  /**
   * Open a page using react router.
   * This will get set by a React component that has access to Hooks
   * @type Function
   */
  openPage = () => {}

  /**
   * Number of files that are being transferred
   * @type Integer
   */
  totalFiles = 0;

  /**
   * Current file we are transferring
   * @type Integer
   */
  currentFile = 0;

  /**
   * Name of the file we are currently transferring
   */
  currentFileName = '';

  /**
   * Is this transfer completed?
   * @type Boolean
   */
  finishedTransfer = false;

  /**
   * Estimated time needed for the transfer to be completed in seconds
   * @type Integer
   */
  estimate = 10;

  /**
   * Number between 0-100, indicating the progress of the transfer of the current file
   * @type Integer
   */
  progress = 0;

  /**
   * Files that the user selected and wants to transfer
   * @type Array
   */
  selectedFiles = [];

  /**
   * Initialize the socket to listen for status changes
   */
  initSocket() {
    this.socket.on('connect', () => {
      debug('Connected socket');

      if (!this.socketId) {
        this.socketId = this.socket.io.engine.id;
      }
    });

    // Someone entered our receiver ID
    this.socket.on('pair partner found', (method) => {
      debug('Found a pair partner', method);

      this.openPage('/connecting');

      this.method = method;

      if (method === 'webrtc') {
        debug('Opening connection for WebRTC connection');
      }
      this.connectPeers();
    });

    // Our partner sent its WebRTC peer information
    this.socket.on('got partner peer', (partner) => {
      debug('Got a partner peer', partner);

      this.peer.signal(partner);
    });

    // Our partner requested to change the transfer method
    this.socket.on('set transfer method', (method) => {
      debug('Setting transfer method to', method);

      this.method = method;
    });

    // Our partner has successfully selected a file and confirmed the action
    this.socket.on('partner selected file', () => {
      this.openPage('/transfer');
      this.downloadFiles();
    });

    // Partner disconnected from our transfer
    this.socket.on('partner disconnected', () => {
      debug('Partner disconnected from this transfer');
      if (!this.finishedTransfer) {
        this.openPage('/disconnected');
      }
    });
  }

  /**
   * Prepare the transfer
   */
  constructor() {
    // Connect to socket.io server
    if (process.env.NODE_ENV === 'development') {
      this.socket = socket('localhost:8080');
    } else {
      this.socket = socket();
    }
    this.initSocket();

    // Ask socket server to give us a new receiver ID
    this.socket.emit('new receiver id', this.method, (id) => {
      debug('Received own ID', id);

      this.receiverId = id;

      this.triggerUpdate();
    });
  }

  /**
   * Try to use the receiver ID input into the page
   * @param {number} id Receiver ID
   */
  useReceiver(id) {
    // Reset ID to valid so we can replay the invalid animation if needed
    this.isValidId = true;
    this.triggerUpdate();

    // Make sure ID is 4 digits long
    if (String(id).length !== 4) return;
    // Make sure we are not connecting to ourself
    if (Number(id) === this.receiverId) {
      this.isValidId = false;
      this.triggerUpdate();
      return;
    }

    // Ask the server to connect us the the other peer
    this.socket.emit('use receiver id', id, this.method, (response, method) => {
      if (response === true) {
        // Server informed us that the other peer is valid and listening
        debug('Is valid ID, using', id, method);

        this.isSender = true;
        this.receiverId = id;
        this.method = method;

        this.openPage('/connecting');

        this.connectPeers();
      } else {
        this.isValidId = false;
        this.triggerUpdate();
        debug('Invalid ID');
      }
    });
  }

  /**
   * Lock transfer
   * When selecting files on iOS, the browser will close the socket
   * connection after a few seconds. This is why the browser will
   * "lock" the transfer, allowing the iOS device to reconnect
   * after selecting a file
   */
  lockTransfer() {
    this.socket.emit('lock transfer', this.receiverId);
  }

  /**
   * Connect to the other peer using WebRTC or socket
   */
  connectPeers() {
    debug('Connecting peers');

    if (this.method === 'webrtc') {
      // Setup our own WebRTC Peer
      this.peer = new SimplePeer({
        initiator: this.isSender,
        trickle: false,
        objectMode: true,
      });

      let abortConnection;

      // Listen to events on our peer
      this.peer.on('signal', (data) => {
        debug('Got signal from peer: ', data);

        this.peerSignal = data;

        // Abort connection if not connected after 3 seconds
        abortConnection = setTimeout(() => {
          if (window.type === 'down') {
            debug('Peer connection timed out, using sockets instead');
            this.method = 'socket';

            this.socket.emit('set transfer method', 'socket', this.receiverId);
          }
        }, 3000);

        debug('Sending back peer signal');
        this.socket.emit('set peer signal', data, this.receiverId, this.isSender);
      });
      // We are successfully connected to the other peer
      this.peer.on('connect', () => {
        debug('Connected to peer');

        clearTimeout(abortConnection);
        this.openPage('/select-file');

        if (this.isSender) {
          this.lockTransfer();

          // Automatically open file selection popup
          setTimeout(() => {
            document.querySelector('input[type=file]').click();
          }, 500);
        }
      });
      // There was an error while connecting to the other peer
      // Probably a problem with the network so fall back to using sockets instead
      this.peer.on('error', (err) => {
        debug('Got error while connecting WebRTC', err);

        // Fallback to socket
        this.method = 'socket';
      });
    } else {
      // Transfer method is sockets
      // We are already connected over sockets - simply continue
      this.openPage('/select-file');

      if (this.isSender) {
        this.lockTransfer();

        // Automatically open file selection popup
        setTimeout(() => {
          document.querySelector('input[type=file]').click();
        }, 500);
      }
    }
  }

  /**
   * Trigger an update to the update handler to signal important changes
   * This will cause React to re-render changes
   */
  triggerUpdate() {
    if (this.updateHandler) {
      this.updateHandler();
    }
  }

  /**
   * Upload the currently selected files to our partner
   */
  uploadFiles() {
    // List of last estimates, so we can calculate a more stable estimate
    let lastEstimates = [];

    // Helper method to easily emit new data
    const emit = (data, isFilePart = false, callback = false) => {
      if (this.method === 'webrtc') {
        if (isFilePart) {
          try {
            this.peer.send(data);
          } catch (e) {
            debug('Peer connection has been reset - falling back to sockets');

            // Switching methods will change the transfer speed
            // Delete current estimates to get a more accurate one
            lastEstimates = [];
            this.method = 'socket';
            this.socket.emit('proxy to partner', this.receiverId, {
              type: 'use transfer method',
              method: 'socket'
            });
            emit(data, isFilePart, callback);
            return;
          }
        } else {
          try {
            this.peer.send(JSON.stringify(data));
          } catch (e) {
            debug('Peer connection has been reset - falling back to sockets');

            // Switching methods will change the transfer speed
            // Delete current estimates to get a more accurate one
            lastEstimates = [];
            this.method = 'socket';
            this.socket.emit('proxy to partner', this.receiverId, {
              type: 'use transfer method',
              method: 'socket'
            });
            emit(data, isFilePart, callback);
            return;
          }
        }
        if (callback) {
          callback();
        }
      } else if (isFilePart) {
        this.socket.emit('proxy to partner', this.receiverId, `###${data}`, callback);
      } else {
        this.socket.emit('proxy to partner', this.receiverId, data);
        if (callback) {
          callback();
        }
      }
    };

    // Chunk size is 15kb for WebRTC, 512kb for sockets
    const chunkSize = this.method === 'webrtc' ? 1024 * 15 : 1024 * 512;

    // Reconnect to current transfer if disconnected
    // See comment under "this.lockTransfer"
    this.socket.emit('reconnect', this.socketId, this.receiverId);

    // Inform partner that we have selected a file and will begin transfer
    this.socket.emit('selected file', this.receiverId);

    this.openPage('/transfer');

    // Inform partner about number of files
    emit({
      type: 'number of files',
      num: this.selectedFiles.length
    });

    // Current file index in file event array we are transferring
    let currentFileIndex = 0;

    // Total number of files we need to transfer
    this.totalFiles = this.selectedFiles.length;

    // Status about the current file
    let size;
    let transmitted = 0;
    this.progress = 0;

    // Variables needed to calculate the estimate
    let lastProgress = 0;
    let timeSince = 50;

    this.triggerUpdate();

    // Calculate an estimate every 50ms
    const estimateInterval = setInterval(() => {
      // Don't calculate if we havn't progressed since
      if (lastProgress !== this.progress) {
        const timeForOnePercent = timeSince / (this.progress - lastProgress);
        const percentLeft = 100 - this.progress;
        const currentEstimate = Math.round((percentLeft * timeForOnePercent) / 1000);

        // Keep estimates based on time between intervals
        lastEstimates.push(currentEstimate);

        // Helper function that scales numbers to another range
        // Like arduino "map" function
        // eslint-disable-next-line max-len
        const scale = (num, inMin, inMax, outMin, outMax) => (num - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;

        // Number of estimates we should keep
        const keepEstimates = scale(timeSince, 50, 1000, 50, 5);
        // Remove excess estimates
        while (lastEstimates.length > keepEstimates) {
          lastEstimates.shift();
        }

        // Normalize estimates
        let estimate = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const es of lastEstimates) {
          estimate += es;
        }
        estimate /= lastEstimates.length;
        estimate -= scale(lastEstimates.length, 5, 50, 0.5, 2);
        estimate = Math.round(estimate);

        if (estimate < 0) {
          estimate = 0;
        }

        // Inform partner about our new estimate
        emit({
          type: 'time estimate',
          estimate,
        });

        this.estimate = estimate;
        this.triggerUpdate();

        lastProgress = this.progress;
        timeSince = 50;
      } else {
        timeSince += 50;
      }
    }, 50);

    // Send part of a file
    const sendFileData = (position, currentFile) => {
      // `currentFile` is 0 based but this.currentFile is 1 based so we need to add 1
      this.currentFile = currentFile + 1;
      this.triggerUpdate();

      const file = this.selectedFiles[currentFile];

      if (position === 0) {
        // We are at the beginning of the file - no data has been sent yet
        // Send file information to partner
        emit({
          type: 'new file',
          size: file.size,
          name: file.name,
          fileType: file.type
        });
        ({ size } = file);

        this.currentFileName = file.name;
        this.triggerUpdate();

        debug('Starting new file', file);
      }

      // Start and end of the current chunk
      const start = position * chunkSize;
      const end = start + Math.min(chunkSize, (file.size - start));
      let slice;

      if (file.webkitSlice) {
        slice = file.webkitSlice(start, end);
      } else {
        slice = file.slice(start, end);
      }
      // eslint-disable-next-line no-use-before-define
      reader.readAsArrayBuffer(slice);
    };

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      let data = '';
      if (this.method === 'socket') {
        // Convert ArrayBuffer to string as we cannot send ArrayBuffers over socket.io
        const uintArray = new Uint8Array(readerEvent.target.result);
        uintArray.forEach((byte) => {
          data += String.fromCharCode(byte);
        });
      } else if (this.method === 'webrtc') {
        // WebRTC can send ArrayBuffers so we don't need to convert
        data = readerEvent.target.result;
      }

      // Send file chunk to partner
      emit(data, true, () => {
        transmitted += chunkSize;

        // Check if file transmitted completely
        if (transmitted >= size) {
          debug('Completed transfer of file', currentFileIndex);
          transmitted = 0;
          currentFileIndex += 1;

          // Inform partner that file is complete
          emit({
            type: 'file complete',
          });

          // Check if all files have been transmitted
          if (currentFileIndex >= this.totalFiles) {
            // Finish transfer
            debug('Finished transferring all files');
            this.finishedTransfer = true;

            this.openPage('/completed');

            clearInterval(estimateInterval);

            return;
          }
          debug('Transferring next file', currentFileIndex, this.totalFiles);
        }

        // Calculate progress
        this.progress = (transmitted / size) * 100;
        emit({
          type: 'upload progress',
          progress: this.progress,
        });

        this.triggerUpdate();

        // Get next package
        const position = transmitted / chunkSize;
        sendFileData(position, currentFileIndex);
      });
    };

    // Start file transfer
    sendFileData(0, 0);
  }

  /**
   * Handle downloading and saving the files
   */
  downloadFiles() {
    let parts = [];
    let filesLeft = 1;
    let filesAvailible = 1;
    let currentFile;

    // Set number of files being transferred
    const setFiles = (files) => {
      debug('Setting number of total files to', files);

      filesLeft = files;
      filesAvailible = files;

      this.totalFiles = files;
      this.currentFile = 1;
    };
    // Add a new part to the current file
    const addFileChunk = (part, isBuffer = false) => {
      debug('Adding new chunk to the current file');

      let buffer;
      if (isBuffer) {
        // Use raw buffer
        buffer = part;
      } else {
        // Convert string to ArrayBuffer
        buffer = new ArrayBuffer(part.length);
        const bufView = new Uint8Array(buffer);
        for (let i = 0, strLen = part.length; i < strLen; i += 1) {
          bufView[i] = part.charCodeAt(i);
        }
      }

      parts.push(buffer);
    };
    // Complete and download current file
    const completeFile = (filename, type) => {
      debug('Download of file completed', parts.length, filename);

      // Create file from ArrayBuffers
      const blob = new Blob(parts, { type });

      debug('Created blob from file, saving', blob.size, filename, type);
      saveAs(blob, filename);

      // Reset parts array
      parts = [];

      filesLeft -= 1;

      this.currentFile = filesAvailible - filesLeft;
      this.triggerUpdate();

      if (filesLeft === 0) {
        this.finishedTransfer = true;

        this.openPage('/completed');
      }
    };

    const handleData = (data) => {
      // eslint-disable-next-line no-underscore-dangle
      if (data._isBuffer) {
        addFileChunk(data.buffer, true);
        return;
      } if (typeof data === 'string') {
        // Test if is file chunk
        // File chunks always begin with '###' to indicate that
        // they are not normal JSON data
        if (data.substr(0, 3) === '###') {
          const part = data.substr(3);
          addFileChunk(part);
          return;
        }

        // Parse JSON
        // eslint-disable-next-line no-param-reassign
        data = JSON.parse(data);
      }

      if (data.type === 'number of files') {
        setFiles(data.num);
      } else if (data.type === 'new file') {
        currentFile = data;

        this.currentFileName = data.name;
        this.triggerUpdate();
      } else if (data.type === 'new file part') {
        addFileChunk(data.part);
      } else if (data.type === 'file complete') {
        completeFile(currentFile.name, currentFile.fileType);
      } else if (data.type === 'upload progress') {
        this.progress = data.progress;
      } else if (data.type === 'time estimate') {
        this.estimate = data.estimate;
      } else if (data.type === 'use transfer method') {
        this.method = data.method;
      }

      this.triggerUpdate();
    };

    if (this.method === 'webrtc') {
      this.peer.on('data', (response) => {
        handleData(response);
      });
    }
    this.socket.on('proxy to partner', handleData);
  }
}
