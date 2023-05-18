import { cleanup } from '../index.js';
import { log } from './util.js'

describe('suite', () => {
  beforeAll(() => {
    log("Outer before all");
    cleanup(() => log("Outer cleanup"));
  });
  describe("inner suite", () => {
    beforeAll(() => {
      log("Inner before all");
      cleanup(() => log("Inner cleanup"));
    });
    test("test1", () => log("test 1"));
    test("test2", () => log("test 2"));
  });

  describe("inner suite 2", () => {
    beforeAll(() => {
      log("Inner before all 2");
      cleanup(() => log("Inner cleanup 2"));
    });
    test("test3", () => log("test 3"));
    test("test4", () => log("test 4"));
  });
});
