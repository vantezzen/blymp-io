import debugging from 'debug';
import { saveAs } from 'file-saver';
import { BufferLike, TransferControlMessage, TransferFile } from '../types';
import DecompressProcessor from './downloadProcessors/DecompressProcessor';
import DefaultProcessor from './downloadProcessors/DefaultProcessor';
import DownloadProcessor from './downloadProcessors/DownloadProcessor';
import Transfer from './Transfer';

const debug = debugging('blymp:DownloadService');

/**
 * The Download Service handles downloading and packaging any real file data
 */
export default class DownloadService {
  /**
   * Transfer instance parenting this service
   */
  private transfer : Transfer;

  /**
   * Parts for the current file that we have received thus far
   */
  private parts : Array<string | ArrayBuffer> = [];

  /**
   * Number of files left in transfer
   */
  private filesLeft = 1;

  /**
   * Total number of files available for download
   */
  private filesAvailible = 1;

  /**
   * Information about the current file
   */
  private currentFile : TransferFile | undefined;

  /**
   * Processor used to postprocess the current file
   */
  private processor : DownloadProcessor | undefined;

  /**
   * Flag to make sure a download service is only used once
   */
  private hasDownloadedFiles = false;

  /**
   * Function to call after all files have been transferred
   */
  private onDownloadDone : Function = () => {};

  /**
   * Create a new Download Service
   * 
   * @param transfer Transfer instance parenting this service
   */
  constructor(transfer : Transfer) {
    this.transfer = transfer;

    this.handleData = this.handleData.bind(this);
  }

  /**
   * Set number of files being downloaded
   * 
   * @param files Number of files
   */
  private setFiles(files: number) {
    debug('Setting number of total files to', files);

    this.filesLeft = files;
    this.filesAvailible = files;

    this.transfer.totalFiles = files;
    this.transfer.currentFile = 0;
  }

  /**
   * Add a new file chunk to the parts
   * 
   * @param part Chunk data
   * @param isBuffer Is the provided part a Buffer
   */
  private addFileChunk(part: string | ArrayBuffer, isBuffer = false) {
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

    this.parts.push(buffer);
  };

  /**
   * Complete and download the current file
   */
  private async completeFile() {
    if (!this.currentFile) {
      throw new Error('State error: Cannot complete file if no file is selected');
    }

    debug('Download of file completed', this.parts.length, this.currentFile.name);

    const type = this.currentFile.fileType;

    // Create file from ArrayBuffers
    let blob = new Blob(this.parts, { type });

    // Preprocess the file if we have a processor to do so
    if (this.processor) {
      blob = await this.processor.process(blob, this.transfer);
    }

    // Save the file to disk
    debug('Created blob from file, saving', blob.size, this.currentFile.name, type);
    saveAs(blob, this.currentFile.name);

    // Reset parts array
    this.parts = [];

    this.filesLeft -= 1;

    // Update the count on the page
    this.transfer.currentFile = this.filesAvailible - this.filesLeft;
    this.transfer.triggerUpdate();

    if (this.filesLeft === 0) {
      // We have successfully transferred all files
      this.transfer.finishedTransfer = true;
      this.onDownloadDone();
      this.transfer.openPage('/completed');
    }
  }

  /**
   * Handle receiving a new data message from the sender
   * 
   * @param data Data received
   */
  private async handleData(data: string | BufferLike | TransferControlMessage) {
    // eslint-disable-next-line no-underscore-dangle
    if ((data as BufferLike)._isBuffer) {
      this.addFileChunk((data as BufferLike).buffer, true);

      if (this.transfer.connection.method === "webrtc") {
        debug("Acknowledging data received via RTC");
        this.transfer.connection.socket.emit("acknowledge rtc data", this.transfer.receiverId);
      }

      return;
    } if (typeof data === 'string') {
      // Test if is file chunk
      // File chunks always begin with '###' to indicate that
      // they are not normal JSON data
      if (data.substr(0, 3) === '###') {
        const part = data.substr(3);
        this.addFileChunk(part);
        return;
      }

      // Parse JSON
      // eslint-disable-next-line no-param-reassign
      data = JSON.parse(data);
    }

    const message = data as TransferControlMessage;
    if (message.type === 'number of files') {
      this.setFiles(message.num as number);
    } else if (message.type === 'new file') {
      if (!message.name || !message.fileType) {
        throw new Error('Internal Error: Received file is not valid');
      }

      // We already validated that message is a valid Transferfile above but Typescript
      // doesn't correctly identify this so we need to convert to unknown first
      this.currentFile = message as unknown as TransferFile;

      this.transfer.currentFileName = message.name as string;
      this.transfer.triggerUpdate();
    } else if (message.type === 'new file part') {
      this.addFileChunk(message.part as string);
    } else if (message.type === 'file complete') {
      await this.completeFile();
    } else if (message.type === 'upload progress') {
      this.transfer.progress = message.progress as number;
    } else if (message.type === 'time estimate') {
      this.transfer.estimate = message.estimate as number;
    } else if (message.type === 'use transfer method') {
      this.transfer.connection.method = message.method as string;
    } else if (message.type === 'use processor') {
      switch(message.processor) {
        case 'DefaultProcessor':
          this.processor = new DefaultProcessor();
          break;
        case 'DecompressProcessor':
          this.processor = new DecompressProcessor();
          break;
        default:
          throw new Error('Internal error: Partner requested unknown download processor: ' + message.processor);
      }
    }

    this.transfer.triggerUpdate();
  }

  /**
   * Start listening on the transfer methods for data
   */
  startDownload() {
    if (this.hasDownloadedFiles) {
      throw new Error('Illegal state: DownloadService can only be used once! Please create a new instance instead');
    }

    return new Promise(resolve => {
      this.onDownloadDone = resolve;

      if (this.transfer.connection.method === 'webrtc') {
        if (!this.transfer.connection.peer) {
          throw new Error('Internal Error: Peer is undefined');
        }
        this.transfer.connection.peer.on('data', async (response: string | BufferLike | TransferControlMessage) => {
          await this.handleData(response);
        });
      }
      this.transfer.connection.socket.on('proxy to partner', this.handleData);
  
      this.hasDownloadedFiles = true;
    });
  }
}