import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState([{ text: '', link: '' }]);
  const [info, setInfo] = useState('');
  const [hidden, setHidden] = useState(false);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('recent-updated');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [titleFilter, setTitleFilter] = useState('');
  const [tagFilter, setTagFilter] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [showOnlyHidden, setShowOnlyHidden] = useState(false);
  const [sources, setSources] = useState([{ url: '', type: 'web' }]);

  // GitHub config
  const repoConfig = {
    owner: process.env.NEXT_PUBLIC_GITHUB_OWNER,
    repo: process.env.NEXT_PUBLIC_GITHUB_REPO,
    path: process.env.NEXT_PUBLIC_GITHUB_FILE_PATH || 'data.json',
    branch: process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main',
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${repoConfig.path}`,
        {
          headers: {
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const content = JSON.parse(atob(response.data.content));
      setItems(content.items || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/tag.json`,
        {
          headers: {
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      const content = JSON.parse(atob(response.data.content));
      setAvailableTags(content);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      setAvailableTags(["daily", "WL", "retro", "testnet"]);
    }
  };

  const handleStepChange = (stepIndex, field, value) => {
    const updatedSteps = steps.map((step, idx) =>
      idx === stepIndex ? { ...step, [field]: value } : step
    );
    setSteps(updatedSteps);
  };

  const addStep = () => {
    setSteps([...steps, { text: '', link: '' }]);
  };

  const removeStep = (stepIndex) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, idx) => idx !== stepIndex));
  };

  const moveStepUp = (stepIndex) => {
    if (stepIndex <= 0) return;
    const newSteps = [...steps];
    [newSteps[stepIndex], newSteps[stepIndex - 1]] = [newSteps[stepIndex - 1], newSteps[stepIndex]];
    setSteps(newSteps);
  };

  const moveStepDown = (stepIndex) => {
    if (stepIndex >= steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[stepIndex], newSteps[stepIndex + 1]] = [newSteps[stepIndex + 1], newSteps[stepIndex]];
    setSteps(newSteps);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const toggleTagFilter = (tag) => {
    setTagFilter(prev =>
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // Add new functions for sources management:
const addSource = () => {
  setSources([...sources, { url: '', type: 'web' }]);
};

const removeSource = (index) => {
  if (sources.length <= 1) return;
  setSources(sources.filter((_, idx) => idx !== index));
};

const handleSourceChange = (index, field, value) => {
  const updatedSources = sources.map((source, idx) =>
    idx === index ? { ...source, [field]: value } : source
  );
  setSources(updatedSources);
};

  // Update the handleEdit function:
const handleEdit = (item) => {
  setEditingId(item.createdAt);
  setTitle(item.title);
  setSteps(item.steps.length > 0 ? item.steps : [{ text: '', link: '' }]);
  setInfo(item.info || '');
  setSelectedTags(item.tags || []);
  setHidden(item.hidden || false);
  setSources(item.sources?.length > 0 ? item.sources : [{ url: '', type: 'web' }]);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  // Update the cancelEdit function:
const cancelEdit = () => {
  setEditingId(null);
  setTitle('');
  setSteps([{ text: '', link: '' }]);
  setInfo('');
  setSelectedTags([]);
  setHidden(false);
  setSources([{ url: '', type: 'web' }]);
};

  const getFilteredItems = () => {
    let filteredItems = [...items];
    
    if (showOnlyHidden) {
      filteredItems = filteredItems.filter(item => item.hidden === true);
    } else if (!showHidden) {
      filteredItems = filteredItems.filter(item => item.hidden !== true);
    }
    
    if (titleFilter) {
      filteredItems = filteredItems.filter(item =>
        item.title.toLowerCase().includes(titleFilter.toLowerCase())
      );
    }
    
    if (tagFilter.length > 0) {
      filteredItems = filteredItems.filter(item =>
        item.tags && tagFilter.every(tag => item.tags.includes(tag))
      );
    }
    
    switch (filter) {
      case 'recent-updated':
        return filteredItems.sort((a, b) => 
          new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );
      case 'latest':
        return filteredItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return filteredItems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'a-z':
        return filteredItems.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return filteredItems.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return filteredItems;
    }
  };

  const toggleHideItem = async (item) => {
    setIsLoading(true);
    try {
      const currentFile = await axios.get(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${repoConfig.path}`,
        {
          headers: {
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const currentContent = JSON.parse(atob(currentFile.data.content)) || { items: [] };
      const newItems = currentContent.items.map((i) =>
        i.createdAt === item.createdAt 
          ? { ...i, hidden: !i.hidden, updatedAt: new Date().toISOString() }
          : i
      );

      const newContent = {
        ...currentContent,
        items: newItems,
      };

      await axios.put(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${repoConfig.path}`,
        {
          message: `${item.hidden ? 'Show' : 'Hide'} airdrop: ${item.title.substring(0, 20)}`,
          content: btoa(JSON.stringify(newContent, null, 2)),
          sha: currentFile.data.sha,
          branch: repoConfig.branch,
        },
        {
          headers: {
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
        }
      );

      await fetchData();
      setMessage(`✅ Airdrop ${item.hidden ? 'shown' : 'hidden'} successfully!`);
    } catch (error) {
      console.error('Toggle hide error:', error);
      setMessage(`❌ Failed to toggle: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage('❌ Title is required');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const currentFile = await axios.get(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${repoConfig.path}`,
        {
          headers: {
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const currentContent = JSON.parse(atob(currentFile.data.content)) || { items: [] };
      // Update the handleSubmit function (in the newItem object):
const newItem = {
  title,
  steps: steps.filter((step) => step.text.trim() !== ''),
  info,
  tags: selectedTags,
  sources: sources.filter(source => source.url.trim() !== ''),
  createdAt: editingId || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  hidden
};

      let newItems;
      if (editingId) {
        newItems = currentContent.items.map((item) =>
          item.createdAt === editingId ? newItem : item
        );
      } else {
        newItems = [...currentContent.items, newItem];
      }

      const newContent = {
        ...currentContent,
        items: newItems,
      };

      await axios.put(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${repoConfig.path}`,
        {
          message: `${editingId ? 'Update' : 'Add'} airdrop: ${title.substring(0, 20)}`,
          content: btoa(JSON.stringify(newContent, null, 2)),
          sha: currentFile.data.sha,
          branch: repoConfig.branch,
        },
        {
          headers: {
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
        }
      );

      cancelEdit();
      await fetchData();
      setMessage(`✅ Airdrop ${editingId ? 'updated' : 'added'} successfully!`);
    } catch (error) {
      console.error('Submission error:', error);
      setMessage(
        `❌ Failed to ${editingId ? 'update' : 'add'}: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (createdAt) => {
    if (!confirm('Are you sure you want to delete this airdrop?')) return;

    setIsLoading(true);
    try {
      const currentFile = await axios.get(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${repoConfig.path}`,
        {
          headers: {
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const currentContent = JSON.parse(atob(currentFile.data.content)) || { items: [] };
      const newItems = currentContent.items.filter((item) => item.createdAt !== createdAt);

      const newContent = {
        ...currentContent,
        items: newItems,
      };

      await axios.put(
        `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${repoConfig.path}`,
        {
          message: `Delete airdrop`,
          content: btoa(JSON.stringify(newContent, null, 2)),
          sha: currentFile.data.sha,
          branch: repoConfig.branch,
        },
        {
          headers: {
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
        }
      );

      await fetchData();
      setMessage('✅ Airdrop deleted successfully!');
    } catch (error) {
      console.error('Deletion error:', error);
      setMessage(`❌ Failed to delete: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTags();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>ABCDrop Administrator</h1>
      </header>

      <div className={styles.mainContent}>
        <div className={styles.editorSection}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2>{editingId ? 'Edit Airdrop' : 'Add New Airdrop'}</h2>
            
            <div className={styles.formGroup}>
              <label>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Airdrop title"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Steps</label>
              {steps.map((step, index) => (
                <div key={index} className={styles.stepRow}>
                  <div className={styles.stepControls}>
                    <button
                      type="button"
                      onClick={() => moveStepUp(index)}
                      disabled={index === 0}
                      className={styles.moveButton}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStepDown(index)}
                      disabled={index === steps.length - 1}
                      className={styles.moveButton}
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <input
                    type="text"
                    value={step.text}
                    onChange={(e) => handleStepChange(index, 'text', e.target.value)}
                    placeholder="Step description"
                    required
                  />
                  <input
                    type="url"
                    value={step.link}
                    onChange={(e) => handleStepChange(index, 'link', e.target.value)}
                    placeholder="Link (optional)"
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    disabled={steps.length <= 1}
                    className={styles.stepButton}
                  >
                    −
                  </button>
                  {index === steps.length - 1 && (
                    <button
                      type="button"
                      onClick={addStep}
                      className={styles.stepButton}
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.formGroup}>
              <label>Additional Info</label>
              
<textarea
  value={info}
  onChange={(e) => setInfo(e.target.value)}
  placeholder="Any additional information (use Shift+Enter for new lines)..."
  rows={3}
  style={{ whiteSpace: 'pre-wrap' }}
/>
            </div>

            <div className={styles.formGroup}>
              <label>Tags (Optional)</label>
              <div className={styles.tagsContainer}>
                {availableTags.map(tag => (
                  <label key={tag} className={styles.tagLabel}>
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                      className={styles.tagCheckbox}
                    />
                    <span className={styles.tagText}>{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            
<div className={styles.formGroup}>
  <label>Sources (Optional)</label>
  {sources.map((source, index) => (
    <div key={index} className={styles.sourceRow}>
      <select
        value={source.type}
        onChange={(e) => handleSourceChange(index, 'type', e.target.value)}
        className={styles.sourceTypeSelect}
      >
        <option value="web">Website</option>
        <option value="twitter">Twitter</option>
        <option value="telegram">Telegram</option>
        <option value="discord">Discord</option>
      </select>
      <input
        type="url"
        value={source.url}
        onChange={(e) => handleSourceChange(index, 'url', e.target.value)}
        placeholder="Source URL"
        className={styles.sourceInput}
      />
      <button
        type="button"
        onClick={() => removeSource(index)}
        disabled={sources.length <= 1}
        className={styles.sourceButton}
      >
        −
      </button>
      {index === sources.length - 1 && (
        <button
          type="button"
          onClick={addSource}
          className={styles.sourceButton}
        >
          +
        </button>
      )}
    </div>
  ))}
</div>

            <div className={styles.formGroup}>
              <label>Visibility *</label>
              <div className={styles.visibilityOptions}>
                <label className={styles.visibilityLabel}>
                  <input
                    type="radio"
                    name="visibility"
                    value="show"
                    checked={!hidden}
                    onChange={() => setHidden(false)}
                    className={styles.visibilityRadio}
                  />
                  <span>Show on public site</span>
                </label>
                <label className={styles.visibilityLabel}>
                  <input
                    type="radio"
                    name="visibility"
                    value="hide"
                    checked={hidden}
                    onChange={() => setHidden(true)}
                    className={styles.visibilityRadio}
                  />
                  <span>Hide from public site</span>
                </label>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : (editingId ? 'Update' : 'Add') + ' Airdrop'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {message && (
            <div
              className={
                message.startsWith('✅') ? styles.successMessage : styles.errorMessage
              }
            >
              {message}
            </div>
          )}
        </div>

        <div className={styles.displaySection}>
          <div className={styles.filterSection}>
            <div className={styles.filterGroup}>
              <label>Search: </label>
              <input
                type="text"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                placeholder="Filter by title..."
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label>Show only: </label>
              <div className={styles.tagFilterContainer}>
                {availableTags.map(tag => (
                  <label key={tag} className={styles.tagFilterLabel}>
                    <input
                      type="checkbox"
                      checked={tagFilter.includes(tag)}
                      onChange={() => toggleTagFilter(tag)}
                      className={styles.tagFilterCheckbox}
                    />
                    <span className={styles.tagFilterText}>{tag}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className={styles.filterGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={showOnlyHidden}
                  onChange={() => setShowOnlyHidden(!showOnlyHidden)}
                />
                Show only hidden
              </label>
            </div>
            
            <div className={styles.filterGroup}>
              <label>Sort by: </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="recent-updated">Latest updated</option>
                <option value="latest">New added</option>
                <option value="oldest">Oldest added</option>
                <option value="a-z">A-Z</option>
                <option value="z-a">Z-A</option>
              </select>
            </div>
          </div>

          <h2>Available Airdrops ({getFilteredItems().length})</h2>

          {isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : items.length > 0 ? (
            <div className={styles.itemsGrid}>
              {getFilteredItems().map((item, index) => (
                <div 
                  key={index} 
                  className={`${styles.itemCard} ${item.hidden ? styles.hiddenItem : ''}`}
                >
                  <div className={styles.itemHeader}>
                    <h3>{item.title}</h3>
                    <div className={styles.itemActions}>
                      <button
                        onClick={() => toggleHideItem(item)}
                        className={item.hidden ? styles.showButton : styles.hideButton}
                      >
                        {item.hidden ? 'Show' : 'Hide'}
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.createdAt)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {item.steps?.length > 0 && (
                    <div className={styles.stepsList}>
                      <h4>Steps:</h4>
                      <ol>
                        {item.steps.map((step, i) => (
                          <li key={i}>
                            {step.text}
                            {step.link && (
                              <a
                                href={step.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.stepLink}
                              >
                                (Link)
                              </a>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {item.info && (
                    <div className={styles.additionalInfo}>
                      <h4>Notes:</h4>
                      <p>{item.info}</p>
                    </div>
                  )}

                  {item.tags?.length > 0 && (
                    <div className={styles.itemTags}>
                      {item.tags.map(tag => (
                        <span key={tag} className={styles.tagPill}>{tag}</span>
                      ))}
                    </div>
                  )}

{item.sources?.length > 0 && (
  <div className={styles.itemSources}>
    {item.sources.map((source, i) => (
      <a 
        key={i} 
        href={source.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.sourceLink}
      >
        <img 
          src={`https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/${source.type === 'web' ? 'web' : source.type}_black.png`} 
          alt={source.type}
          className={styles.sourceIcon}
        />
      </a>
    ))}
  </div>
)}

<div className={styles.itemMeta}>
  <div className={styles.metaRow}>
    {item.updatedAt && (
      <small>Updated: {new Date(item.updatedAt).toLocaleDateString()}</small>
    )}
  </div>
  <div className={styles.metaRow}>
    <small>Added: {new Date(item.createdAt).toLocaleDateString()}</small>
  </div>
  {item.hidden && (
    <div className={styles.metaRow}>
      <small className={styles.hiddenBadge}>HIDDEN</small>
    </div>
  )}
</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No airdrops available yet</p>
              <p>Add your first airdrop using the form</p>
            </div>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
      <div className={styles.socialIcons}>
  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
    <img 
      src="https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/x_twitter.png" 
      alt="Twitter" 
      className={styles.socialIcon}
    />
  </a>
  <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">
    <img 
      src="https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/telegram.png" 
      alt="Telegram" 
      className={styles.socialIcon}
    />
  </a>
  <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
    <img 
      src="https://raw.githubusercontent.com/abcdrop/airdrop/main/Icon/discord.png" 
      alt="Discord" 
      className={styles.socialIcon}
    />
  </a>
</div>
        <p>© {new Date().getFullYear()} All rights reserved</p>
      </footer>
    </div>
  );
}