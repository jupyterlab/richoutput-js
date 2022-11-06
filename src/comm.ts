import { AsyncListeners } from './async_iterator';
import { Comm } from './typings';

/** Interface for messages received from comm channels.  */
export interface Message {
  readonly data: unknown;
  readonly buffers?: ArrayBuffer[];
}

export type DisposeCallback = () => void;
export type CommMessageListener = (message: Message) => void;
export type CommCloseListener = () => void;


export interface CommHost {
  addMessageListener(commId: string, handler: CommMessageListener): DisposeCallback;
  addCloseListener(commId: string, handler: CommCloseListener): DisposeCallback;
  sendCommOpen(targetName: string, commId: string, message: Message): Promise<void>;
  sendCommMessage(commId: string, message: Message): Promise<void>;
  sendCommClose(commId: string): Promise<void>;
}

export class CommChannel {
  private readonly listeners = new AsyncListeners<Message>();
  private hasListeners = false;
  private readonly bufferedMessages: Message[] = [];
  private readonly messageDispose: DisposeCallback;
  private readonly closeDispose: DisposeCallback;

  // private readonly commChannel: CommChannel;

  constructor(private readonly commId: string, private readonly host: CommHost) {
    this.messageDispose = this.host.addMessageListener(this.commId, (message) => {
      if (this.hasListeners) {
        this.listeners.push(message);
      } else {
        this.bufferedMessages.push(message);
      }
    });
    this.closeDispose = this.host.addCloseListener(this.commId, () => {
      this.listeners.close();
      this.dispose();
    });
  }

  // /** Sends a comm open message to the kernel. */
  // async open(targetName: string, data: unknown, buffers?: ArrayBuffer[]) {
  //   try {
  //     await this.host.sendCommOpen(targetName, this.commId, data, buffers);
  //   } catch (error: unknown) {
  //     // If the open fails then we want to close the comms to remove the
  //     // listener.
  //     this.close();
  //     throw error;
  //   }
  // }

  /** Sends the data to the kernel. */
  async send(data: unknown, { buffers }: { buffers?: ArrayBuffer[] } = {}):
    Promise<void> {
    await this.host.sendCommMessage(this.commId, { data, buffers });
  }

  /** Gets all of the messages received on this comm channel. */
  get messages(): AsyncIterable<Message> {
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
  close() {
    this.host.sendCommClose(this.commId).catch((error: unknown) => {
      // Only log a warning here, assume closed.
      console.warn(`Error closing comm channel ${this.commId}`, error);
    });
  }

  /**
   * @return A wrapper to avoid exposing implementation details to user code.
   */
  getWrapper(): Comm {
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
      get messages(): AsyncIterable<Message> {
        return comm.messages;
      }
    };
  }
}
