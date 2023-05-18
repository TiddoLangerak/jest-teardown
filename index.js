const {
  beforeAll: jBeforeAll,
  beforeEach: jBeforeEach
} = globalThis;

let cleaners;
export function cleanup(cb) {
  if (!cleaners) {
    throw new Error("cleanup can only be called from within `beforeAll`, `beforeEach`, `test` or `it`");
  }
  cleaners.push(cb);
}

function patchedHook(jBefore, after) {
  return (fn, ...hookArgs) => {
    const myCleaners = [];

    jBefore(async (...innerArgs) => {
      cleaners = myCleaners;
      await fn(...innerArgs);
      cleaners = undefined;
    }, ...hookArgs);

    after(async() => {
      for (const cleaner of myCleaners.splice(0, Number.POSITIVE_INFINITY)) {
        await cleaner();
      }
    });
  }
}

globalThis.beforeAll = patchedHook(jBeforeAll, afterAll);

globalThis.beforeEach = patchedHook(jBeforeEach, afterEach);
