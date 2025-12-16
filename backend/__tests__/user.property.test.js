import fc from 'fast-check';
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Increase timeout for property-based tests
jest.setTimeout(120000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

// Feature: auth-pages, Property 7: Passwords are hashed before storage
// Validates: Requirements 3.1
describe('Property 7: Passwords are hashed before storage', () => {
  test('for any password, the stored value should be a bcrypt hash and verifiable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6, maxLength: 50 }), // password
        fc.string({ minLength: 3, maxLength: 10 }), // username
        fc.emailAddress(), // email
        async (password, username, email) => {
          // Create unique identifiers that fit within constraints
          const uniqueId = Math.random().toString(36).substring(2, 8);
          const uniqueUsername = `${username}${uniqueId}`.substring(0, 30);
          const uniqueEmail = `${uniqueId}${email}`;
          
          // Create user with the generated password (include required profile fields)
          const user = new User({
            username: uniqueUsername,
            email: uniqueEmail,
            password,
            dateOfBirth: '2000-01-01',
            collegeName: 'Test College',
            currentYear: '2nd Year'
          });
          
          await user.save();
          
          // Fetch the user from database
          const savedUser = await User.findById(user._id).select('+password');
          
          // Password should not be stored in plain text
          expect(savedUser.password).not.toBe(password);
          
          // Password should be a bcrypt hash (starts with $2a$ or $2b$)
          expect(savedUser.password).toMatch(/^\$2[ab]\$/);
          
          // Hash should be verifiable against original password
          const isValid = await bcrypt.compare(password, savedUser.password);
          expect(isValid).toBe(true);
          
          // Wrong password should not validate
          const isInvalid = await bcrypt.compare(password + 'wrong', savedUser.password);
          expect(isInvalid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
