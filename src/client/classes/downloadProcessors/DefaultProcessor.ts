import DownloadProcessor from "./DownloadProcessor";

/**
 * DefaultProcessor: This processor will simply return the unprocessed blob
 */
export default class DefaultProcessor implements DownloadProcessor {
  process(blob: Blob): Blob {
    return blob;
  }
}