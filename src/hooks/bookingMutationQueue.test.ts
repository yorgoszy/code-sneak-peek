import { it } from 'node:test';
import { deepStrictEqual, strictEqual, rejects } from 'node:assert';
import { createBookingMutationQueue } from './bookingMutationQueue.ts';

it('accepts multiple quick clicks and persists them in selection order', async () => {
  const queue = createBookingMutationQueue();
  const saved: string[] = [];
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  const first = queue.run(async () => { await gate; saved.push('09:00'); });
  const second = queue.run(async () => { saved.push('10:00'); });
  const third = queue.run(async () => { saved.push('11:00'); });
  await Promise.resolve();
  deepStrictEqual(saved, []);
  release();
  await Promise.all([first, second, third]);
  deepStrictEqual(saved, ['09:00', '10:00', '11:00']);
});

it('checks the updated remaining visit before the next queued booking', async () => {
  const queue = createBookingMutationQueue();
  let remaining = 1;
  const book = async () => {
    if (remaining === 0) throw new Error('No remaining visits');
    remaining -= 1;
  };
  const first = queue.run(book);
  const second = queue.run(book);
  await first;
  await rejects(second, /No remaining visits/);
  strictEqual(remaining, 0);
});

it('a failed selection does not discard the following selections', async () => {
  const queue = createBookingMutationQueue();
  const first = queue.run(async () => { throw new Error('Slot full'); });
  const second = queue.run(async () => 'saved');
  await rejects(first, /Slot full/);
  strictEqual(await second, 'saved');
});