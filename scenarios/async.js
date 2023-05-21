const { teardown } = require('../index.js');
const { log } = require('./util.js');

const nextTick = () => new Promise(resolve => setTimeout(resolve));

describe('suite', () => {
  beforeAll(async() => {
    await nextTick();
    log('beforeAll');
    await nextTick();
    teardown(async() => {
      await nextTick();
      log('teardown all');
      await nextTick();
    });
  });

  beforeEach(async() => {
    await nextTick();
    log('beforeEach');
    await nextTick();
    teardown(async() => {
      await nextTick();
      log('teardown each');
      await nextTick();
    });
  });

  test('succeeding test', async() => {
    await nextTick();
    log('succeeding test');
    await nextTick();
    teardown(async() => {
      await nextTick();
      log('teardown succeeding test');
      await nextTick();
    });
  });
  it('failing it', async() => {
    await nextTick();
    log('failing it');
    await nextTick();
    teardown(async() => {
      await nextTick();
      log('teardown failing it');
      await nextTick();
    });
    throw new Error("Failing");
  });
});
