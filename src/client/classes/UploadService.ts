import debugging from 'debug';
import { SimplePeerData } from 'simple-peer';
import Transfer from "./Transfer";
import UploadProvider from "./uploadProviders/UploadProvider";

const debug = debugging('blymp:UploadService');

/**
 * Upload Service that handles uploading data to the partner peer
 */
export default class UploadService {
  /**
   * Current parent transfer
   */
  private transfer : Transfer;

  /**
   * Current Upload Provider that returns the data slices needed for uploading
   */
  private uploadProvider : UploadProvider;

  /**
   * Estimates made about the remaining time.
   * This is used to make the displayed time remaining more smoothed out instead
   * of creating a blank estimate on each packet
   */
  lastEstimates : number[] = [];

  // Variables needed to calculate the estimates
  lastProgress = 0; // Last progess calculated. We use this to calculate how quickly we progress
  timeSince = 50; // Milliseconds since we last seen any change in the progress

  /**
   * Size of a file chunk used when uploading in bytes
   */
  chunkSize : number;

  /**
   * Saves, if this instance has already been used to upload files
   */
  private hasUploaded : boolean = false;

  // Variables about the current file
  size = 0; // Size in bytes
  transmitted = 0; // Transmitted bytes in the current file

  /**
   * Interval that gets executed every 50ms to update the estimated time remaining
   */
  estimateInterval : number | NodeJS.Timeout | undefined;

  /**
   * Function to call after all files have been transferred
   */
   private onUploadDone : Function = () => {};

  /**
   * Create a new upload service
   * 
   * @param transfer Transfer that parents this service
   * @param provider Upload provider that provides the file data
   */
  constructor(transfer : Transfer, provider : UploadProvider) {
    this.transfer = transfer;
    this.uploadProvider = provider;

    // Chunk size is 15kb for WebRTC, 512kb for sockets
    this.chunkSize = transfer.connection.method === 'webrtc' ? 1024 * 15 : 1024 * 512;
  }

  /**
   * Emit a message to the partner
   * 
   * @param data Data to transfer
   * @param isFilePart Set to true if the supplied data is part of the file
   * @param callback Callback to execute once the message is acknowledged from the partner
   */
  private emit(data: String | ArrayBuffer | Object, isFilePart = false, callback : false | Function = false) {
    if (this.transfer.connection.method === 'webrtc') {
      if (!this.transfer.connection.peer) {
        throw new Error('Internal error: Cannot send data as no peer is connected');
      }

      if (isFilePart) {
        try {
          this.transfer.connection.peer.send(data as SimplePeerData);
          if (callback) {
            callback();
          }
        } catch (e) {
          debug('Peer connection has been reset - falling back to sockets');

          // Switching methods will change the transfer speed
          // Delete current estimates to get a more accurate one
          this.lastEstimates = [];
          this.transfer.connection.method = 'socket';
          this.transfer.connection.socket.emit('proxy to partner', this.transfer.receiverId, {
            type: 'use transfer method',
            method: 'socket'
          });
          this.emit(data, isFilePart, callback);
          return;
        }
      } else {
        try {
          this.transfer.connection.peer.send(JSON.stringify(data));
          if (callback) {
            callback();
          }
        } catch (e) {
          debug('Peer connection has been reset - falling back to sockets');

          // Switching methods will change the transfer speed
          // Delete current estimates to get a more accurate one
          this.lastEstimates = [];
          this.transfer.connection.method = 'socket';
          this.transfer.connection.socket.emit('proxy to partner', this.transfer.receiverId, {
            type: 'use transfer method',
            method: 'socket'
          });
          this.emit(data, isFilePart, callback);
          return;
        }
      }
    } else if (isFilePart) {
      this.transfer.connection.socket.emit('proxy to partner', this.transfer.receiverId, `###${data}`, callback);
    } else {
      this.transfer.connection.socket.emit('proxy to partner', this.transfer.receiverId, data);
      if (callback) {
        callback();
      }
    }
  };

  /**
   * Update the estimated time remaining.
   * This function will be executed every 50ms and check how much the transfer has progressed in that time
   */
  private updateEstimate() {
    // Don't calculate if we havn't progressed since
    if (this.lastProgress !== this.transfer.progress) {
      const timeForOnePercent = this.timeSince / (this.transfer.progress - this.lastProgress);
      const percentLeft = 100 - this.transfer.progress;
      const currentEstimate = Math.round((percentLeft * timeForOnePercent) / 1000);

      // Keep estimates based on time between intervals
      this.lastEstimates.push(currentEstimate);

      // Helper function that scales numbers to another range
      // Like arduino "map" function
      // eslint-disable-next-line max-len
      const scale = (num: number, inMin: number, inMax: number, outMin: number, outMax: number) => (num - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;

      // Number of estimates we should keep
      const keepEstimates = scale(this.timeSince, 50, 1000, 50, 5);
      // Remove excess estimates
      while (this.lastEstimates.length > keepEstimates) {
        this.lastEstimates.shift();
      }

      // Normalize estimates
      let estimate = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const es of this.lastEstimates) {
        estimate += es;
      }
      estimate /= this.lastEstimates.length;
      estimate -= scale(this.lastEstimates.length, 5, 50, 0.5, 2);
      estimate = Math.round(estimate);

      if (estimate < 0) {
        estimate = 0;
      }

      // Inform partner about our new estimate
      this.emit({
        type: 'time estimate',
        estimate,
      });

      this.transfer.estimate = estimate;
      this.transfer.triggerUpdate();

      this.lastProgress = this.transfer.progress;
      this.timeSince = 50;
    } else {
      this.timeSince += 50;
    }
  }

