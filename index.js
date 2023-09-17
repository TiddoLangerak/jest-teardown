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
let teardowns;
function teardown(cb) {
  if (!teardowns) {
    throw new Error("teardown can only be called from within `beforeAll`, `beforeEach`, `test` or `it`. It cannot be called from concurrent tests.");
  }
  teardowns.push(cb);
}

function patchHook(jBefore, jAfter) {
  return (...args) => {
    setupTeardowns(jBefore, jAfter);
    jBefore(...args);
  }
}

function setupTeardowns(jBefore, jAfter) {
  const myTeardowns = [];

  jBefore(() => {
    teardowns = myTeardowns;
  });

  jAfter(async() => {
    for (const cleaner of myTeardowns.splice(0, Number.POSITIVE_INFINITY).reverse()) {
      await cleaner();
    }
    teardowns = undefined;
  });
}

globalThis.beforeAll = patchHook(jBeforeAll, jAfterAll);

setupTeardowns(jBeforeEach, jAfterEach);

module.exports = { teardown };
