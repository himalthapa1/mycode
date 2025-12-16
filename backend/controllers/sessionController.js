import Session from '../models/Session.js';
import User from '../models/User.js';

// @desc    Create new session
// @route   POST /api/sessions
// @access  Private
export const createSession = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      date,
      startTime,
      endTime,
      location,
      maxParticipants,
      isPublic
    } = req.body;

    // Validate end time is after start time
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    if (end <= start) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'End time must be after start time',
          code: 'INVALID_TIME_RANGE'
        }
      });
    }

    const session = new Session({
      title,
      description,
      subject,
      date,
      startTime,
      endTime,
      location,
      maxParticipants,
      organizer: req.user.userId,
      isPublic: isPublic !== undefined ? isPublic : true
    });

    await session.save();
    await session.populate('organizer', 'username email');

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Create session error:', error);
    
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

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Private
export const getSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, date, status = 'scheduled' } = req.query;
    
    const query = { isPublic: true, status };
    
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: searchDate, $lt: nextDay };
    }

    const sessions = await Session.find(query)
      .populate('organizer', 'username email')
      .populate('participants.user', 'username email')
      .sort({ date: 1, startTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Session.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

// @desc    Get user's sessions (organized or joined)
// @route   GET /api/sessions/my
// @access  Private
export const getMySessions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const organizedSessions = await Session.find({ organizer: userId })
      .populate('organizer', 'username email')
      .populate('participants.user', 'username email')
      .sort({ date: 1, startTime: 1 });

    const joinedSessions = await Session.find({ 
      'participants.user': userId,
      organizer: { $ne: userId }
    })
      .populate('organizer', 'username email')
      .populate('participants.user', 'username email')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        organized: organizedSessions,
        joined: joinedSessions
      }
    });
  } catch (error) {
    console.error('Get my sessions error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

// @desc    Join a session
// @route   POST /api/sessions/:id/join
// @access  Private
export const joinSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    if (session.organizer.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot join your own session',
          code: 'CANNOT_JOIN_OWN_SESSION'
        }
      });
    }

    await session.addParticipant(req.user.userId);
    await session.populate('organizer', 'username email');
    await session.populate('participants.user', 'username email');

    res.status(200).json({
      success: true,
      message: 'Successfully joined the session',
      data: { session }
    });
  } catch (error) {
    console.error('Join session error:', error);
    
    if (error.message === 'Session is full' || error.message === 'User already joined this session') {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: 'JOIN_ERROR'
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

// @desc    Leave a session
// @route   POST /api/sessions/:id/leave
// @access  Private
export const leaveSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    await session.removeParticipant(req.user.userId);
    await session.populate('organizer', 'username email');
    await session.populate('participants.user', 'username email');

    res.status(200).json({
      success: true,
      message: 'Successfully left the session',
      data: { session }
    });
  } catch (error) {
    console.error('Leave session error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private (organizer only)
export const updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    if (session.organizer.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to update this session',
          code: 'NOT_AUTHORIZED'
        }
      });
    }

    const allowedUpdates = ['title', 'description', 'subject', 'date', 'startTime', 'endTime', 'location', 'maxParticipants', 'isPublic'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Validate time range if both times are being updated
    if (updates.startTime && updates.endTime) {
      const start = new Date(`2000-01-01 ${updates.startTime}`);
      const end = new Date(`2000-01-01 ${updates.endTime}`);
      
      if (end <= start) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'End time must be after start time',
            code: 'INVALID_TIME_RANGE'
          }
        });
      }
    }

    Object.assign(session, updates);
    await session.save();
    await session.populate('organizer', 'username email');
    await session.populate('participants.user', 'username email');

    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Update session error:', error);
    
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

// @desc    Delete session
// @route   DELETE /api/sessions/:id
// @access  Private (organizer only)
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    if (session.organizer.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to delete this session',
          code: 'NOT_AUTHORIZED'
        }
      });
    }

    await Session.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};