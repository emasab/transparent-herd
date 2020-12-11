export type ResolveFunction = (value: any) => void;
export type RejectFunction = (reason: any) => void;
/**
 * A decorator for a Promise that exposes it's resolve and reject callbacks as methods
 */
export default class SelfResolvablePromise<T> {
  resolve: ResolveFunction | undefined;
  reject: RejectFunction | undefined;
  promise: Promise<T>;

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
