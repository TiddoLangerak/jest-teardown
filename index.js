const {
  beforeAll: jBeforeAll,
  beforeEach: jBeforeEach,
  test: jTest,
  it: jIt
} = globalThis;

/**
 * This will contain a collection of callbacks that will need to run at the end of the current "scope"
 * The array will be initialized in the beforeEach/beforeAll blocks
 */
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
      // Note that we deliberately don't reset `cleaners`.
      // This is such that tests will have access to the cleaners set up by `beforeEach`
    }, ...hookArgs);

    after(async() => {
      for (const cleaner of myCleaners.splice(0, Number.POSITIVE_INFINITY).reverse()) {
        await cleaner();
      }
    });
  }
}

globalThis.beforeAll = patchedHook(jBeforeAll, afterAll);

/**
 * This `beforeEach` call is to make sure that teardown works for calls made from within tests:
 * calls made within a test needs to run in the `beforeAfter`, just like calls made within `beforeEach`.
 * By calling the patched `beforeEach` at the top-level here, we ensure that we setup a `cleaners` object for each test.
 *
 * (The alternative is to patch each test method as well, which we'd like to avoid doing)
 */
let patchedEach = patchedHook(jBeforeEach, afterEach);
patchedEach(() => {});

module.exports = { teardown };
