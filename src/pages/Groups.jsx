import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../utils/api';
import ResourcesList from '../components/ResourcesList';
import './Groups.css';

const ResourcesToggle = ({ group }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="resources-toggle">
      <button className="resources-button" onClick={() => setOpen(o => !o)}>
        {open ? 'Hide Resources' : 'Resources'}
      </button>
      {open && <ResourcesList group={group} />}
    </div>
  );
};

const Groups = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states for creating group
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: 'Other',
    maxMembers: 50,
    isPublic: true
  });

  // Search/filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English',
    'History',
    'Other'
  ];

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchGroups();
    } else if (activeTab === 'my-groups') {
      fetchMyGroups();
    }
  }, [activeTab, searchQuery, selectedSubject]);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedSubject) params.subject = selectedSubject;
      
      const response = await groupsAPI.listGroups(params);
      setGroups(response.data.data.groups || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await groupsAPI.getMyGroups();
      setMyGroups(response.data.data.groups || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch your groups');
      setMyGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await groupsAPI.createGroup(formData);
      setSuccess('Study group created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        subject: 'Other',
        maxMembers: 50,
        isPublic: true
      });

      // Refresh groups
      await fetchMyGroups();
      setActiveTab('my-groups');
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to create group';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    setLoading(true);
    setError(null);
    try {
      await groupsAPI.joinGroup(groupId);
      setSuccess('Successfully joined the group!');
      
      // Refresh both lists
      await Promise.all([fetchGroups(), fetchMyGroups()]);
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to join group';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (confirm('Are you sure you want to leave this group?')) {
      setLoading(true);
      setError(null);
      try {
        await groupsAPI.leaveGroup(groupId);
        setSuccess('Successfully left the group');
        
        // Refresh groups
        await fetchMyGroups();
      } catch (err) {
        const errorMsg = err.response?.data?.error?.message || 'Failed to leave group';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="groups-container">
      <div className="groups-header">
        <h1>Study Groups</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="groups-tabs">
        <button
          className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Groups
        </button>
        <button
          className={`tab-button ${activeTab === 'my-groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-groups')}
        >
          My Groups
        </button>
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Group
        </button>
      </div>

      {/* Browse Groups Tab */}
      {activeTab === 'browse' && (
        <div className="tab-content">
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="subject-filter"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading groups...</div>
          ) : groups.length > 0 ? (
            <div className="groups-grid">
              {groups.map(group => {
                const isMember = group.members.some(m => m._id.toString() === user?.id?.toString());
                return (
                  <div key={group._id} className="group-card">
                    <div className="group-card-header">
                      <h3>{group.name}</h3>
                      <span className="subject-badge">{group.subject}</span>
                    </div>
                    
                    <p className="group-description">{group.description}</p>
                    
                    <div className="group-info">
                      <span className="member-count">
                        {group.members.length} / {group.maxMembers} members
                      </span>
                      <span className="creator">
                        Created by {group.creator.username}
                      </span>
                    </div>

                    <div className="group-members">
                      <strong>Members:</strong>
                      <div className="members-list">
                        {group.members.slice(0, 3).map(member => (
                          <span key={member._id} className="member-tag">
                            {member.username}
                          </span>
                        ))}
                        {group.members.length > 3 && (
                          <span className="more-members">
                            +{group.members.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {!isMember && (
                      <button
                        className="join-button"
                        onClick={() => handleJoinGroup(group._id)}
                        disabled={loading || group.members.length >= group.maxMembers}
                      >
                        {group.members.length >= group.maxMembers ? 'Group Full' : 'Join Group'}
                      </button>
                    )}
                    {isMember && (
                      <button className="member-badge">✓ Member</button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No groups found. Try adjusting your search or create a new group!</p>
            </div>
          )}
        </div>
      )}

      {/* My Groups Tab */}
      {activeTab === 'my-groups' && (
        <div className="tab-content">
          {loading ? (
            <div className="loading">Loading your groups...</div>
          ) : myGroups.length > 0 ? (
            <div className="groups-grid">
              {myGroups.map(group => (
                <div key={group._id} className="group-card">
                  <div className="group-card-header">
                    <h3>{group.name}</h3>
                    <span className="subject-badge">{group.subject}</span>
                  </div>
                  
                  <p className="group-description">{group.description}</p>
                  
                  <div className="group-info">
                    <span className="member-count">
                      {group.members.length} / {group.maxMembers} members
                    </span>
                    {group.creator._id.toString() === user?.id?.toString() && (
                      <span className="creator-badge">You are the creator</span>
                    )}
                  </div>

                  <div className="group-members">
                    <strong>Members:</strong>
                    <div className="members-list">
                      {group.members.map(member => (
                        <span key={member._id} className="member-tag">
                          {member.username}
                        </span>
                      ))}
                    </div>
                  </div>

                  {group.creator._id.toString() !== user?.id?.toString() && (
                    <button
                      className="leave-button"
                      onClick={() => handleLeaveGroup(group._id)}
                      disabled={loading}
                    >
                      Leave Group
                    </button>
                  )}

                  {/* Resources toggle */}
                  <ResourcesToggle group={group} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>You haven't joined any groups yet. Browse and join one!</p>
            </div>
          )}
        </div>
      )}

      {/* Create Group Tab */}
      {activeTab === 'create' && (
        <div className="tab-content">
          <form onSubmit={handleCreateGroup} className="create-group-form">
            <div className="form-group">
              <label htmlFor="name">Group Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter group name (3-100 characters)"
                required
                minLength={3}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your study group (10-500 characters)"
                required
                minLength={10}
                maxLength={500}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="maxMembers">Maximum Members</label>
              <input
                type="number"
                id="maxMembers"
                name="maxMembers"
                value={formData.maxMembers}
                onChange={handleInputChange}
                min={2}
                max={500}
              />
            </div>

            <div className="form-group checkbox">
              <label htmlFor="isPublic">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                />
                Make group public (visible to all users)
              </label>
            </div>

            <button
              type="submit"
              className="create-button"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Groups;
