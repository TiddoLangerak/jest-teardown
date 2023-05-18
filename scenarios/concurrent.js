import { cleanup } from '../index.js';
import { log } from './util.js'

describe("concurrent", () => {
  test.concurrent("non-cleanup test", () => {
    log("non-cleanup test");
  });
  test.concurrent("cleanup test", async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    log("cleanup test");
    try {
      cleanup(() => {});
    } catch (e) {
      log(e.message);
    }
  });
});
