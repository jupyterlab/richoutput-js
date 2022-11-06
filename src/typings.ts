export interface IOutput {
  data: { [index: string]: any };
  metadata: { [index: string]: any };
}

export interface IRender {
  render?(
    output: IOutput,
    element: HTMLDivElement,
    context: Context,
  ): Promise<void>;
}


export declare interface Context {
  getModelState(modelId: string): Promise<Map<string, ModelState>>;
}

export declare interface ModelState {
  readonly modelName: string;
  readonly modelModule: string;
  readonly modelModuleVersion?: string;
  readonly state: {[key: string]: unknown};

  /**
   * If connected to a kernel then this is the comm channel to the kernel.
   * This will only be set if currently connected to a kernel.
   */
   readonly comm?: Comm;
}



/** Placeholder for any JSON serializable type. */
// tslint:disable-next-line:no-any
type JsonType = any;


export interface CommMessage {
  /** The JSON structured data of the message. */
  readonly data: JsonType;
  /** Optional binary buffers transferred with the message. */
  readonly buffers?: ArrayBuffer[];
}

export interface Comm {
  /**
   * Send a comm message to the kernel.
   * @param data The message data to be sent.
   * @param opts Any binary buffers to be included in the message.
   * @return Promise which will be resolved when the kernel successfully
   *     receives the comm message.
   */
  send(data: JsonType, opts?: {buffers?: ArrayBuffer[]}): Promise<void>;
  /**
   * Closes the comm channel and notifies the kernel that the channel
   * is closed.
   */
  close(): void;
  /**
   * An async iterator of the incoming messages from the kernel.
   * The iterator will end when the comm channel is closed.
   */
  readonly messages: AsyncIterable<CommMessage>;
}
