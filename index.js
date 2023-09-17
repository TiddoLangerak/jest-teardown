const {
  beforeAll: jBeforeAll,
  beforeEach: jBeforeEach,
  afterAll: jAfterAll,
  afterEach: jAfterEach,
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

function patchHook(jBefore, jAfter) {
  return (...args) => {
    setupCleaners(jBefore, jAfter);
    jBefore(...args);
  }
}

function setupCleaners(jBefore, jAfter) {
  const myCleaners = [];

  jBefore(() => {
    cleaners = myCleaners;
  });

  jAfter(async() => {
    for (const cleaner of myCleaners.splice(0, Number.POSITIVE_INFINITY).reverse()) {
      await cleaner();
    }
  });
}

globalThis.beforeAll = patchHook(jBeforeAll, jAfterAll);

setupCleaners(jBeforeEach, jAfterEach);

module.exports = { teardown };
