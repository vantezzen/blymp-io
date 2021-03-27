import debugging from 'debug';
import analytics from '../analytics';
import UploadProvider from './uploadProviders/UploadProvider';
import UploadService from './UploadService';
import DownloadService from './DownloadService';
import CompressionUploadProvider from './uploadProviders/CompressionUploadProvider';
import Connection from './Connection';

const debug = debugging('blymp:transfer');

/**
 * Transfer: Stores and manages all information about the current transfer
 */
export default class Transfer {
  /**
   * Is this page the sending end of the transfer?
   * @type Boolean
   */
  isSender: boolean = false;

  /**
   * Our own receiver id
   * @type Number, 4 digit
   */
  receiverId: number | null = null;

  /**
   * Is the current input receiver ID valid?
   * Used to display the invalid animation
   * @type Boolean
   */
  isValidId: boolean = true;

  /**
   * Handler that gets called once an important change happens.
   * This allows us to update the React UI when there are changes in the transfer
   * @type Function
   */
  updateHandler: Function = () => {};

  /**
   * Open a page using react router.
   * This will get set by a React component that has access to Hooks
   * @type Function
   */
  openPage: Function = (_ : String) => {}

  /**
   * Number of files that are being transferred
   * @type Integer
   */
  totalFiles: number = 0;

  /**
   * Current file we are transferring
   * @type Integer
   */
  currentFile: number = 0;

  /**
   * Name of the file we are currently transferring
   */
  currentFileName = '';

  /**
   * Is this transfer completed?
   * @type Boolean
   */
  finishedTransfer: boolean = false;

  /**
   * Estimated time needed for the transfer to be completed in seconds
   * @type Integer
   */
  estimate: number = -1;

  /**
   * Number between 0-100, indicating the progress of the transfer of the current file
   * @type Integer
   */
  progress: number = 0;

  /**
   * UploadProvider used for uploading data
   */
  uploadProvider : UploadProvider | undefined;

  /**
   * Text that should be shown on the "transfer" page
   */
  transferStatusText : String = "Transferring files...";

  connection : Connection;

  /**
   * Prepare the transfer
   */
  constructor() {
    this.connection = new Connection(this);
  }

  /**
   * Try to connect to a client using the 4-digit code
   * @param {number} id Receiver ID (4-digit code)
   */
  useReceiver(id: number) {
    // Reset ID to valid so we can replay the invalid animation if needed
    this.isValidId = true;
    this.triggerUpdate();

    // Make sure ID is 4 digits long
    if (String(id).length !== 4) return;
    // Make sure we are not connecting to ourself
    if (Number(id) === this.receiverId) {
      this.isValidId = false;
      this.triggerUpdate();
      analytics("connected-to-self");
      debug("Tried to connect to self - aborting");
      return;
    }

    this.connection.useReceiverId(id);
  }

  /**
   * Trigger an update to the update handler to signal important changes
   * This will cause React to re-render changes
   */
  triggerUpdate() {
    if (this.updateHandler) {
      this.updateHandler();
    }
  }

  /**
   * Set text for transfer status and inform partner to show the same text
   */
  setTransferStatusText(text : String) {
    this.transferStatusText = text;
    this.connection.sendTransferStatusText();
    this.triggerUpdate();
  }

  /**
   * Upload the currently selected files to our partner
   */
  async uploadFiles() {
    debug("Starting upload");

    if (!this.uploadProvider) {
      throw new Error('Internal error: Cannot upload data as no upload provider was set');
    }

    analytics("start-upload");

    // Prepare our partner for the file transfer
    this.connection.prepareUpload();

    this.setTransferStatusText("Preparing transfer...");

    // Open the transfer page that shows the current status of the transfer
    this.openPage('/transfer');

    // Add compression if the file size is over 10kb but under 1GB
    if (
      this.uploadProvider.getEstimatedTotalSize() > (1024 * 10) && 
      this.uploadProvider.getEstimatedTotalSize() < (1024 * 1024 * 1024)
    ) {
      debug("Adding Compression Provider as we are in the right range");
      this.uploadProvider = new CompressionUploadProvider(this.uploadProvider, this);
    }

    // The UploadService is doing all the work of actually transmitting the data
    debug("Starting Upload Service");
    const service = new UploadService(this, this.uploadProvider);
    await service.startUpload();
    this.connection.disconnectAll();
  }

  /**
   * Handle downloading and saving the files
   */
  async downloadFiles() {
    debug("Starting download");
    analytics("start-download");

    // Create a DownloadService to handle actually receiving the data
    debug("Starting download service");
    const service = new DownloadService(this);
    await service.startDownload();
    this.connection.disconnectAll();
  }
}
