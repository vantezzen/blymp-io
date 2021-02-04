import pako from "pako";
import DownloadProcessor from "./DownloadProcessor";

/**
 * File post-processor that decompresses compressed files using zlib
 */
export default class DecompressProcessor implements DownloadProcessor {
  async process(blob: Blob): Promise<Blob> {
    const data = await blob.arrayBuffer();
    const decompressed = pako.inflate(new Uint8Array(data));
    const decompressedBlob = new Blob([decompressed]);
    return decompressedBlob;
  }
}