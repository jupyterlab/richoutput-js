import { AsyncListeners } from './async_iterator';
import { IComm } from './typings';

/** Interface for messages received from comm channels.  */
export interface IMessage {
  readonly data: unknown;
  readonly buffers?: ArrayBuffer[];
}

export type DisposeCallback = () => void;
export type CommMessageListener = (message: IMessage) => void;
export type CommCloseListener = () => void;

export interface ICommHost {
  addMessageListener(
    commId: string,
    handler: CommMessageListener
  ): DisposeCallback;
  addCloseListener(commId: string, handler: CommCloseListener): DisposeCallback;
  sendCommOpen(
    targetName: string,
    commId: string,
    message: IMessage
  ): Promise<void>;
  sendCommMessage(commId: string, message: IMessage): Promise<void>;
  sendCommClose(commId: string): Promise<void>;
  registerTarget(
    targetName: string,
    callback: (commId: string, message: IMessage) => void
  ): DisposeCallback;
}

export class CommChannel {
  private readonly listeners = new AsyncListeners<IMessage>();
  private hasListeners = false;
  private readonly bufferedMessages: IMessage[] = [];
  private readonly messageDispose: DisposeCallback;
  private readonly closeDispose: DisposeCallback;

  constructor(
    private readonly commId: string,
    private readonly host: ICommHost
  ) {
    this.messageDispose = this.host.addMessageListener(
      this.commId,
      (message) => {
        if (this.hasListeners) {
          this.listeners.push(message);
        } else {
          this.bufferedMessages.push(message);
        }
      }
    );
    this.closeDispose = this.host.addCloseListener(this.commId, () => {
      this.listeners.close();
      this.dispose();
    });
  }

  // /** Sends a comm open message to the kernel. */
  async open(
    targetName: string,
    data: unknown,
    buffers?: ArrayBuffer[]
  ): Promise<void> {
    try {
      await this.host.sendCommOpen(targetName, this.commId, {
        data,
        buffers,
      });
    } catch (error: unknown) {
      // If the open fails then we want to close the comms to remove the
      // listener.
      this.close();
      throw error;
    }
  }

  /** Sends the data to the kernel. */
  async send(
    data: unknown,
    { buffers }: { buffers?: ArrayBuffer[] } = {}
  ): Promise<void> {
    await this.host.sendCommMessage(this.commId, { data, buffers });
  }

  /** Gets all of the messages received on this comm channel. */
  get messages(): AsyncIterable<IMessage> {
    const listener = this.listeners.listen();
    if (!this.hasListeners) {
      this.listenerAdded();
    }
    return listener;
  }

  private listenerAdded(): void {
    this.hasListeners = true;
    Promise.resolve().then(() => {
      for (const message of this.bufferedMessages) {
        this.listeners.push(message);
      }
      this.bufferedMessages.length = 0;
    });
  }

  private dispose() {
    this.messageDispose();
    this.closeDispose();
  }

  /** Sends a message to the kernel to close this comm channel. */
  close(): void {
    this.host
      .sendCommClose(this.commId)
      .catch((error: unknown) => {
        // Only log a warning here, assume closed.
        console.warn(`Error closing comm channel ${this.commId}`, error);
      })
      .then(() => {
        // This should be done in response to a kernel close message.
        this.listeners.close();
      });
  }

  /**
   * @return A wrapper to avoid exposing implementation details to user code.
   */
  getWrapper(): IComm {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const comm = this;
    return {
      /** @export */
      send(data: unknown, opts?: { buffers?: ArrayBuffer[] }): Promise<void> {
        return comm.send(data, opts);
      },
      /** @export */
      close() {
        comm.close();
      },
      /** @export */
      get messages(): AsyncIterable<IMessage> {
        return comm.messages;
      },
    };
  }
}
