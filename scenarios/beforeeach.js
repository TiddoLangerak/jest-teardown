import { cleanup } from '../index.js';
import { log } from './util.js'

describe('suite', () => {
  beforeEach(() => {
    log("Before each");
    cleanup(() => log("Cleanup"));
  });
  test("test1", () => log("test 1"));
  test("test2", () => log("test 2"));
});
