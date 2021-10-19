/* eslint-disable @typescript-eslint/no-var-requires */
const transparentHerd = require('../../src/index');

jest.useFakeTimers();

test('throw if results is undefined', async () => {
  const batched = async () => {
    return undefined;
  };

  const singular = transparentHerd.singular(batched);
  const acall = singular('a');
  try {
    await acall;
    fail('it should not reach here');
  } catch (e) {
    expect(e.message).toBe('the result is not an array of promises');
  }
});

test('throw if results is not an array', async () => {
  const batched = async () => {
    return true;
  };

  const singular = transparentHerd.singular(batched);
  const acall = singular('a');
  try {
    await acall;
    fail('it should not reach here');
  } catch (e) {
    expect(e.message).toBe('the result is not an array of promises');
  }
});

test('throw if a result is not a promise', async () => {
  const batched = async (args) => {
    return args.map((el, i) => el + i);
  };

  const singular = transparentHerd.singular(batched);
  const acall = singular('a');
  try {
    await acall;
    fail('it should not reach here');
  } catch (e) {
    expect(e.message).toBe('the result is not an array of promises');
  }
});

test('throw if batched is not a function', async () => {
  try {
    transparentHerd.singular(null);
    fail('it should not reach here');
  } catch (e) {
    expect(e.message).toBe('batched is not a function');
  }

  try {
    transparentHerd.singular({});
    fail('it should not reach here');
  } catch (e) {
    expect(e.message).toBe('batched is not a function');
  }
});

test('throw if minConcurrent is not a number', async () => {
  try {
    transparentHerd.singular(
      () => {
        return undefined;
      },
      { minConcurrent: 'false' },
    );
    fail('it should not reach here');
  } catch (e) {
    expect(e.message).toBe('minConcurrent is not a number');
  }
});

test('throw if maxConcurrent is not a number', async () => {
  try {
    transparentHerd.singular(
      () => {
        return undefined;
      },
      {
        minConcurrent: 3,
        maxConcurrent: 'false',
      },
    );
    fail('it should not reach here');
  } catch (e) {
    expect(e.message).toBe('maxConcurrent is not a number');
  }
});

test('throw if maxBatchSize is not a number', async () => {
  try {
    transparentHerd.singular(
      () => {
        return undefined;
      },
      { maxBatchSize: 'false' },
    );
    fail('it should not reach here');
  } catch (e) {
    expect(e.message).toBe('maxBatchSize is not a number');
  }
});
