import express from 'express';
import {
  createSession,
  getSessions,
  getMySessions,
  joinSession,
  leaveSession,
  updateSession,
  deleteSession
} from '../controllers/sessionController.js';
import { authenticateToken } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// Session validation middleware
const validateSession = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  
  body('subject')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Subject must be between 1 and 50 characters'),
  
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Session date must be in the future');
      }
      return true;
    }),
  
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid start time (HH:MM)'),
  
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid end time (HH:MM)'),
  
  body('location')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location must be between 1 and 100 characters'),
  
  body('maxParticipants')
    .isInt({ min: 1, max: 50 })
    .withMessage('Maximum participants must be between 1 and 50'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value')
];

// All routes require authentication
router.use(authenticateToken);

// Create session
router.post('/', validateSession, createSession);

// Get all public sessions
router.get('/', getSessions);

// Get user's sessions
router.get('/my', getMySessions);

// Join session
router.post('/:id/join', joinSession);

// Leave session
router.post('/:id/leave', leaveSession);

// Update session
router.put('/:id', validateSession, updateSession);

// Delete session
router.delete('/:id', deleteSession);

export default router;