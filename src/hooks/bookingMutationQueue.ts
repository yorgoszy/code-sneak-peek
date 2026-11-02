// Accept successive selections immediately, but persist them in order so each
// write checks the subscription balance refreshed by the previous write.
export function createBookingMutationQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(operation: () => Promise<T>): Promise<T> {
      const result = tail.then(operation);
      tail = result.catch(() => undefined);
      return result;
    },
  };
}