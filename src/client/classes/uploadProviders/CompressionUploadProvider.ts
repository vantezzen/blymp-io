import pako from 'pako';
import { TransferFile } from "../../types";
import UploadProvider from "./UploadProvider";

/**
 * Compression Upload Provider: This provider wraps around other Upload Providers
 * to compress uploaded files.
 * 
 * This class works in conjunction with the "Decompress" download processor
 */
export default class CompressionUploadProvider implements UploadProvider {
  /**
   * Upload provider we are wrapping
   */
  private provider : UploadProvider;

  /**
   * Data for the compressed file
   */
  private compressedFile : Uint8Array | undefined;

  constructor(provider : UploadProvider) {
    this.provider = provider;
  }

  getEstimatedTotalSize(): number {
    // Let us estimate that we can save 25% by compressing the files
    return this.provider.getEstimatedTotalSize() * 0.75;
  }

  getDownloadProcessor(): string {
    return "DecompressProcessor";
  }

  getNumberOfFiles(): number {
    // Simply redirect to the wrapped provider
    return this.provider.getNumberOfFiles();
  }

  getFileInfo(index: number): TransferFile {
    if (!this.compressedFile) {
      throw new Error('Internal error: Compressed file does not exist yet');
    }

    const generalInfo = this.provider.getFileInfo(index);
    return {
      ...generalInfo,
      size: this.compressedFile.byteLength
    };
  }

  getFileSlice(_: number, start: number, end: number): Promise<string | ArrayBuffer> {
    if (!this.compressedFile) {
      throw new Error('Internal error: Compressed file does not exist yet');
    }
    const slice = this.compressedFile.slice(start, end);

    return Promise.resolve(slice);
  }

  prepareFile(index: number): Promise<void> {
    return new Promise(async (resolve : Function) => {
      // Read the whole file from the wrapped provider
      await this.provider.prepareFile(index);
      const fileInfo = this.provider.getFileInfo(index);
      const fileContent = await this.provider.getFileSlice(index, 0, fileInfo.size);

      // Compress it using pako
      const data = new Uint8Array(fileContent as ArrayBufferLike);
      this.compressedFile = pako.deflate(data);

      resolve();
    });
  }

  
}