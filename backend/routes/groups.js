import express from 'express';
import {
  createGroup,
  joinGroup,
  leaveGroup,
  listGroups,
  getMyGroups,
  getGroupById
  , getResources, addResource, updateResource, deleteResource
} from '../controllers/groupController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes - specific routes first!
router.get('/list', listGroups);

// Private routes (require authentication)
router.post('/create', authenticateToken, createGroup);
router.post('/join', authenticateToken, joinGroup);
router.post('/leave', authenticateToken, leaveGroup);
router.get('/my-groups', authenticateToken, getMyGroups);

// Resources endpoints
router.get('/:groupId/resources', getResources);
router.post('/:groupId/resources', authenticateToken, addResource);
router.put('/:groupId/resources/:resourceId', authenticateToken, updateResource);
router.delete('/:groupId/resources/:resourceId', authenticateToken, deleteResource);

// Generic route - must be last
router.get('/:groupId', getGroupById);

export default router;
