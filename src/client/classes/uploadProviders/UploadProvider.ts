import { TransferFile } from "../../types";
/**
 * An upload Provider provides blymp.io with file data for uploading
 */
export default interface UploadProvider {
  /**
   * Get the download processor needed for this Upload Provider
   */
  getDownloadProcessor() : string;

  /**
   * Returns the number of files that will be uploaded
   */
  getNumberOfFiles() : number;

  /**
   * Get information about a file in the file list
   * 
   * @param index Index of the file
   */
  getFileInfo(index : number) : TransferFile;

  /**
   * Get a slice of a file
   * 
   * @param index Index of the file
   * @param start Start byte
   * @param end End byte
   */
  getFileSlice(index : number, start : number, end : number) : Promise<ArrayBuffer | string>;

  /**
   * Prepare a file if necessary. If any task need to be done before a file can be sent (e.g. compressing it)
   * this should be done in this function
   * 
   * @param index Index of the file
   */
  prepareFile(index : number) : Promise<void>;

  /**
   * Get an estimated file size for all files
   */
  getEstimatedTotalSize() : number;
}