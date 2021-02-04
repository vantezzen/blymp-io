/**
 * A download Processor processes the downloaded data before letting the user download it
 */
export default interface DownloadProcessor {
  /**
   * Process a downloaded file before the user gets to open it
   * @param blob Blob to process
   */
  process(blob:Blob) : Blob;
}