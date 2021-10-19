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
 * Converts a batched functions to a singular one.
 * Al least minConcurrent calls and at most maxConcurrent are done at a time,
 * at most maxBatchSize is allocated to each call.
 * When maxBatchSize is reached, more concurrent calls are made, until
 * maxConcurrent is reached, if specified.
 * Each call takes a part of the remaining queue
 *
 * @param batched - the batched function
 * @param minConcurrent - the minimum number of concurrent calls
 * @param maxConcurrent - the maximum number of concurrent calls
 * @param maxBatchSize - the maximum batch size allocated to a call
 * @returns the singular function
 */
export function singular(
  batched: BatchedFunction,
  {
    minConcurrent,
    maxConcurrent,
    maxBatchSize,
  }: {
    minConcurrent?: PositiveInteger;
    maxConcurrent?: PositiveInteger;
    maxBatchSize?: PositiveInteger;
  } = {},
): SingularFunction {
  if (!!minConcurrent && !isPositiveInteger(minConcurrent)) {
    throw new UnexpectedInputError({
      message: 'minConcurrent is not a number',
    });
  }

  if (!!maxConcurrent && !isPositiveInteger(maxConcurrent)) {
    throw new UnexpectedInputError({
      message: 'maxConcurrent is not a number',
    });
  }

  if (!!minConcurrent && !!maxConcurrent && maxConcurrent < minConcurrent) {
    throw new UnexpectedInputError({
      message: 'maxConcurrent must be greater or equal to minConcurrent',
    });
  }

  if (!!maxBatchSize && !isPositiveInteger(maxBatchSize)) {
    throw new UnexpectedInputError({
      message: 'maxBatchSize is not a number',
    });
  }

  if (!!maxConcurrent && !maxBatchSize) {
    throw new UnexpectedInputError({
      message: 'maxConcurrent is used without maxBatchSize',
    });
  }

  const notNullMinConcurrent = minConcurrent || 1;

  if (!(batched && typeof batched === 'function')) {
    throw new UnexpectedInputError({
      message: 'batched is not a function',
    });
  }

  let runningBatches = 0;
  const runningBatchesMap: Record<BatchId, Promise<void>> = {};
  const queue: [unknown[], SelfResolvablePromise][] = [];

  const runBatch = async (id: BatchId) => {
    const shouldTakeBatchSize = Math.max(Math.trunc(queue.length / runningBatches), 1);
    const takeBatchSize = Math.min(shouldTakeBatchSize, maxBatchSize || shouldTakeBatchSize);
    const localQueue = queue.splice(0, takeBatchSize);
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

    const reducedBatches = runningBatches > 1 ? runningBatches - 1 : 1;
    const reducedChunkLength = Math.max(Math.trunc(queue.length / reducedBatches), 1);
    const nextChunkLength = Math.max(Math.trunc(queue.length / runningBatches), 1);

    const apoptosis =
      queue.length === 0 ||
      (runningBatches > notNullMinConcurrent && (!maxBatchSize || reducedChunkLength <= maxBatchSize));
    const mitosis =
      (!maxConcurrent || (maxConcurrent && runningBatches < maxConcurrent)) &&
      maxBatchSize &&
      nextChunkLength > maxBatchSize;

    terminateBatch(id);
    if (!apoptosis) {
      if (mitosis) startNewBatch();
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
    if (runningBatches < notNullMinConcurrent) {
      startNewBatch();
    }
    return promise.promise;
  };
}
