import fc from 'fast-check';
import { jest } from '@jest/globals';
// Increase timeout for property-based tests
jest.setTimeout(120000);
import express from 'express';
import request from 'supertest';
import { validateRegistration } from '../middleware/auth.js';

// Feature: auth-pages, Property 10: Backend validates all registration inputs
// Validates: Requirements 6.1
describe('Property 10: Backend validates all registration inputs', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Test endpoint that uses validation middleware
    app.post('/test/register', validateRegistration, (req, res) => {
      res.status(200).json({ success: true, message: 'Validation passed' });
    });
  });

  test('for any invalid registration input, validation should reject before processing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Invalid username cases
          fc.record({
            username: fc.string({ maxLength: 2 }), // too short
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6 })
          }),
          fc.record({
            username: fc.string({ minLength: 31 }), // too long
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6 })
          }),
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 30 }).map(s => s + '!@#'), // invalid chars
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6 })
          }),
          // Invalid email cases
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 30 }),
            email: fc.string().filter(s => !s.includes('@')), // invalid email
            password: fc.string({ minLength: 6 })
          }),
          // Invalid password cases
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 30 }),
            email: fc.emailAddress(),
            password: fc.string({ maxLength: 5 }) // too short
          }),
          // Missing fields
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 30 }),
            email: fc.emailAddress()
            // password missing
          }),
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
            password: fc.string({ minLength: 6 })
            // email missing
          })
        ),
        async (invalidData) => {
          const response = await request(app)
            .post('/test/register')
            .send(invalidData);

          // Should return 400 status for validation errors
          expect(response.status).toBe(400);
          
          // Should have error structure
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
          expect(response.body.error.code).toBe('VALIDATION_ERROR');
          expect(response.body.error.message).toBe('Validation failed');
          expect(response.body.error.details).toBeDefined();
          expect(Array.isArray(response.body.error.details)).toBe(true);
          expect(response.body.error.details.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('for any valid registration input, validation should pass', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 30 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 50 }),
          dateOfBirth: fc.date({ min: new Date(1950, 0, 1), max: new Date(2007, 0, 1) }).map(d => d.toISOString().split('T')[0]),
          collegeName: fc.string({ minLength: 3, maxLength: 50 }).map(s => `${s} College`),
          currentYear: fc.constantFrom('1st Year','2nd Year','3rd Year','4th Year','Other')
        }),
        async (validData) => {
          const response = await request(app)
            .post('/test/register')
            .send(validData);

          // Should return 200 status for valid data
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
