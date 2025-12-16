import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: [100, 'Title must not exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must not exceed 500 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [50, 'Subject must not exceed 50 characters']
  },
  date: {
    type: Date,
    required: [true, 'Session date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Session date must be in the future'
    }
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [100, 'Location must not exceed 100 characters']
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Maximum participants is required'],
    min: [1, 'Must allow at least 1 participant'],
    max: [50, 'Cannot exceed 50 participants']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
sessionSchema.index({ date: 1, startTime: 1 });
sessionSchema.index({ organizer: 1 });
sessionSchema.index({ 'participants.user': 1 });

// Virtual for checking if session is full
sessionSchema.virtual('isFull').get(function() {
  return this.participants.length >= this.maxParticipants;
});

// Method to add participant
sessionSchema.methods.addParticipant = function(userId) {
  if (this.isFull) {
    throw new Error('Session is full');
  }
  
  const alreadyJoined = this.participants.some(p => p.user.toString() === userId.toString());
  if (alreadyJoined) {
    throw new Error('User already joined this session');
  }
  
  this.participants.push({ user: userId });
  return this.save();
};

// Method to remove participant
sessionSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;