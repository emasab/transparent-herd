/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnexpectedResultError } from './error/UnexpectedResultError';
import { UnexpectedInputError } from './error/UnexpectedInputError';
import { SelfResolvablePromise } from './util/SelfResolvablePromise';
import { v4 } from 'uuid';

type PositiveInteger = number;
type ArrayOfPromises = Promise<unknown>[];
type BatchId = string;
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
 * Converts a batched functions to a singular one. If maxConcurrent is 1,
 * only one batched call at a time is done, otherwise al most _maxConcurrent_ concurrent
 * calls are called each one taking a part of the remaining queue
 *
 * @param batched - the batched function
 * @param maxConcurrent - the max number of concurrent calls
 * @returns the singular function
 */
export function singular(
  batched: BatchedFunction,
  { maxConcurrent }: { maxConcurrent: PositiveInteger } = {
    maxConcurrent: 1,
  },
): SingularFunction {
  if (!(batched && typeof batched === 'function')) {
    throw new UnexpectedInputError({
      message: 'batched is not a function',
    });
  }

  if (maxConcurrent !== undefined && !isPositiveInteger(maxConcurrent)) {
    throw new UnexpectedInputError({
      message: 'maxConcurrent is not a number',
    });
  }

  let runningBatches = 0;
  const runningBatchesMap: Record<BatchId, Promise<void>> = {};
  const queue: [unknown[], SelfResolvablePromise][] = [];

  const runBatch = async (id: BatchId) => {
    const localQueue = queue.splice(0, Math.max(Math.trunc(queue.length / runningBatches), 1));
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
    if (queue.length > 0 && runningBatches < maxConcurrent) {
      startNewBatch();
    }
  };

  const startNewBatch = () => {
    const id = v4();
    runningBatches++;
    runningBatchesMap[id] = runBatch(id);
  };

  const terminateBatch = (id: BatchId) => {
    delete runningBatchesMap[id];
    runningBatches--;
  };

  return (...args: any[]) => {
    const promise = new SelfResolvablePromise();
    queue.push([args, promise]);
    if (runningBatches < maxConcurrent) {
      startNewBatch();
    }
    return promise.promise;
  };
}
