const { cleanup } = require('../index.js');
const { log } = require('./util.js');

describe('test', () => {
  test('succeeding test', () => {
    cleanup(() => log('cleanup succeeding test'));
    log('succeeding test');
  });

  it('succeeding it', () => {
    cleanup(() => log('cleanup succeeding it'));
    log('succeeding it');
  });

  test('failing test', () => {
    cleanup(() => log('cleanup failing test'));
    log('failing test');
    expect(true).toBe(false);
  });

  it('succeeding it', () => {
    cleanup(() => log('cleanup failing it'));
    log('failing it');
    expect(true).toBe(false);
  });
});
