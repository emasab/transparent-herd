import * as transparentHerd from '../../src/index';

jest.useFakeTimers();

test('batch different calls', async () => {
  const batched: transparentHerd.BatchedFunction = async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return args.map((el, i) => Promise.resolve(el[0] + i));
  };

  const singular = transparentHerd.singular(batched, {
    minConcurrent: 1,
    maxBatchSize: 100,
  });
  const acall = singular('a');
  const bcall = singular('b');
  const ccall = singular('c');
  const dcall = singular('d');

  jest.advanceTimersByTime(1000);

  const aresp = await acall;

  jest.advanceTimersByTime(1000);

  const bresp = await bcall;
  const cresp = await ccall;
  const dresp = await dcall;

  const ecall = singular('e');

  jest.advanceTimersByTime(1000);

  const eresp = await ecall;

  expect(aresp).toEqual('a0');
  expect(bresp).toEqual('b0');
  expect(cresp).toEqual('c1');
  expect(dresp).toEqual('d2');
  expect(eresp).toEqual('e0');
});

test('respect minConcurrent', async () => {
  const batched: transparentHerd.BatchedFunction = async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return args.map((el, i) => Promise.resolve(el[0] + i));
  };

  const singular = transparentHerd.singular(batched, {
    minConcurrent: 2,
  });
  const acall = singular('a');
  const bcall = singular('b');
  const ccall = singular('c');
  const dcall = singular('d');
  const ecall = singular('e');
  const fcall = singular('f');
  const gcall = singular('g');

  jest.advanceTimersByTime(1000);

  const aresp = await acall;
  const bresp = await bcall;

  jest.advanceTimersByTime(1000);

  const cresp = await ccall;
  const dresp = await dcall;
  const eresp = await ecall;

  jest.advanceTimersByTime(1000);

  const fresp = await fcall;
  const gresp = await gcall;

  expect(aresp).toEqual('a0');
  expect(bresp).toEqual('b0');
  expect(cresp).toEqual('c0');
  expect(dresp).toEqual('d1');
  expect(eresp).toEqual('e0');
  expect(fresp).toEqual('f0');
  expect(gresp).toEqual('g0');
});

test('respect maxConcurrent', async () => {
  const batched: transparentHerd.BatchedFunction = async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return args.map((el, i) => Promise.resolve(el[0] + i));
  };

  const singular = transparentHerd.singular(batched, {
    maxConcurrent: 2,
    maxBatchSize: 1,
  });
  const acall = singular('a');
  const bcall = singular('b');
  const ccall = singular('c');
  const dcall = singular('d');
  const ecall = singular('e');
  const fcall = singular('f');
  const gcall = singular('g');

  jest.advanceTimersByTime(1000);

  const aresp = await acall;

  jest.advanceTimersByTime(1000);

  const bresp = await bcall;
  const cresp = await ccall;

  jest.advanceTimersByTime(1000);

  const dresp = await dcall;
  const eresp = await ecall;

  jest.advanceTimersByTime(1000);

  const fresp = await fcall;

  jest.advanceTimersByTime(1000);

  const gresp = await gcall;

  expect(aresp).toEqual('a0');
  expect(bresp).toEqual('b0');
  expect(cresp).toEqual('c0');
  expect(dresp).toEqual('d0');
  expect(eresp).toEqual('e0');
  expect(fresp).toEqual('f0');
  expect(gresp).toEqual('g0');
});

test('respect maxBatchSize', async () => {
  const batched: transparentHerd.BatchedFunction = async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return args.map((el, i) => Promise.resolve(el[0] + i));
  };

  const singular = transparentHerd.singular(batched, {
    maxConcurrent: 2,
    maxBatchSize: 2,
  });
  const acall = singular('a');
  const bcall = singular('b');
  const ccall = singular('c');
  const dcall = singular('d');
  const ecall = singular('e');
  const fcall = singular('f');
  const gcall = singular('g');

  jest.advanceTimersByTime(1000);

  const aresp = await acall;

  jest.advanceTimersByTime(1000);

  const bresp = await bcall;
  const cresp = await ccall;
  const dresp = await dcall;
  const eresp = await ecall;

  jest.advanceTimersByTime(1000);

  const fresp = await fcall;
  const gresp = await gcall;

  expect(aresp).toEqual('a0');
  expect(bresp).toEqual('b0');
  expect(cresp).toEqual('c1');
  expect(dresp).toEqual('d0');
  expect(eresp).toEqual('e1');
  expect(fresp).toEqual('f0');
  expect(gresp).toEqual('g1');
});

test('increase runningBatches', async () => {
  const batched: transparentHerd.BatchedFunction = async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return args.map((el, i) => Promise.resolve(el[0] + i));
  };

  const singular = transparentHerd.singular(batched, {
    minConcurrent: 1,
    maxBatchSize: 1,
  });
  const acall = singular('a');
  const bcall = singular('b');
  const ccall = singular('c');
  const dcall = singular('d');
  const ecall = singular('e');
  const fcall = singular('f');
  const gcall = singular('g');

  jest.advanceTimersByTime(1000);

  const aresp = await acall;

  jest.advanceTimersByTime(1000);

  const bresp = await bcall;
  const cresp = await ccall;

  jest.advanceTimersByTime(1000);

  const dresp = await dcall;
  const eresp = await ecall;

  jest.advanceTimersByTime(1000);

  const fresp = await fcall;

  jest.advanceTimersByTime(1000);

  const gresp = await gcall;

  expect(aresp).toEqual('a0');
  expect(bresp).toEqual('b0');
  expect(cresp).toEqual('c0');
  expect(dresp).toEqual('d0');
  expect(eresp).toEqual('e0');
  expect(fresp).toEqual('f0');
  expect(gresp).toEqual('g0');
});

test('throw if maxConcurrent less than minConcurrent', async () => {
  try {
    transparentHerd.singular(
      async () => {
        return [];
      },
      { maxConcurrent: 1, minConcurrent: 2 },
    );
    fail('it should not reach here');
  } catch (e) {
    expect(e.message).toBe('maxConcurrent must be greater or equal to minConcurrent');
  }
});

test('throw if maxConcurrent used without maxBatchSize', async () => {
  try {
    transparentHerd.singular(
      async () => {
        return [];
      },
      { maxConcurrent: 1 },
    );
    fail('it should not reach here');
  } catch (e) {
    expect(e.message).toBe('maxConcurrent is used without maxBatchSize');
  }
});

test('throw if results length is different from arguments length', async () => {
  const batched: transparentHerd.BatchedFunction = async () => {
    return [];
  };

  const singular = transparentHerd.singular(batched);
  const acall = singular('a');

  try {
    await acall;
    fail('it should not reach here');
  } catch (e) {
    expect(e.message).toBe("the result's length (0) is different from the arguments's length (1)");
  }
});
