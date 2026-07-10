import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /api/v1/health', () => {
  const app = createApp();

  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.timestamp).toBeDefined();
  });
});

describe('GET /api/v1/health/ready', () => {
  const app = createApp();

  it('returns readiness payload', async () => {
    const res = await request(app).get('/api/v1/health/ready');

    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('mongo');
    expect(res.body.data).toHaveProperty('redis');
  });
});
