import transparentHerd from '../../src/index';

jest.useFakeTimers();

test('should batch different calls', async () => {
  const batched: (arg: any[][]) => Promise<Promise<string>[]> = async (args: string[][]) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return args.map((el, i) => Promise.resolve(el[0] + i));
  };

  const single = transparentHerd.single(batched);
  const acall = single('a');
  const bcall = single('b');
  const ccall = single('c');
  const dcall = single('d');

  jest.advanceTimersByTime(1000);

  const aresp = await acall;

  jest.advanceTimersByTime(1000);

  const bresp = await bcall;
  const cresp = await ccall;
  const dresp = await dcall;

  const ecall = single('e');

  jest.advanceTimersByTime(1000);

  const eresp = await ecall;
  expect(aresp).toEqual('a0');
  expect(bresp).toEqual('b0');
  expect(cresp).toEqual('c1');
  expect(dresp).toEqual('d2');
  expect(eresp).toEqual('e0');
});

test('should respect maxBatchSize', async () => {
  const batched: (arg: any[][]) => Promise<Promise<string>[]> = async (args: string[][]) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return args.map((el, i) => Promise.resolve(el[0] + i));
  };

  const single = transparentHerd.single(batched, { maxBatchSize: 2 });
  const acall = single('a');
  const bcall = single('b');
  const ccall = single('c');
  const dcall = single('d');
  const ecall = single('e');

  jest.advanceTimersByTime(1000);

  const aresp = await acall;

  jest.advanceTimersByTime(1000);

  const bresp = await bcall;
  const cresp = await ccall;
  const dresp = await dcall;
  const eresp = await ecall;

  expect(aresp).toEqual('a0');
  expect(bresp).toEqual('b0');
  expect(cresp).toEqual('c1');
  expect(dresp).toEqual('d0');
  expect(eresp).toEqual('e1');
});
