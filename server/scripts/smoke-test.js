/**
 * Smoke test: boots the real Express app against an in-memory MongoDB
 * (mongodb-memory-server — no local mongod needed) and exercises the API
 * end to end with fetch: register -> login -> create -> list -> stats ->
 * update status -> delete -> unauthorised check.
 * Run: npm run smoke
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-secret';

const assert = require('node:assert');

(async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoose = require('mongoose');
  const createApp = require('../app');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('applytrack-smoke'));

  const server = createApp().listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;

  async function call(method, path, { token, body } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
  }

  try {
    let r = await call('GET', '/health');
    assert.strictEqual(r.status, 200);
    console.log('ok  GET  /health');

    r = await call('POST', '/auth/register', {
      body: { name: 'Test User', email: 'test@example.com', password: 'password123' },
    });
    assert.strictEqual(r.status, 201, JSON.stringify(r.data));
    assert.ok(r.data.token && r.data.user.email === 'test@example.com');
    assert.ok(!('password' in r.data.user), 'password hash must not be returned');
    const token = r.data.token;
    console.log('ok  POST /auth/register (token issued, no password hash leaked)');

    r = await call('POST', '/auth/login', { body: { email: 'test@example.com', password: 'wrong-password' } });
    assert.strictEqual(r.status, 401);
    console.log('ok  POST /auth/login rejects a wrong password');

    r = await call('POST', '/auth/login', { body: { email: 'test@example.com', password: 'password123' } });
    assert.strictEqual(r.status, 200);
    console.log('ok  POST /auth/login');

    r = await call('GET', '/applications');
    assert.strictEqual(r.status, 401);
    console.log('ok  GET  /applications without a token -> 401');

    r = await call('POST', '/applications', {
      token,
      body: { company: 'Acme', role: 'Full Stack Developer', status: 'Applied', location: 'Mumbai' },
    });
    assert.strictEqual(r.status, 201, JSON.stringify(r.data));
    const appId = r.data.application._id;
    console.log('ok  POST /applications (created)');

    r = await call('POST', '/applications', {
      token,
      body: { company: 'Globex', role: 'Backend Developer', status: 'Interview' },
    });
    assert.strictEqual(r.status, 201);

    r = await call('GET', '/applications', { token });
    assert.strictEqual(r.data.count, 2);
    console.log('ok  GET  /applications (list, count=2)');

    r = await call('GET', '/applications/stats', { token });
    assert.strictEqual(r.data.total, 2);
    assert.strictEqual(r.data.byStatus.Applied, 1);
    assert.strictEqual(r.data.byStatus.Interview, 1);
    assert.strictEqual(r.data.inProgress, 1);
    console.log('ok  GET  /applications/stats (total=2, Applied=1, Interview=1)');

    r = await call('PUT', `/applications/${appId}`, { token, body: { status: 'Offer', notes: 'Verbal offer' } });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.data.application.status, 'Offer');
    console.log('ok  PUT  /applications/:id (status moved to Offer)');

    r = await call('PUT', `/applications/${appId}`, { token, body: { status: 'Not A Status' } });
    assert.strictEqual(r.status, 400);
    console.log('ok  PUT  /applications/:id rejects an invalid status enum');

    r = await call('DELETE', `/applications/${appId}`, { token });
    assert.strictEqual(r.status, 200);
    r = await call('GET', '/applications', { token });
    assert.strictEqual(r.data.count, 1);
    console.log('ok  DELETE /applications/:id');

    console.log('\nSMOKE TEST PASSED');
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
  }
})().catch((err) => {
  console.error('\nSMOKE TEST FAILED:', err);
  process.exit(1);
});