  /**
   * Send part of a file to the receiver.
   * This function will recusively call itself until all files are transferred so this method
   * only needs to be executed once.
   * 
   * The function will use the upload provider to request a new slice, then give the new slice to
   * the "handleFileSlice" which will handle sending it and which will also call this method again
   * requesting the next slice.
   * 
   * @param position Position in the file
   */
  private async sendFileData(position: number) {
    if (!this.uploadProvider) {
      throw new Error('Internal error: Cannot upload files as no files were selected');
    }
    
    this.transfer.triggerUpdate();

    
    if (position === 0) {
      // We are at the beginning of the file - no data has been sent yet
      // Let the upload provider prepare the file before we perform any real actions on it
      
      // Already fetch the name for the new file so we can show that info.
      const fileInfoBeforePrepare = this.uploadProvider.getFileInfo(this.transfer.currentFile, true);
      this.transfer.currentFileName = fileInfoBeforePrepare.name;
      this.transfer.triggerUpdate();

      // Let the provider prepare
      await this.uploadProvider.prepareFile(this.transfer.currentFile);
    }

    const fileInfo = this.uploadProvider.getFileInfo(this.transfer.currentFile, false);

    if (position === 0) {
      // We are at the beginning of the file - no data has been sent yet
      // Send file information to partner
      this.emit({
        type: 'new file',
        ...fileInfo
      });
      this.size = fileInfo.size;

      this.transfer.currentFileName = fileInfo.name;
      this.transfer.triggerUpdate();

      debug('Starting new file', fileInfo);
    }

    // Read and handle the chunk
    const start = position * this.chunkSize;
    const end = start + Math.min(this.chunkSize, (fileInfo.size - start));

    debug("Requesting new file slice from provider");
    this.uploadProvider.getFileSlice(this.transfer.currentFile, start, end).then((v) => this.handleFileSlice(v));
  }

  /**
   * Handle packaging and sending of part of file.
   * This method will be called from "sendFileData".
   * 
   * @param value Value of the file slice
   */
  private handleFileSlice(value : string | ArrayBuffer) {
    debug("Got new file slice");

    let data = this.transfer.connection.prepareFileSliceForCurrentMethod(value);

    // Send file chunk to partner
    debug("Transmitting to partner...");
    this.emit(data, true, () => {
      debug("Transmission successful");

      this.transmitted += this.chunkSize;

      // Check if file transmitted completely
      if (this.transmitted >= this.size) {
        // We are done sending this file. Complete the process and start sending the next file
        // or end the transfer if all files are done.
        debug('Completed transfer of file', this.transfer.currentFile);
        this.transmitted = 0;
        this.transfer.currentFile += 1;

        // Inform partner that file is complete
        this.emit({
          type: 'file complete',
        });

        // Reset estimates
        this.transfer.estimate = -1;
        this.lastEstimates = [];
        this.transfer.triggerUpdate();

        // Check if all files have been transmitted
        if (this.transfer.currentFile >= this.uploadProvider.getNumberOfFiles()) {
          // Finish transfer
          debug('Finished transferring all files');
          this.transfer.finishedTransfer = true;
          
          // Wait for partner to confirm they received all data
          this.transfer.transferStatusText = "Waiting for partner to complete downloading...";
          this.transfer.triggerUpdate();
          debug('Waiting for partner to finish transfer...');

          this.transfer.connection.socket.once("acknowledge transfer complete", () => {
            debug('Partner acknowledge the transfer');
            this.onUploadDone();
            this.transfer.openPage('/completed');
            clearInterval(this.estimateInterval as number);
          });
          
          return;
        }
        debug('Transferring next file', this.transfer.currentFile, this.uploadProvider.getNumberOfFiles());
      }

      // Calculate progress
      this.transfer.progress = (this.transmitted / this.size) * 100;
      this.emit({
        type: 'upload progress',
        progress: this.transfer.progress,
      });
      this.transfer.triggerUpdate();

      // Request next package
      const position = this.transmitted / this.chunkSize;
      this.sendFileData(position);
    });
  }

  /**
   * Start the upload of the files in the upload provider
   */
  startUpload() {
    // Make sure each service only gets used once
    if (this.hasUploaded) {
      throw new Error('Illegal state: UploadService can only be used once! Please create a new instance instead');
    }

    return new Promise(resolve => {
      this.onUploadDone = resolve;

      this.transfer.setTransferStatusText("Transferring files...");
  
      // Inform partner which DownloadProcessor they should use
      this.emit({
        type: 'use processor',
        processor: this.uploadProvider.getDownloadProcessor()
      });
  
      // Inform partner about number of files
      this.emit({
        type: 'number of files',
        num: this.uploadProvider.getNumberOfFiles()
      });
  
      // Total number of files we need to transfer
      this.transfer.totalFiles = this.uploadProvider.getNumberOfFiles();
      this.transfer.progress = 0;
  
      // Start estimating the time remaining
      this.estimateInterval = setInterval(() => this.updateEstimate(), 50);
  
      this.transfer.triggerUpdate();
  
      // Start file transfer
      this.sendFileData(0);
    });
  }
}