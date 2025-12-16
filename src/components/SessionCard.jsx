import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './SessionCard.css';

const SessionCard = ({ 
  session, 
  onJoin, 
  onLeave, 
  onUpdate, 
  isOrganizer = false, 
  showJoinButton = false, 
  showLeaveButton = false 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isUserJoined = session.participants?.some(p => p.user._id === user?.id);
  const isFull = session.participants?.length >= session.maxParticipants;
  const isUserOrganizer = session.organizer._id === user?.id;

  const handleJoin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onJoin(session._id);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onLeave(session._id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="session-card">
      <div className="session-header">
        <h3 className="session-title">{session.title}</h3>
        <span className="session-subject">{session.subject}</span>
      </div>

      {session.description && (
        <p className="session-description">{session.description}</p>
      )}

      <div className="session-details">
        <div className="session-detail">
          <span className="detail-label">📅 Date:</span>
          <span className="detail-value">{formatDate(session.date)}</span>
        </div>

        <div className="session-detail">
          <span className="detail-label">⏰ Time:</span>
          <span className="detail-value">
            {formatTime(session.startTime)} - {formatTime(session.endTime)}
          </span>
        </div>

        <div className="session-detail">
          <span className="detail-label">📍 Location:</span>
          <span className="detail-value">{session.location}</span>
        </div>

        <div className="session-detail">
          <span className="detail-label">👥 Participants:</span>
          <span className="detail-value">
            {session.participants?.length || 0} / {session.maxParticipants}
            {isFull && <span className="full-badge">FULL</span>}
          </span>
        </div>

        <div className="session-detail">
          <span className="detail-label">👨‍🏫 Organizer:</span>
          <span className="detail-value">{session.organizer.username}</span>
        </div>
      </div>

      {session.participants && session.participants.length > 0 && (
        <div className="participants-list">
          <h4>Participants:</h4>
          <div className="participants">
            {session.participants.map((participant, index) => (
              <span key={participant.user._id} className="participant">
                {participant.user.username}
                {index < session.participants.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="session-actions">
        {showJoinButton && !isUserOrganizer && !isUserJoined && !isFull && (
          <button 
            className="join-btn"
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        )}

        {showLeaveButton && !isUserOrganizer && isUserJoined && (
          <button 
            className="leave-btn"
            onClick={handleLeave}
            disabled={loading}
          >
            {loading ? 'Leaving...' : 'Leave Session'}
          </button>
        )}

        {isOrganizer && (
          <div className="organizer-actions">
            <span className="organizer-badge">You're the organizer</span>
          </div>
        )}

        {isUserJoined && !isUserOrganizer && (
          <span className="joined-badge">✓ Joined</span>
        )}

        {isFull && !isUserJoined && !isUserOrganizer && (
          <span className="full-badge">Session Full</span>
        )}
      </div>
    </div>
  );
};

export default SessionCard;