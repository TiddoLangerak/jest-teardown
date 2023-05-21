const { teardown } = require('../index.js');
const { log } = require('./util.js');

describe('test', () => {
  test('succeeding test', () => {
    teardown(() => log('teardown succeeding test'));
    log('succeeding test');
  });

  it('succeeding it', () => {
    teardown(() => log('teardown succeeding it'));
    log('succeeding it');
  });

  test('failing test', () => {
    teardown(() => log('teardown failing test'));
    log('failing test');
    expect(true).toBe(false);
  });

  it('succeeding it', () => {
    teardown(() => log('teardown failing it'));
    log('failing it');
    expect(true).toBe(false);
  });
});
