const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI.replace('/noteapp?', '/noteapp_test?');

const app = require('../server');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('POST /api/auth/register', () => {
  it('should register successfully with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: '123456' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  it('should fail with missing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: '123456' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].field).toBe('email');
  });

  it('should fail with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'not-an-email', password: '123456' });
    expect(res.statusCode).toBe(400);
  });

  it('should fail with password too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test2@example.com', password: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].field).toBe('password');
  });

  it('should fail with duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'user1', email: 'dup@example.com', password: '123456' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user2', email: 'dup@example.com', password: '123456' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'loginuser', email: 'login@example.com', password: '123456' });
  });

  it('should login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: '123456' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('should fail with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(400);
  });

  it('should fail with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: '123456' });
    expect(res.statusCode).toBe(400);
  });

  it('should fail with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].field).toBe('password');
  });
});
