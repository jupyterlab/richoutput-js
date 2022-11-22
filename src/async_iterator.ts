/** Helper to implement Javascript AsyncIterables. */
export class AsyncListeners<T> {
  private readonly listeners: Array<AsyncListener<T>> = [];

  push(value: T): void {
    for (const listener of this.listeners) {
      listener.push(value);
    }
  }
  close(): void {
    for (const listener of this.listeners) {
      listener.close();
    }
  }
  listen(): AsyncIterable<T> {
    const listener = new AsyncListener<T>(() => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    });
    this.listeners.push(listener);
    return listener;
  }
}

interface IIteratorResult<T> {
  readonly value: T;
  readonly done: boolean;
}

/**
 * A listener for an async iterator.
 */
export class AsyncListener<T> implements AsyncIterable<T> {
  private readonly queued: Array<IIteratorResult<T>> = [];
  private readonly waiting: Array<(result: IIteratorResult<T>) => void> = [];
  private closed = false;
  private readonly finalResult: IIteratorResult<T> = {
    value: undefined as unknown as T,
    done: true,
  };

  constructor(private readonly remover: () => void) {}

  push(value: T): void {
    if (this.closed) {
      return;
    }
    if (this.waiting.length) {
      const next = this.waiting.shift();
      if (next) {
        next({ value, done: false });
        return;
      }
    }
    this.queued.push({ value, done: false });
  }

  close(): void {
    for (const waiting of this.waiting) {
      waiting(this.finalResult);
    }
    this.waiting.length = 0;
    this.closed = true;
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: (): Promise<IIteratorResult<T>> => {
        if (this.queued.length) {
          const next = this.queued.shift();
          if (next) {
            return Promise.resolve<IIteratorResult<T>>(next);
          }
        }
        if (this.closed) {
          return Promise.resolve<IIteratorResult<T>>(this.finalResult);
        }
        return new Promise<IIteratorResult<T>>((resolve) => {
          this.waiting.push(resolve);
        });
      },
      return: (): Promise<IIteratorResult<T>> => {
        this.remover();
        this.closed = true;
        return Promise.resolve(this.finalResult);
      },
    };
  }
}
