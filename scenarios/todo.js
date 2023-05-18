import { cleanup } from '../index.js';
import { log } from './util.js'

describe("todo", () => {
  test.todo("todo test");
  test("test", () => {
    log("test");
  });
});
