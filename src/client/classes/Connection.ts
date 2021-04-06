import SimplePeer from 'simple-peer';
import debugging from 'debug';
import socket from 'socket.io-client';
import Transfer from './Transfer';
import analytics from '../analytics';

const debug = debugging('blymp:Connection');

/**
 * Connection provides the connections for the transfer to allow communicating with
 * the main server and the partner client.
 * It also handles basic events that could be received from the server
 */
export default class Connection {
  /**
   * Transfer method
   * One of: 'webrtc', 'socket'
   * @type String
   */
  method = SimplePeer.WEBRTC_SUPPORT ? 'webrtc' : 'socket';

  /**
   * Current socket.io connection
   */
  socket: SocketIOClient.Socket;

  /**
   * ID of the socket.io socket. This will be saved so we can resume
   * a socket after the connection has been lost
   * @type String
   */
  socketId: string | null = null;

  /**
   * WebRTC peer that we are connected to
   */
  peer: SimplePeer.Instance | null = null;

  /**
   * Signal that we got from our peer
   * @type Object
   */
  peerSignal: object | null = null;

  /**
   * Current transfer
   */
  transfer: Transfer;

  /**
   * Create new connection
   * 
   * @param transfer Transfer that uses this connection
   */
  constructor(transfer: Transfer) {
    this.transfer = transfer;

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

      this.transfer.receiverId = id;

      this.transfer.triggerUpdate();
    });
  }


  /**
   * Initialize the socket to listen for status changes
   */
  initSocket() {
    const that = this;

    this.socket.on('connect', () => {
      debug('Connected socket');

      if (!this.socketId) {
        this.socketId = this.socket.id;
      }
    });

    // Someone entered our receiver ID
    this.socket.on('pair partner found', (method: string) => {
      debug('Found a pair partner', method);
      analytics("found-partner");

      this.transfer.openPage('/connecting');

      this.method = method;

      if (method === 'webrtc') {
        debug('Opening connection for WebRTC connection');
      }
      this.connectPeers();
    });

    // Our partner sent its WebRTC peer information
    this.socket.on('got partner peer', (partner: SimplePeer.SignalData) => {
      debug('Got a partner peer', partner);

      if (!this.peer) {
        throw new Error('Internal error: Peer is undefined');
      }

      this.peer.signal(partner);
    });

    // Our partner requested to change the transfer method
    this.socket.on('set transfer method', (method: string) => {
      debug('Setting transfer method to', method);

      this.method = method;
    });

    // Our partner has successfully selected a file and confirmed the action
    this.socket.on('partner selected file', () => {
      this.transfer.openPage('/transfer');
      analytics("partner-selected-file");
      this.transfer.downloadFiles();
    });

    // Partner disconnected from our transfer
    this.socket.on('partner disconnected', () => {
      debug('Partner disconnected from this transfer');
      analytics("partner-disconnected");
      if (!this.transfer.finishedTransfer) {
        this.transfer.openPage('/disconnected');
      }
    });

    // Set text to be shown on the transfer page
    this.socket.on('proxy to partner', (data: {
      type: string,
      [key: string]: any
    }) => {
      if (data.type && data.type === "transferStatusText") {
        debug('Got transfer status text', data.text);

        that.transfer.transferStatusText = data.text;
        that.transfer.triggerUpdate();
      }
    });
  }

  useReceiverId(id: number) {
    // Ask the server to connect us the the other peer
    this.socket.emit('use receiver id', id, this.method, (response: boolean, method: string) => {
      if (response === true) {
        // Server informed us that the other peer is valid and listening
        debug('Is valid ID, using', id, method);
        analytics("entered-valid-id");

        this.transfer.isSender = true;
        this.transfer.receiverId = id;
        this.method = method;

        this.transfer.openPage('/connecting');

        this.connectPeers();
      } else {
        analytics("entered-invalid-id");
        this.transfer.isValidId = false;
        this.transfer.triggerUpdate();
        debug('Invalid ID');
      }
    });
  }

  /**
   * Lock transfer
   * When selecting files on iOS, the browser will close the socket
   * connection after a few seconds. This is why the browser will
   * "lock" the transfer, allowing the iOS device to reconnect
   * after selecting a file.
   * "Locking" the transfer results in the partner peer not getting
   * informed about this peer disconnecting and is a signal for the server's
   * garbage collector to not remove this transfer yet.
   */
  lockTransfer() {
    debug("Locking transfer")
    this.socket.emit('lock transfer', this.transfer.receiverId);
  }

  /**
   * Connect to the other peer using WebRTC or socket.
   * This function should be executed after we know who our partner is but before we transfer
   * files.
   */
  connectPeers() {
    debug('Connecting peers');

    // Open the "File selection" screen. This will get called when we are connected
    const openFileSelect = () => {
      this.transfer.openPage('/select-file');

      if (this.transfer.isSender) {
        this.lockTransfer();

        // Automatically open file selection popup
        setTimeout(() => {
          const input: HTMLInputElement | null = document.querySelector('input[type=file]');
          if (input) {
            input.click();
          }
        }, 500);
      }
    };

    if (this.method === 'webrtc') {
      // Helper: Fallback to socket connection if WebRTC fails
      const fallbackToSockets = () => {
        this.method = 'socket';
        this.socket.emit('set transfer method', 'socket', this.transfer.receiverId);
        openFileSelect();
      }

      // Setup our own WebRTC Peer
      this.peer = new SimplePeer({
        initiator: this.transfer.isSender,
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
          if (!this.transfer.isSender) {
            debug('Peer connection timed out, using sockets instead');
            fallbackToSockets();
          }
        }, 3000);

        debug('Sending back peer signal');
        this.socket.emit('set peer signal', data, this.transfer.receiverId, this.transfer.isSender);
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
      debug("Using Sockets to transfer so we don't need to connect");
      openFileSelect();
    }
  }

  /**
   * Prepare our partner for the upcomming transfer
   */
  prepareUpload() {
    // Reconnect to current transfer if disconnected
    // See comment under "this.lockTransfer" for more information on why we might be
    // disconnected
    this.socket.emit('reconnect', this.socketId, this.transfer.receiverId);
    debug("Reconnected to socket if connection was lost during file selection");

    // Inform partner that we have selected a file and will begin transfer
    this.socket.emit('selected file', this.transfer.receiverId);
    debug("Informed partner about our file selection");
  }

  /**
   * Prepare a file slice in a way that allows transferring it over the current
   * transfer method.
   * 
   * WebSocket Transfer requires us to convert the ArrayBuffer to a string, WebRTC can
   * transfert that Buffer directly.
   * 
   * This function will automatically prepare the data based on the method used
   * 
   * @param value Value to prepare
   * @return Prepared value
   */
  prepareFileSliceForCurrentMethod(value: string | ArrayBuffer) {
    let data: String | ArrayBuffer = value;

    if (this.transfer.connection.method === 'socket') {
      // Convert ArrayBuffer to string as we cannot send ArrayBuffers over socket.io
      data = '';
      const uintArray = new Uint8Array(value as ArrayBuffer);
      uintArray.forEach((byte) => {
        data += String.fromCharCode(byte);
      });
      return data;
    }

    // WebRTC can send ArrayBuffers so we don't need to convert

    return data;
  }

  /**
   * Send text for transfer status to partner to show the same text
   * across broth devices
   */
  sendTransferStatusText() {
    this.socket.emit('proxy to partner', this.transfer.receiverId, {
      type: 'transferStatusText',
      text: this.transfer.transferStatusText
    });
  }

  /**
   * Disconnect from connections so we don't accidentally trigger some events
   */
  disconnectAll() {
    debug("Disconnecting all connnections");
    // this.socket.disconnect();
    if (this.peer) {
      this.peer.destroy();
    }
  }
}