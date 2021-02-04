/**
 * Transfer: Stores and manages all information about the current transfer
 */
import SimplePeer from 'simple-peer';
import socket from 'socket.io-client';
import debugging from 'debug';
import analytics from '../analytics';
import UploadProvider from './uploadProviders/UploadProvider';
import UploadService from './UploadService';
import DownloadService from './DownloadService';

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
   * UploadProvider used for uploading data
   */
  uploadProvider : UploadProvider | undefined;

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
    if (!this.uploadProvider) {
      throw new Error('Internal error: Cannot upload data as no upload provider was set');
    }

    analytics("start-upload");

    // Reconnect to current transfer if disconnected
    // See comment under "this.lockTransfer"
    this.socket.emit('reconnect', this.socketId, this.receiverId);

    // Inform partner that we have selected a file and will begin transfer
    this.socket.emit('selected file', this.receiverId);

    // Open the transfer page that shows the current status of the transfer
    this.openPage('/transfer');

    // The UploadService is doing all the work of actually transmitting the data
    const service = new UploadService(this, this.uploadProvider);
    service.startUpload();
  }

  /**
   * Handle downloading and saving the files
   */
  downloadFiles() {
    analytics("start-download");

    // Create a DownloadService to handle actually receiving the data
    const service = new DownloadService(this);
    service.startDownload();
  }
}
