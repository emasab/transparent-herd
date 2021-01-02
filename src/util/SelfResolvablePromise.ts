export type ResolveFunction = (value: unknown) => void;
export type RejectFunction = (reason: unknown) => void;
/**
 * A decorator for a Promise that exposes it's resolve and reject callbacks as methods
 */
export class SelfResolvablePromise {
  resolve: ResolveFunction | undefined;
  reject: RejectFunction | undefined;
  promise: Promise<unknown>;

  /**
   * Default constructor
   */
  constructor() {
    this.promise = new Promise((resolve: ResolveFunction, reject: RejectFunction) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    // to avoid unhandled promise rejection
    this.promise.catch(() => {
      /* noop */
    });
  }
}
