import pako from "pako";
import debugging from 'debug';
import DownloadProcessor from "./DownloadProcessor";
import Transfer from "../Transfer";

const debug = debugging("blymp:DecompressProcessor");

/**
 * File post-processor that decompresses compressed files using zlib
 */
export default class DecompressProcessor implements DownloadProcessor {
  async process(blob: Blob, transfer : Transfer): Promise<Blob> {
    debug("Decompressing file");

    transfer.setTransferStatusText("Decompressing file...");

    const data = await blob.arrayBuffer();
    const decompressed = pako.inflate(new Uint8Array(data));
    const decompressedBlob = new Blob([decompressed]);

    transfer.setTransferStatusText("Transferring files...");

    debug("Successfully decompressed");

    return decompressedBlob;
  }
}