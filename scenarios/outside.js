const { teardown } = require('../index.js');
const { log } = require('./util.js');

try {
  teardown(() => {});
} catch (e) {
  log(`before: ${e.message}`);
}

beforeAll(() => {});
beforeEach(() => {});

describe('outer', () => {
  try {
    teardown(() => {});
  } catch (e) {
    log(`inner before: ${e.message}`);
  }

  beforeAll(() => {});
  beforeEach(() => {});
  test("", () => {});

  try {
    teardown(() => {});
  } catch (e) {
    log(`inner after: ${e.message}`);
  }
});

try {
  teardown(() => {});
} catch (e) {
  log(`after: ${e.message}`);
}
