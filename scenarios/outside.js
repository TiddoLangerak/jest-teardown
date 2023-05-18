import { cleanup } from '../index.js';
import { log } from './util.js'

try {
  cleanup(() => {});
} catch (e) {
  log(e.message);
}
