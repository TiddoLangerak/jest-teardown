const {
  beforeAll: jBeforeAll,
  beforeEach: jBeforeEach,
  test: jTest,
  it: jIt
} = globalThis;

let cleaners;
export function cleanup(cb) {
  if (!cleaners) {
    throw new Error("cleanup can only be called from within `beforeAll`, `beforeEach`, `test` or `it`. It cannot be called from concurrent tests.");
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

function wrapTest(fn) {
  return async (...innerArgs) => {
    try {
      cleaners = [];
      return await fn(...innerArgs);
    } finally {
      for (const cleaner of cleaners.splice(0, Number.POSITIVE_INFINITY)) {
        await cleaner();
      }
    }
  }
}

function patchedTest(testMethod) {
  // There's probably a smarter way to do this, but for now this works.
  const patched = (name, fn, ...otherArgs) => testMethod(name, wrapTest(fn), ...otherArgs);
  patched.concurrent = testMethod.concurrent;
  patched.each = (...tableArgs) => (name, fn, ...otherArgs) => testMethod.each(...tableArgs)(name, wrapTest(fn), ...otherArgs);
  patched.failing = (name, fn, ...otherArgs) => testMethod.failing(name, wrapTest(fn), ...otherArgs);
  patched.failing.each = (...tableArgs) => (name, fn, ...otherArgs) => testMethod.failing.each(...tableArgs)(name, wrapTest(fn), ...otherArgs);
  patched.only = (name, fn, ...otherArgs) => testMethod.only(name, wrapTest(fn), ...otherArgs);
  patched.only.each = (...tableArgs) => (name, fn, ...otherArgs) => testMethod.only.each(...tableArgs)(name, wrapTest(fn), ...otherArgs);
  patched.only.failing = (name, fn, ...otherArgs) => testMethod.only.failing(name, wrapTest(fn), ...otherArgs);
  return patched;
}

globalThis.beforeAll = patchedHook(jBeforeAll, afterAll);
globalThis.beforeEach = patchedHook(jBeforeEach, afterEach);
globalThis.test = patchedTest(jTest);
globalThis.it = patchedTest(jIt);
