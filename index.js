/**
 * The overall approach of this feature is as followed:
 * - We register `beforeEach`/`beforeAll` hooks that initialize a "teardowns" array for the current scope. This array will keep track of all teardown hooks registered.
 * - This array is then assigned to a shared global state variable (`teardowns`, see below).
 * - Whenever `teardown` is then called, it will push the callback to the current global `teardowns` array.
 * - We als register `afterEach/afterAll` hooks, which processes the teardowns array and resets them.
 */
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

function setupTeardowns(jBefore, jAfter) {
  const myTeardowns = [];

  jBefore(() => {
    teardowns = myTeardowns;
  });

  jAfter(async() => {
    // The `myTeardowns` array will be reused (e.g. each `eforeEach` iteration),
    // hence we must splice out any teardowns we're processing here, to make sure they're not triggered again
    for (const cleaner of myTeardowns.splice(0, Number.POSITIVE_INFINITY).reverse()) {
      await cleaner();
    }
    teardowns = undefined;
  });
}

// Note that it's not sufficient to just call `setupTeardowns(jBeforeAll, jAfterAll)`:
// each describe block has it's own "beforeAll-scope", and thus we need to setup a beforeAll/afterAll for each describe block.
// Unfortunately, there isn't a top-level hook that we can use for this, there's no `beforeDescribe/afterDescribe`.
// Hence, we'll need to monkey patch something.
// We have the choice between monkey-patching `describe` or `beforeAll`.
// We choose `beforeAll` here, for 2 reasons:
// 1. it's simpler - no need to deal with properties on the method (e.g. describe.skip/.only)
// 2. it's (usually) more efficient, as we'll only end up intercepting whenever `beforeAll` is actually used.
//
// The only caveat is that we might register multiple handlers if `beforeAll` is called multiple times, but this should just work as expected.
globalThis.beforeAll = (...args) => {
  setupTeardowns(jBeforeAll, jAfterAll);
  jBeforeAll(...args);
}

// Each runs for each test, regardless of nesting, hence we don't need patching.
setupTeardowns(jBeforeEach, jAfterEach);

module.exports = { teardown };
