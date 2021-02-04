/**
 * Transfer: Stores and manages all information about the current transfer
 */
import SimplePeer, { SimplePeerData } from 'simple-peer';
import socket from 'socket.io-client';
import { saveAs } from 'file-saver';
import debugging from 'debug';
import analytics from '../analytics';
import { BufferLike, TransferControlMessage, TransferFile } from '../types';

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
  socket : SocketIOClient.Socket;

  /**
   * Is this page the sending end of the transfer?
   * @type Boolean
   */
  isSender: boolean = false;

  /**
   * ID of the socket.io socket. This will be saved so we can resume
   * a socket after the connection has been lost
   * @type String
   */
  socketId: string | null = null;

  /**
   * Our own receiver id
   * @type Number, 4 digit
   */
  receiverId: number | null = null;

  /**
   * Is the current input receiver ID valid?
   * Used to display the invalid animation
   * @type Boolean
   */
  isValidId: boolean = true;

  /**
   * Handler that gets called once an important change happens.
   * This allows us to update the React UI when there are changes in the transfer
   * @type Function
   */
  updateHandler: Function = () => {};

  /**
   * WebRTC peer that we are connected to
   */
  peer : SimplePeer.Instance | null = null;

  /**
   * Signal that we got from our peer
   * @type Object
   */
  peerSignal: object | null = null;

  /**
   * Open a page using react router.
   * This will get set by a React component that has access to Hooks
   * @type Function
   */
  openPage: Function = (_ : String) => {}

  /**
   * Number of files that are being transferred
   * @type Integer
   */
  totalFiles: number = 0;

  /**
   * Current file we are transferring
   * @type Integer
   */
  currentFile: number = 0;

  /**
   * Name of the file we are currently transferring
   */
  currentFileName = '';

  /**
   * Is this transfer completed?
   * @type Boolean
   */
  finishedTransfer: boolean = false;

  /**
   * Estimated time needed for the transfer to be completed in seconds
   * @type Integer
   */
  estimate: number = 10;

  /**
   * Number between 0-100, indicating the progress of the transfer of the current file
   * @type Integer
   */
  progress: number = 0;

  /**
   * Files that the user selected and wants to transfer
   * @type Array
   */
  selectedFiles: FileList | undefined;

  /**
   * Initialize the socket to listen for status changes
   */
  initSocket() {
    this.socket.on('connect', () => {
      debug('Connected socket');

      if (!this.socketId) {
        this.socketId = this.socket.id;
      }
    });

    // Someone entered our receiver ID
    this.socket.on('pair partner found', (method : string) => {
      debug('Found a pair partner', method);
      analytics("found-partner");

      this.openPage('/connecting');

      this.method = method;

      if (method === 'webrtc') {
        debug('Opening connection for WebRTC connection');
      }
      this.connectPeers();
    });

    // Our partner sent its WebRTC peer information
    this.socket.on('got partner peer', (partner : SimplePeer.SignalData) => {
      debug('Got a partner peer', partner);

      if (!this.peer) {
        throw new Error('Internal error: Peer is undefined');
      }

      this.peer.signal(partner);
    });

    // Our partner requested to change the transfer method
    this.socket.on('set transfer method', (method : string) => {
      debug('Setting transfer method to', method);

      this.method = method;
    });

    // Our partner has successfully selected a file and confirmed the action
    this.socket.on('partner selected file', () => {
      this.openPage('/transfer');
      analytics("partner-selected-file");
      this.downloadFiles();
    });

    // Partner disconnected from our transfer
    this.socket.on('partner disconnected', () => {
      debug('Partner disconnected from this transfer');
      analytics("partner-disconnected");
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
    this.socket.emit('new receiver id', this.method, (id: number) => {
      debug('Received own ID', id);
      analytics("generated-id");

      this.receiverId = id;

      this.triggerUpdate();
    });
  }

  /**
   * Try to use the receiver ID input into the page
   * @param {number} id Receiver ID
   */
  useReceiver(id: number) {
    // Reset ID to valid so we can replay the invalid animation if needed
    this.isValidId = true;
    this.triggerUpdate();

    // Make sure ID is 4 digits long
    if (String(id).length !== 4) return;
    // Make sure we are not connecting to ourself
    if (Number(id) === this.receiverId) {
      this.isValidId = false;
      this.triggerUpdate();
      analytics("connected-to-self");
      return;
    }

    // Ask the server to connect us the the other peer
    this.socket.emit('use receiver id', id, this.method, (response : boolean, method : string) => {
      if (response === true) {
        // Server informed us that the other peer is valid and listening
        debug('Is valid ID, using', id, method);
        analytics("entered-valid-id");

        this.isSender = true;
        this.receiverId = id;
        this.method = method;

        this.openPage('/connecting');

        this.connectPeers();
      } else {
        analytics("entered-invalid-id");
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

    const openFileSelect = () => {
      this.openPage('/select-file');

      if (this.isSender) {
        this.lockTransfer();

        // Automatically open file selection popup
        setTimeout(() => {
          const input : HTMLInputElement | null = document.querySelector('input[type=file]');
          if(input) {
            input.click();
          }
        }, 500);
      }
    };

    if (this.method === 'webrtc') {
      // Helper: Fallback to socket connection if WebRTC fails
      const fallbackToSockets = () => {
        this.method = 'socket';
        this.socket.emit('set transfer method', 'socket', this.receiverId);
        openFileSelect();
      }

      // Setup our own WebRTC Peer
      this.peer = new SimplePeer({
        initiator: this.isSender,
        trickle: false,
        objectMode: true,
      });

      let abortConnection: NodeJS.Timeout | number;

      // Listen to events on our peer
      this.peer.on('signal', (data: object) => {
        debug('Got signal from peer: ', data);

        this.peerSignal = data;

        // Abort connection if not connected after 3 seconds
        abortConnection = setTimeout(() => {
          if (!this.isSender) {
            debug('Peer connection timed out, using sockets instead');
            fallbackToSockets();
          }
        }, 3000);

        debug('Sending back peer signal');
        this.socket.emit('set peer signal', data, this.receiverId, this.isSender);
      });
      // We are successfully connected to the other peer
      this.peer.on('connect', () => {
        debug('Connected to peer');

        clearTimeout(abortConnection as NodeJS.Timeout);
        openFileSelect();
      });
      // There was an error while connecting to the other peer
      // Probably a problem with the network so fall back to using sockets instead
      this.peer.on('error', (err: any) => {
        debug('Got error while connecting WebRTC', err);

        fallbackToSockets();
      });
    } else {
      // Transfer method is sockets
      // We are already connected over sockets - simply continue
      openFileSelect();
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
    if (!this.selectedFiles) {
      throw new Error('Internal error: Cannot upload files as no files were selected');
    }

    // List of last estimates, so we can calculate a more stable estimate
    let lastEstimates : number[] = [];

    analytics("start-upload");

    // Helper method to easily emit new data
    const emit = (data: String | ArrayBuffer | Object, isFilePart = false, callback : false | Function = false) => {
      if (this.method === 'webrtc') {
        if (!this.peer) {
          throw new Error('Internal error: Cannot send data as no peer is connected');
        }

        if (isFilePart) {
          try {
            this.peer.send(data as SimplePeerData);
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
    let size: number;
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
        const scale = (num: number, inMin: number, inMax: number, outMin: number, outMax: number) => (num - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;

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
    const sendFileData = (position: number, currentFile: number) => {
      if (!this.selectedFiles) {
        throw new Error('Internal error: Cannot upload files as no files were selected');
      }
      
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
      let slice: Blob;

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
      let data : String | ArrayBuffer = '';

      if (!readerEvent.target || !readerEvent.target.result) {
        throw new Error('Internal error: Reader target or result is undefined');
      }

      if (this.method === 'socket') {
        // Convert ArrayBuffer to string as we cannot send ArrayBuffers over socket.io
        const uintArray = new Uint8Array(readerEvent.target.result as ArrayBuffer);
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
    let parts : Array<string | ArrayBuffer> = [];
    let filesLeft = 1;
    let filesAvailible = 1;
    let currentFile : TransferFile;

    analytics("start-download");

    // Set number of files being transferred
    const setFiles = (files: number) => {
      debug('Setting number of total files to', files);

      filesLeft = files;
      filesAvailible = files;

      this.totalFiles = files;
      this.currentFile = 1;
    };
    // Add a new part to the current file
    const addFileChunk = (part: string | ArrayBuffer, isBuffer = false) => {
      debug('Adding new chunk to the current file');

      let buffer: ArrayBuffer;
      if (isBuffer) {
        // Use raw buffer
        buffer = part as ArrayBuffer;
      } else {
        const p = part as string;
        // Convert string to ArrayBuffer
        buffer = new ArrayBuffer(p.length);
        const bufView = new Uint8Array(buffer);
        for (let i = 0, strLen = p.length; i < strLen; i += 1) {
          bufView[i] = p.charCodeAt(i);
        }
      }

      parts.push(buffer);
    };
    // Complete and download current file
    const completeFile = (filename: string, type: string) => {
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

    const handleData = (data: string | BufferLike | TransferControlMessage) => {
      // eslint-disable-next-line no-underscore-dangle
      if ((data as BufferLike)._isBuffer) {
        addFileChunk((data as BufferLike).buffer, true);
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

      const message = data as TransferControlMessage;
      if (message.type === 'number of files') {
        setFiles(message.num as number);
      } else if (message.type === 'new file') {
        if (!message.name || !message.fileType) {
          throw new Error('Internal Error: Received file is not valid');
        }

        // We already validated that message is a valid Transferfile above but Typescript
        // doesn't correctly identify this so we need to convert to unknown first
        currentFile = message as unknown as TransferFile;

        this.currentFileName = message.name as string;
        this.triggerUpdate();
      } else if (message.type === 'new file part') {
        addFileChunk(message.part as string);
      } else if (message.type === 'file complete') {
        completeFile(currentFile.name, currentFile.fileType);
      } else if (message.type === 'upload progress') {
        this.progress = message.progress as number;
      } else if (message.type === 'time estimate') {
        this.estimate = message.estimate as number;
      } else if (message.type === 'use transfer method') {
        this.method = message.method as string;
      }

      this.triggerUpdate();
    };

    if (this.method === 'webrtc') {
      if (!this.peer) {
        throw new Error('Internal Error: Peer is undefined');
      }
      this.peer.on('data', (response: string | BufferLike | TransferControlMessage) => {
        handleData(response);
      });
    }
    this.socket.on('proxy to partner', handleData);
  }
}
