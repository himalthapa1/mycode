import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../utils/api';
import ResourceForm from './ResourceForm';

const ResourcesList = ({ group }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await groupsAPI.getResources(group._id);
      setResources(res.data.data.resources || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [group._id]);

  const handleAdd = async (data) => {
    try {
      await groupsAPI.addResource(group._id, data);
      await fetchResources();
      setOpenForm(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add resource');
    }
  };

  const handleDelete = async (resourceId) => {
    if (!confirm('Delete this resource?')) return;
    try {
      await groupsAPI.deleteResource(group._id, resourceId);
      await fetchResources();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete resource');
    }
  };

  const canManage = (resource) => {
    return user && (resource.creator?._id?.toString() === user.id?.toString() || group.creator._id?.toString() === user.id?.toString());
  };

  return (
    <div className="resources-section">
      <div className="resources-header">
        <h4>Resources & Notes</h4>
        <button onClick={() => setOpenForm(o => !o)}>{openForm ? 'Close' : 'Add Resource'}</button>
      </div>

      {openForm && <ResourceForm onSubmit={handleAdd} />}

      {loading ? (
        <div>Loading resources...</div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : resources.length === 0 ? (
        <div className="empty-state">No resources yet.</div>
      ) : (
        <ul className="resources-list">
          {resources.map(r => (
            <li key={r._id} className="resource-item">
              <div className="resource-main">
                <strong>{r.title}</strong> <em>({r.type})</em>
                {r.url && <div><a href={r.url} target="_blank" rel="noreferrer">Open link</a></div>}
                {r.description && <div className="resource-desc">{r.description}</div>}
                <div className="resource-meta">Shared by {r.creator?.username} · {new Date(r.createdAt).toLocaleString()}</div>
              </div>
              {canManage(r) && (
                <div className="resource-actions">
                  <button onClick={() => handleDelete(r._id)}>Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResourcesList;
