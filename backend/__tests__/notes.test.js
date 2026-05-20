const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI.replace('/noteapp?', '/noteapp_test?');

const app = require('../server');

let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.dropDatabase();
  await request(app)
    .post('/api/auth/register')
    .send({ username: 'noteuser', email: 'note@example.com', password: '123456' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'note@example.com', password: '123456' });
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('POST /api/notes', () => {
  it('should create note successfully', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Note', content: 'Hello World' });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test Note');
  });

  it('should fail without auth token', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'Test Note' });
    expect(res.statusCode).toBe(401);
  });

  it('should fail with empty title', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '', content: 'No title' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].field).toBe('title');
  });
});

describe('GET /api/notes', () => {
  it('should get all notes', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.notes)).toBe(true);
  });

  it('should fail without auth token', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.statusCode).toBe(401);
  });
});

describe('DELETE /api/notes/:id', () => {
  let noteId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Delete', content: 'bye' });
    noteId = res.body._id;
  });

  it('should move note to trash', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('should not find deleted note in main list', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${token}`);
    const found = res.body.notes.find(n => n._id === noteId);
    expect(found).toBeUndefined();
  });
});

describe('DELETE /api/notes/trash/empty', () => {
  it('should empty trash', async () => {
    const res = await request(app)
      .delete('/api/notes/trash/empty')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});
