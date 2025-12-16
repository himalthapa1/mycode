import fc from 'fast-check';
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import User from '../models/User.js';
// Increase timeout for property-based tests which can be lengthy
jest.setTimeout(120000);

let mongoServer;
let app;

beforeAll(async () => {
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
  
  // Set up express app for testing without rate limiting
  app = express();
  app.use(express.json());
  
  // Import routes without rate limiter for testing
  const { register } = await import('../controllers/authController.js');
  const { validateRegistration } = await import('../middleware/auth.js');
  const router = express.Router();
  router.post('/register', validateRegistration, register);
  
  app.use('/api/auth', router);
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
  }
});

// Feature: auth-pages, Property 1: Valid registration creates user account
// Validates: Requirements 1.2
describe('Property 1: Valid registration creates user account', () => {
  test('for any valid user data, registration should create a new user in database', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 10 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 50 }),
          dateOfBirth: fc.date({ min: new Date(1950, 0, 1), max: new Date(2007, 0, 1) }).map(d => d.toISOString().split('T')[0]),
          collegeName: fc.string({ minLength: 3, maxLength: 50 }).map(s => `${s} College`),
          currentYear: fc.constantFrom('1st Year','2nd Year','3rd Year','4th Year','Other')
        }),
        async (userData) => {
          // Make unique to avoid collisions
          const uniqueId = Math.random().toString(36).substring(2, 8);
          const uniqueData = {
            username: `${userData.username}${uniqueId}`.substring(0, 30),
            email: `${uniqueId}${userData.email}`,
            password: userData.password,
            dateOfBirth: userData.dateOfBirth,
            collegeName: userData.collegeName,
            currentYear: userData.currentYear
          };

          const response = await request(app)
            .post('/api/auth/register')
            .send(uniqueData);

          // Should return 201 status
          expect(response.status).toBe(201);
          expect(response.body.success).toBe(true);
          expect(response.body.message).toBe('User registered successfully');
          
          // Should return user data
          expect(response.body.data.user).toBeDefined();
          expect(response.body.data.user.username).toBe(uniqueData.username);
          expect(response.body.data.user.email).toBe(uniqueData.email.toLowerCase());
          expect(response.body.data.user.id).toBeDefined();
          
          // Password should not be in response
          expect(response.body.data.user.password).toBeUndefined();
          
          // User should exist in database
          const dbUser = await User.findOne({ email: uniqueData.email.toLowerCase() });
          expect(dbUser).toBeDefined();
          expect(dbUser.username).toBe(uniqueData.username);
          expect(dbUser.email).toBe(uniqueData.email.toLowerCase());
          
          // Password should be hashed in database
          expect(dbUser.password).not.toBe(uniqueData.password);
          expect(dbUser.password).toMatch(/^\$2[ab]\$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: auth-pages, Property 2: Duplicate email registration is rejected
// Validates: Requirements 1.3
describe('Property 2: Duplicate email registration is rejected', () => {
  test('for any email that exists, attempting to register again should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 10 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 50 }),
          dateOfBirth: fc.date({ min: new Date(1950, 0, 1), max: new Date(2007, 0, 1) }).map(d => d.toISOString().split('T')[0]),
          collegeName: fc.string({ minLength: 3, maxLength: 50 }).map(s => `${s} College`),
          currentYear: fc.constantFrom('1st Year','2nd Year','3rd Year','4th Year','Other')
        }),
        async (userData) => {
          // Make unique
          const uniqueId = Math.random().toString(36).substring(2, 8);
          const firstUser = {
            username: `${userData.username}${uniqueId}`.substring(0, 30),
            email: `${uniqueId}${userData.email}`,
            password: userData.password
          };

          // Register first user
          const firstResponse = await request(app)
            .post('/api/auth/register')
            .send(firstUser);

          expect(firstResponse.status).toBe(201);

          // Try to register with same email but different username
          const duplicateUser = {
            username: `different${uniqueId}`.substring(0, 30),
            email: firstUser.email, // Same email
            password: 'differentpass123'
          };

          const duplicateResponse = await request(app)
            .post('/api/auth/register')
            .send(duplicateUser);

          // Should return 409 conflict status
          expect(duplicateResponse.status).toBe(409);
          expect(duplicateResponse.body.success).toBe(false);
          expect(duplicateResponse.body.error.code).toBe('EMAIL_EXISTS');
          expect(duplicateResponse.body.error.message).toBe('Email already registered');
          expect(duplicateResponse.body.error.field).toBe('email');
          
          // Only one user should exist in database
          const userCount = await User.countDocuments({ email: firstUser.email.toLowerCase() });
          expect(userCount).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
