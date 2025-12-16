import StudyGroup from '../models/StudyGroup.js';
import User from '../models/User.js';

// @desc    Create a new study group
// @route   POST /api/groups/create
// @access  Private
export const createGroup = async (req, res) => {
  try {
    const { name, description, subject, maxMembers, isPublic } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!name || !description || !subject) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Name, description, and subject are required',
          code: 'MISSING_FIELDS'
        }
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Create study group
    const studyGroup = new StudyGroup({
      name,
      description,
      subject,
      creator: userId,
      members: [userId],
      maxMembers: maxMembers || 50,
      isPublic: isPublic !== undefined ? isPublic : true
    });

    await studyGroup.save();
    
    // Populate references
    await studyGroup.populate('creator', 'username email');
    await studyGroup.populate('members', 'username email');

    res.status(201).json({
      success: true,
      message: 'Study group created successfully',
      data: {
        group: studyGroup
      }
    });
  } catch (error) {
    console.error('Create group error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

// @desc    Join a study group
// @route   POST /api/groups/join
// @access  Private
export const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user.userId;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Group ID is required',
          code: 'MISSING_GROUP_ID'
        }
      });
    }

    // Find study group
    const studyGroup = await StudyGroup.findById(groupId)
      .populate('creator', 'username email')
      .populate('members', 'username email');

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Study group not found',
          code: 'GROUP_NOT_FOUND'
        }
      });
    }

    // Check if already a member
    if (studyGroup.isMember(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'You are already a member of this group',
          code: 'ALREADY_MEMBER'
        }
      });
    }

    // Check if group is full
    if (studyGroup.members.length >= studyGroup.maxMembers) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Group is full',
          code: 'GROUP_FULL'
        }
      });
    }

    // Add member to group
    await studyGroup.addMember(userId);
    
    // Re-populate after adding member
    await studyGroup.populate('members', 'username email');

    res.status(200).json({
      success: true,
      message: 'Successfully joined the study group',
      data: {
        group: studyGroup
      }
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

// @desc    Leave a study group
// @route   POST /api/groups/leave
// @access  Private
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user.userId;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Group ID is required',
          code: 'MISSING_GROUP_ID'
        }
      });
    }

    const studyGroup = await StudyGroup.findById(groupId)
      .populate('creator', 'username email')
      .populate('members', 'username email');

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Study group not found',
          code: 'GROUP_NOT_FOUND'
        }
      });
    }

    // Check if user is creator
    if (studyGroup.creator._id.equals(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Creator cannot leave the group',
          code: 'CREATOR_CANNOT_LEAVE'
        }
      });
    }

    // Remove member from group
    await studyGroup.removeMember(userId);

    res.status(200).json({
      success: true,
      message: 'Successfully left the study group',
      data: {
        group: studyGroup
      }
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

// @desc    Get all public study groups
// @route   GET /api/groups/list
// @access  Public
export const listGroups = async (req, res) => {
  try {
    const { subject, page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { isPublic: true };

    if (subject) {
      query.subject = subject;
    }

    if (search) {
      // Use regex search instead of text index for better compatibility
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const groups = await StudyGroup.find(query)
      .populate('creator', 'username email')
      .populate('members', 'username email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await StudyGroup.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        groups,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('List groups error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

// @desc    Get user's study groups
// @route   GET /api/groups/my-groups
// @access  Private
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const groups = await StudyGroup.find({ members: userId })
      .populate('creator', 'username email')
      .populate('members', 'username email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await StudyGroup.countDocuments({ members: userId });

    res.status(200).json({
      success: true,
      data: {
        groups,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my groups error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

// @desc    Get a specific study group
// @route   GET /api/groups/:groupId
// @access  Public
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    const studyGroup = await StudyGroup.findById(groupId)
      .populate('creator', 'username email')
      .populate('members', 'username email');

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Study group not found',
          code: 'GROUP_NOT_FOUND'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        group: studyGroup
      }
    });
  } catch (error) {
    console.error('Get group by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

// @desc    Get resources/notes for a group
// @route   GET /api/groups/:groupId/resources
// @access  Public (if group public) or Private if group is private
export const getResources = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.userId;

    const studyGroup = await StudyGroup.findById(groupId)
      .populate('creator', 'username email')
      .populate('members', 'username email')
      .populate('resources.creator', 'username email');

    if (!studyGroup) {
      return res.status(404).json({ success: false, error: { message: 'Study group not found', code: 'GROUP_NOT_FOUND' } });
    }

    // If group is private, only members can view resources
    if (!studyGroup.isPublic) {
      if (!userId || !studyGroup.isMember(userId)) {
        return res.status(403).json({ success: false, error: { message: 'Access denied', code: 'ACCESS_DENIED' } });
      }
    }

    res.status(200).json({ success: true, data: { resources: studyGroup.resources || [] } });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ success: false, error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
};

// @desc    Add a resource/note to a group
// @route   POST /api/groups/:groupId/resources
// @access  Private (members only)
export const addResource = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { title, url, description, type, isPublic } = req.body;
    const userId = req.user.userId;

    if (!title) {
      return res.status(400).json({ success: false, error: { message: 'Title is required', code: 'MISSING_TITLE' } });
    }

    const studyGroup = await StudyGroup.findById(groupId).populate('members', 'username email');
    if (!studyGroup) {
      return res.status(404).json({ success: false, error: { message: 'Study group not found', code: 'GROUP_NOT_FOUND' } });
    }

    // Only members can add resources
    if (!studyGroup.isMember(userId)) {
      return res.status(403).json({ success: false, error: { message: 'Only group members can add resources', code: 'NOT_A_MEMBER' } });
    }

    const newResource = {
      title,
      url,
      description,
      type: type || 'resource',
      creator: userId,
      isPublic: isPublic !== undefined ? isPublic : true
    };

    studyGroup.resources.push(newResource);
    await studyGroup.save();

    // Populate the last pushed resource's creator
    await studyGroup.populate('resources.creator', 'username email');
    const created = studyGroup.resources[studyGroup.resources.length - 1];

    res.status(201).json({ success: true, message: 'Resource added', data: { resource: created } });
  } catch (error) {
    console.error('Add resource error:', error);
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map(err => ({ field: err.path, message: err.message }));
      return res.status(400).json({ success: false, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details } });
    }
    res.status(500).json({ success: false, error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
};

// @desc    Update a resource
// @route   PUT /api/groups/:groupId/resources/:resourceId
// @access  Private (resource owner or group creator)
export const updateResource = async (req, res) => {
  try {
    const { groupId, resourceId } = req.params;
    const updates = req.body;
    const userId = req.user.userId;

    const studyGroup = await StudyGroup.findById(groupId).populate('creator', 'username email');
    if (!studyGroup) {
      return res.status(404).json({ success: false, error: { message: 'Study group not found', code: 'GROUP_NOT_FOUND' } });
    }

    const resource = studyGroup.resources.id(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, error: { message: 'Resource not found', code: 'RESOURCE_NOT_FOUND' } });
    }

    // Only resource creator or group creator can update
    if (!resource.creator.equals(userId) && !studyGroup.creator._id.equals(userId)) {
      return res.status(403).json({ success: false, error: { message: 'Permission denied', code: 'PERMISSION_DENIED' } });
    }

    // Apply allowed updates
    const allowed = ['title', 'url', 'description', 'type', 'isPublic'];
    allowed.forEach(key => {
      if (updates[key] !== undefined) resource[key] = updates[key];
    });

    await studyGroup.save();
    await resource.populate('creator', 'username email');

    res.status(200).json({ success: true, message: 'Resource updated', data: { resource } });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ success: false, error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
};

// @desc    Delete a resource
// @route   DELETE /api/groups/:groupId/resources/:resourceId
// @access  Private (resource owner or group creator)
export const deleteResource = async (req, res) => {
  try {
    const { groupId, resourceId } = req.params;
    const userId = req.user.userId;

    const studyGroup = await StudyGroup.findById(groupId).populate('creator', 'username email');
    if (!studyGroup) {
      return res.status(404).json({ success: false, error: { message: 'Study group not found', code: 'GROUP_NOT_FOUND' } });
    }

    const resource = studyGroup.resources.id(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, error: { message: 'Resource not found', code: 'RESOURCE_NOT_FOUND' } });
    }

    // Only resource creator or group creator can delete
    if (!resource.creator.equals(userId) && !studyGroup.creator._id.equals(userId)) {
      return res.status(403).json({ success: false, error: { message: 'Permission denied', code: 'PERMISSION_DENIED' } });
    }

    // Remove the resource from array
    studyGroup.resources = studyGroup.resources.filter(r => r._id.toString() !== resourceId);
    await studyGroup.save();

    res.status(200).json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ success: false, error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
};
