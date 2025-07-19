import { checkSDKHealth } from '../synapseSDK';

describe('Synapse SDK Health Check', () => {
  it('should return healthy status with mock SDK', async () => {
    const health = await checkSDKHealth();
    expect(health.healthy).toBe(true);
    expect(health.network).toBe('calibration');
    expect(health.version).toBe('unknown');
  });
});