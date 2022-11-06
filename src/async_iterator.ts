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
  
  interface IteratorResult<T> {
    readonly value: T;
    readonly done: boolean;
  }
  
  /**
   * A listener for an async iterator.
   */
  export class AsyncListener<T> implements AsyncIterable<T> {
    private readonly queued: Array<IteratorResult<T>> = [];
    private readonly waiting: Array<((result: IteratorResult<T>) => void)> = [];
    private closed = false;
    private readonly finalResult:
        IteratorResult<T> = {value: (undefined as unknown) as T, done: true};
  
    constructor(private readonly remover: () => void) {}
  
    push(value: T): void {
      if (this.closed) {
        return;
      }
      if (this.waiting.length) {
        const next = this.waiting.shift();
        if (next) {
          next({value, done: false});
          return;
        }
      }
      this.queued.push({value, done: false});
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
        next: (): Promise<IteratorResult<T>> => {
          if (this.queued.length) {
            const next = this.queued.shift();
            if (next) {
              return Promise.resolve<IteratorResult<T>>(next);
            }
          }
          if (this.closed) {
            return Promise.resolve<IteratorResult<T>>(this.finalResult);
          }
          return new Promise<IteratorResult<T>>(resolve => {
            this.waiting.push(resolve);
          });
        },
        return: (): Promise<IteratorResult<T>> => {
          this.remover();
          this.closed = true;
          return Promise.resolve(this.finalResult);
        }
      };
    }
  }
  