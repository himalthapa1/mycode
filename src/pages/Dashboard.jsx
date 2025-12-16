import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewGroups = () => {
    navigate('/groups');
  };

  const handleViewSessions = () => {
    navigate('/sessions');
  };

  const features = [
    {
      icon: '👥',
      title: 'Study Groups',
      description: 'Create or join groups with peers studying the same subjects',
      action: 'Browse Groups',
      onClick: handleViewGroups,
      color: 'feature-blue'
    },
    {
      icon: '📅',
      title: 'Schedule Sessions',
      description: 'Plan and attend collaborative study sessions with others',
      action: 'View Sessions',
      onClick: handleViewSessions,
      color: 'feature-purple'
    },
    {
      icon: '🎓',
      title: 'Learn Together',
      description: 'Share resources, discuss topics, and grow with your group',
      action: 'Get Started',
      onClick: handleViewGroups,
      color: 'feature-green'
    }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="header-title">📚 Study Hub</h1>
          <p className="header-subtitle">Your collaborative learning platform</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <div className="welcome-card">
            <div className="welcome-header">
              <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
              <div>
                <h2>Welcome back, <span className="highlight">{user?.username}</span>!</h2>
                <p className="user-info">{user?.email}</p>
              </div>
            </div>
            <p className="welcome-message">
              You're all set to start collaborating with other students. Explore study groups or schedule sessions to get started.
            </p>
          </div>
        </section>

        <section className="features-section">
          <h2 className="section-title">What You Can Do</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className={`feature-card ${feature.color}`}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <button 
                  className="feature-button" 
                  onClick={feature.onClick}
                >
                  {feature.action} →
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="getting-started-section">
          <div className="getting-started-card">
            <h2>Getting Started</h2>
            <div className="steps-grid">
              <div className="step">
                <div className="step-number">1</div>
                <h4>Complete Your Profile</h4>
                <p>Set up your study preferences and interests</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h4>Find or Create Groups</h4>
                <p>Join groups matching your subjects and goals</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h4>Schedule Sessions</h4>
                <p>Coordinate study times with your group members</p>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <h4>Collaborate & Learn</h4>
                <p>Share resources and ace your exams together</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
