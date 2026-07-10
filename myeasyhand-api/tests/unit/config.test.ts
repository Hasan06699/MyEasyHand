import { config } from '../../src/config';

describe('config', () => {
  it('has default API version', () => {
    expect(config.apiVersion).toBe('v1');
  });

  it('has port configured', () => {
    expect(config.port).toBeGreaterThan(0);
  });
});
