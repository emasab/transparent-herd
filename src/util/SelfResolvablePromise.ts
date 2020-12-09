export type ResolveFunction = (value: any) => void;
export type RejectFunction = (reason: any) => void;
/**
 *
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
