import UnexpectedResultError from './error/UnexpectedResultError';
import UnexpectedInputError from './error/UnexpectedInputError';
import SelfResolvablePromise from './util/SelfResolvablePromise';

type PositiveInteger = number;
type ArrayOfPromises = Promise<any>[];

function isPositiveInteger(n: number | undefined): n is PositiveInteger {
  return !!n && typeof n === 'number' && n > 0;
}

function isArrayOfPromises(input: any): input is ArrayOfPromises {
  return !!input && input instanceof Array && input.every((el) => el instanceof Promise);
}

export default {
  /**
   *
   * TODO:
   *
   * @param {(args: any[][]) => Promise<any>[]} batched TODO:
   * @param {number | undefined} maxBatchSize TODO:
   * @return {(any[])=>Promise<any>}
   */
  single: (
    batched: (args: any[][]) => Promise<Promise<any>[]>,
    { maxBatchSize }: { maxBatchSize: PositiveInteger | undefined } = {
      maxBatchSize: undefined,
    },
  ) => {
    if (!(batched && typeof batched === 'function')) {
      throw new UnexpectedInputError({
        message: 'batched is not a function',
      });
    }

    if (maxBatchSize !== undefined && !isPositiveInteger(maxBatchSize)) {
      throw new UnexpectedInputError({
        message: 'maxBatchSize is not a number',
      });
    }

    const runningBatches: Promise<void>[] = [];
    const runningIdentifiers: object[] = [];
    let queue: [any[], SelfResolvablePromise<any>][] = [];

    const runBatch = async (id: object) => {
      const localQueue = new Array(...queue);
      queue = [];
      let results: ArrayOfPromises;
      try {
        results = await batched(localQueue.map((pair) => pair[0]));
        if (!isArrayOfPromises(results)) {
          throw new UnexpectedResultError({
            message: 'the result is not an array of promises',
          });
        }

        for (let i = 0; i < localQueue.length; i++) {
          const elementI = localQueue[i];
          const elementIPromise = elementI[1];
          const resultI = results[i];
          resultI.then(elementIPromise.resolve, elementIPromise.reject);
        }
      } catch (e) {
        for (const elementI of localQueue) {
          const elementIPromise = elementI[1];
          if (elementIPromise.reject !== undefined) elementIPromise.reject(e);
        }
      }

      terminateBatch(id);
      if (queue.length > 0 && runningBatches.length === 0) {
        startNewBatch();
      }
    };

    const startNewBatch = () => {
      const id = {};
      runningIdentifiers.push(id);
      runningBatches.push(runBatch(id));
    };

    const terminateBatch = (id: object) => {
      const idx = runningIdentifiers.indexOf(id);
      runningIdentifiers.splice(idx, 1);
      runningBatches.splice(idx, 1);
    };

    return (...args: any[]) => {
      const promise = new SelfResolvablePromise<any>();
      queue.push([args, promise]);
      if (runningBatches.length === 0 || (maxBatchSize && queue.length >= maxBatchSize)) {
        startNewBatch();
      }
      return promise.promise;
    };
  },
};
