/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnexpectedResultError } from './error/UnexpectedResultError';
import { UnexpectedInputError } from './error/UnexpectedInputError';
import { SelfResolvablePromise } from './util/SelfResolvablePromise';

type PositiveInteger = number;
type ArrayOfPromises = Promise<unknown>[];
type BatchId = Record<string, never>;
/**
 * SingularFunction models any async function
 */
export type SingularFunction = (...args: any[]) => Promise<any>;
/**
 * BatchedFunction models an async function that takes as argument an array of function arguments
 * and resolves to an array of Promise
 */
export type BatchedFunction = (args: any[][]) => Promise<Promise<any>[]>;

/**
 * Type guard to tests if the given number is a positive integer
 * @param n - the number to test
 */
function isPositiveInteger(n: number | undefined): n is PositiveInteger {
  return !!n && typeof n === 'number' && n > 0;
}

/**
 * Type guard to tests if the given input is an Array of Promise
 * @param input - the tested parameter
 */
function isArrayOfPromises(input: unknown): input is ArrayOfPromises {
  return !!input && input instanceof Array && input.every((el) => el instanceof Promise);
}

/**
 *
 * Converts a batched functions to a singular one. If maxBatchSize is undefined,
 * only one batched call at a time is done, otherwise calls with batches of at most maxBatchSize
 * can be run in parallel
 *
 * @param batched - the batched function
 * @param maxBatchSize - the max batch size of each batched call
 * @returns the singular function
 */
export function singular(
  batched: BatchedFunction,
  { maxBatchSize }: { maxBatchSize: PositiveInteger | undefined } = {
    maxBatchSize: undefined,
  },
): SingularFunction {
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
  const runningIdentifiers: BatchId[] = [];
  let queue: [unknown[], SelfResolvablePromise][] = [];

  const runBatch = async (id: BatchId) => {
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
      if (results.length !== localQueue.length) {
        throw new UnexpectedResultError({
          message: `the result's length (${results.length}) is different from the arguments's length (${localQueue.length})`,
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

  const terminateBatch = (id: BatchId) => {
    const idx = runningIdentifiers.indexOf(id);
    runningIdentifiers.splice(idx, 1);
    runningBatches.splice(idx, 1);
  };

  return (...args: any[]) => {
    const promise = new SelfResolvablePromise();
    queue.push([args, promise]);
    if (runningBatches.length === 0 || (maxBatchSize && queue.length >= maxBatchSize)) {
      startNewBatch();
    }
    return promise.promise;
  };
}
