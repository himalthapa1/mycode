import { useState } from 'react';

const ResourceForm = ({ onSubmit, initial = {} }) => {
  const [title, setTitle] = useState(initial.title || '');
  const [url, setUrl] = useState(initial.url || '');
  const [description, setDescription] = useState(initial.description || '');
  const [type, setType] = useState(initial.type || 'resource');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), url: url.trim() || undefined, description: description.trim() || undefined, type });
    setTitle('');
    setUrl('');
    setDescription('');
    setType('resource');
  };

  return (
    <form className="resource-form" onSubmit={handleSubmit}>
      <div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title*" required maxLength={200} />
      </div>
      <div>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL (optional)" />
      </div>
      <div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={3} maxLength={1000} />
      </div>
      <div>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="resource">Resource</option>
          <option value="note">Note</option>
        </select>
        <button type="submit">Add</button>
      </div>
    </form>
  );
};

export default ResourceForm;
