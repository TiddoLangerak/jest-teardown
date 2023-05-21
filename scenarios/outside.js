const { cleanup } = require('../index.js');
const { log } = require('./util.js');

try {
  cleanup(() => {});
} catch (e) {
  log(e.message);
}

// Needed to make the test suite not empty
test("", () => {});
