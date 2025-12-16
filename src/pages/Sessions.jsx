import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SessionCard from '../components/SessionCard';
import CreateSessionModal from '../components/CreateSessionModal';
import './Sessions.css';

const Sessions = () => {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [mySessions, setMySessions] = useState({ organized: [], joined: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    date: ''
  });

  useEffect(() => {
    fetchSessions();
    fetchMySessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.subject) queryParams.append('subject', filters.subject);
      if (filters.date) queryParams.append('date', filters.date);

      const response = await fetch(`http://localhost:5000/api/sessions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchMySessions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sessions/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMySessions(data.data);
      }
    } catch (error) {
      console.error('Error fetching my sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchSessions();
        fetchMySessions();
      } else {
        const error = await response.json();
        alert(error.error.message);
      }
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Failed to join session');
    }
  };

  const handleLeaveSession = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchSessions();
        fetchMySessions();
      }
    } catch (error) {
      console.error('Error leaving session:', error);
      alert('Failed to leave session');
    }
  };

  const handleCreateSession = () => {
    fetchSessions();
    fetchMySessions();
    setShowCreateModal(false);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    fetchSessions();
  };

  const clearFilters = () => {
    setFilters({ subject: '', date: '' });
    setTimeout(fetchSessions, 100);
  };

  if (loading) {
    return (
      <div className="sessions-container">
        <div className="loading">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      <div className="sessions-header">
        <h1>Study Sessions</h1>
        <button 
          className="create-session-btn"
          onClick={() => setShowCreateModal(true)}
        >
          Schedule New Session
        </button>
      </div>

      <div className="sessions-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Sessions
        </button>
        <button 
          className={`tab ${activeTab === 'organized' ? 'active' : ''}`}
          onClick={() => setActiveTab('organized')}
        >
          My Sessions ({mySessions.organized.length})
        </button>
        <button 
          className={`tab ${activeTab === 'joined' ? 'active' : ''}`}
          onClick={() => setActiveTab('joined')}
        >
          Joined Sessions ({mySessions.joined.length})
        </button>
      </div>

      {activeTab === 'all' && (
        <div className="filters-section">
          <div className="filters">
            <input
              type="text"
              placeholder="Filter by subject..."
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
            />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            />
            <button onClick={applyFilters} className="filter-btn">Apply</button>
            <button onClick={clearFilters} className="clear-btn">Clear</button>
          </div>
        </div>
      )}

      <div className="sessions-content">
        {activeTab === 'all' && (
          <div className="sessions-grid">
            {sessions.length === 0 ? (
              <div className="no-sessions">No sessions found</div>
            ) : (
              sessions.map(session => (
                <SessionCard
                  key={session._id}
                  session={session}
                  onJoin={handleJoinSession}
                  onLeave={handleLeaveSession}
                  showJoinButton={true}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'organized' && (
          <div className="sessions-grid">
            {mySessions.organized.length === 0 ? (
              <div className="no-sessions">You haven't organized any sessions yet</div>
            ) : (
              mySessions.organized.map(session => (
                <SessionCard
                  key={session._id}
                  session={session}
                  isOrganizer={true}
                  onUpdate={() => {
                    fetchSessions();
                    fetchMySessions();
                  }}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'joined' && (
          <div className="sessions-grid">
            {mySessions.joined.length === 0 ? (
              <div className="no-sessions">You haven't joined any sessions yet</div>
            ) : (
              mySessions.joined.map(session => (
                <SessionCard
                  key={session._id}
                  session={session}
                  onLeave={handleLeaveSession}
                  showLeaveButton={true}
                />
              ))
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSession}
        />
      )}
    </div>
  );
};

export default Sessions;