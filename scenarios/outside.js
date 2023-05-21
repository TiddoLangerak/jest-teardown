const { teardown } = require('../index.js');
const { log } = require('./util.js');

try {
  teardown(() => {});
} catch (e) {
  log(e.message);
}

// Needed to make the test suite not empty
test("", () => {});
