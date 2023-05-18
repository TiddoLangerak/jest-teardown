const {
  beforeAll: jBeforeAll,
  beforeEach: jBeforeEach,
  test: jTest,
  it: jIt
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

function patchedTest(testMethod) {
  return (name, fn, ...otherArgs) => {
    testMethod(name, async (...innerArgs) => {
      try {
        cleaners = [];
        return await fn(...innerArgs);
      } finally {
        for (const cleaner of cleaners.splice(0, Number.POSITIVE_INFINITY)) {
          await cleaner();
        }
      }
    }, ...otherArgs);
  }
}

globalThis.beforeAll = patchedHook(jBeforeAll, afterAll);
globalThis.beforeEach = patchedHook(jBeforeEach, afterEach);
globalThis.test = patchedTest(jTest);
globalThis.it = patchedTest(jIt);
