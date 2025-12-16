import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import User from '../models/User.js';
import StudyGroup from '../models/StudyGroup.js';

let mongoServer;
let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_EXPIRE = '1h';

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  app = express();
  app.use(express.json());

  const authController = await import('../controllers/authController.js');
  const groupController = await import('../controllers/groupController.js');
  const { validateRegistration, validateLogin, authenticateToken } = await import('../middleware/auth.js');

  const authRouter = express.Router();
  authRouter.post('/register', validateRegistration, authController.register);
  authRouter.post('/login', validateLogin, authController.login);
  app.use('/api/auth', authRouter);

  const groupRouter = express.Router();
  groupRouter.post('/create', authenticateToken, groupController.createGroup);
  groupRouter.post('/join', authenticateToken, groupController.joinGroup);
  groupRouter.get('/:groupId/resources', groupController.getResources);
  groupRouter.post('/:groupId/resources', authenticateToken, groupController.addResource);
  groupRouter.delete('/:groupId/resources/:resourceId', authenticateToken, groupController.deleteResource);
  app.use('/api/groups', groupRouter);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await User.deleteMany({});
    await StudyGroup.deleteMany({});
  }
});

describe('Group resources API', () => {
  test('create group, add resource, list resources, delete resource', async () => {
    const user = {
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
      dateOfBirth: '2000-01-01',
      collegeName: 'Test College',
      currentYear: '2nd Year'
    };

    const reg = await request(app).post('/api/auth/register').send(user);
    expect(reg.status).toBe(201);

    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(login.status).toBe(200);
    const token = login.body.data.token;

    // Create group
    const createRes = await request(app).post('/api/groups/create').set('Authorization', `Bearer ${token}`).send({ name: 'Test Group', description: 'Desc long enough', subject: 'Other' });
    expect(createRes.status).toBe(201);
    const groupId = createRes.body.data.group._id;

    // Add a resource
    const addRes = await request(app).post(`/api/groups/${groupId}/resources`).set('Authorization', `Bearer ${token}`).send({ title: 'Important note', description: 'Remember this', type: 'note' });
    expect(addRes.status).toBe(201);
    const resourceId = addRes.body.data.resource._id;

    // List resources (public group by default)
    const listRes = await request(app).get(`/api/groups/${groupId}/resources`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.resources.length).toBe(1);

    // Delete resource
    const delRes = await request(app).delete(`/api/groups/${groupId}/resources/${resourceId}`).set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);

    const listAfter = await request(app).get(`/api/groups/${groupId}/resources`);
    expect(listAfter.status).toBe(200);
    expect(listAfter.body.data.resources.length).toBe(0);
  });
});
