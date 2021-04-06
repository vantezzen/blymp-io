import debugging from 'debug';
import { TransferFile } from "../../types";
import UploadProvider from "./UploadProvider";

const debug = debugging("blymp:FileInputUploadProvider");

/**
 * File Input Provider allows sending data from a <input type="file"> element.
 * For documentation on method usage please refer to the documentation of the "UploadProvider"
 */
export default class FileInputUploadProvider implements UploadProvider {
  /**
   * Files that got selected in the file input
   */
  private selectedFiles : FileList;

  /**
   * Current FileReader used for reading the FileInput files
   */
  private reader : FileReader;

  /**
   * Current Promise resolver
   */
  private currentResolver : ((buffer : string | ArrayBuffer) => any) | undefined;

  constructor(files : FileList) {
    debug("Creating new Upload Provider for file list");

    this.selectedFiles = files;
    this.reader = new FileReader();

    this.reader.onload = (readerEvent) => {
      if (!readerEvent.target || !readerEvent.target.result) {
        throw new Error('Internal error: Reader target or result is undefined');
      }
      if (!this.currentResolver) {
        throw new Error('Internal error: FileInputUploadProvider does not have a current resolver');
      }

      debug("Read new file part - informing resolver");
      this.currentResolver(readerEvent.target.result);

      // Remove the resolver as it has already been used
      this.currentResolver = undefined;
    };
  }
  
  getEstimatedTotalSize(): number {
    let size = 0;

    for (let i = 0; i < this.selectedFiles.length; i++) {
      size += this.selectedFiles[i].size;
    }

    debug("Estimating size to be ", size, "bytes");

    return size;
  }

  prepareFile(_: number): Promise<void> {
    // This provider doesn't need to do any preperations
    debug("Preparing file - nothing to prepare");
    return Promise.resolve();
  }

  getFileSlice(index: number, start: number, end: number) : Promise<ArrayBuffer | string> {
    if (this.currentResolver !== undefined) {
      throw new Error('Internal error: Tried to start new read operation before current read finished');
    }

    debug("Starting file reader for new slice");
    
    // Return an empty promise but save the resolver. This way we can later resolve this promise using our reader's
    // "onload" event
    return new Promise((resolve) => {
      // Read the slice of the file using the .slice API
      const file = this.selectedFiles[index];
      let slice: Blob;

      if (file.webkitSlice) {
        slice = file.webkitSlice(start, end);
      } else {
        slice = file.slice(start, end);
      }

      this.reader.readAsArrayBuffer(slice);

      this.currentResolver = resolve;
    });
  }

  getFileInfo(index: number): TransferFile {
    const file = this.selectedFiles[index];
    return {
      size: file.size,
      name: file.name,
      fileType: file.type
    };
  }

  getNumberOfFiles(): number {
    return this.selectedFiles.length;
  }

  getDownloadProcessor(): string {
    return "DefaultProcessor";
  }
}