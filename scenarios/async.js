const { cleanup } = require('../index.js');
const { log } = require('./util.js');

const nextTick = () => new Promise(resolve => setTimeout(resolve));

describe('suite', () => {
  beforeAll(async() => {
    await nextTick();
    log('beforeAll');
    await nextTick();
    cleanup(async() => {
      await nextTick();
      log('cleanup all');
      await nextTick();
    });
  });

  beforeEach(async() => {
    await nextTick();
    log('beforeEach');
    await nextTick();
    cleanup(async() => {
      await nextTick();
      log('cleanup each');
      await nextTick();
    });
  });

  test('succeeding test', async() => {
    await nextTick();
    log('succeeding test');
    await nextTick();
    cleanup(async() => {
      await nextTick();
      log('cleanup succeeding test');
      await nextTick();
    });
  });
  it('failing it', async() => {
    await nextTick();
    log('failing it');
    await nextTick();
    cleanup(async() => {
      await nextTick();
      log('cleanup failing it');
      await nextTick();
    });
    throw new Error("Failing");
  });
});
