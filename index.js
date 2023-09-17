const {
  beforeAll: jBeforeAll,
  beforeEach: jBeforeEach,
  test: jTest,
  it: jIt
} = globalThis;

let cleaners;
function teardown(cb) {
  if (!cleaners) {
    throw new Error("teardown can only be called from within `beforeAll`, `beforeEach`, `test` or `it`. It cannot be called from concurrent tests.");
  }
  cleaners.push(cb);
}

function patchedHook(jBefore, after) {
  return (fn, ...hookArgs) => {
    const myCleaners = [];

    jBefore(async (...innerArgs) => {
      cleaners = myCleaners;
      await fn(...innerArgs);
    }, ...hookArgs);

    after(async() => {
      for (const cleaner of myCleaners.splice(0, Number.POSITIVE_INFINITY).reverse()) {
        await cleaner();
      }
    });
  }
}

globalThis.beforeAll = patchedHook(jBeforeAll, afterAll);
globalThis.beforeEach = patchedHook(jBeforeEach, afterEach);
beforeEach(() => {});

module.exports = { teardown };
