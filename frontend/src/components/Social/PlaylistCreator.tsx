import React, { useState } from 'react';
import styles from '../../styles/PlaylistCreator.module.css';

interface PlaylistCreatorProps {
  onPlaylistCreate: (playlist: {
    name: string;
    description: string;
    snippets: string[];
  }) => void;
  onClose?: () => void;
}

export const PlaylistCreator: React.FC<PlaylistCreatorProps> = ({
  onPlaylistCreate,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [snippets, setSnippets] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onPlaylistCreate({ name, description, snippets });
    if (onClose) onClose();
  };

  const handleAddSnippet = () => {
    // Placeholder for adding snippets from a list or feed
    // In a real implementation, this would open a modal or list to select snippets
    setSnippets([...snippets, `Snippet ${snippets.length + 1}`]);
  };

  const handleRemoveSnippet = (index: number) => {
    setSnippets(snippets.filter((_, i) => i !== index));
  };

  return (
    <div className="modal-overlay">
      <div className={`modal ${styles.container}`}>
        <div className={styles.header}>
          <h2>Create Playlist</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Playlist Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter playlist name"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your playlist (optional)"
            />
          </div>
          <div className={styles.snippetsSection}>
            <h3>Snippets</h3>
            <button
              type="button"
              onClick={handleAddSnippet}
              className={styles.addSnippetButton}
            >
              Add Snippet
            </button>
            <ul className={styles.snippetList}>
              {snippets.map((snippet, index) => (
                <li key={index} className={styles.snippetItem}>
                  {snippet}
                  <button
                    type="button"
                    onClick={() => handleRemoveSnippet(index)}
                    className={styles.removeSnippetButton}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {snippets.length === 0 && (
                <li className={styles.emptySnippetList}>
                  No snippets added yet.
                </li>
              )}
            </ul>
          </div>
          <div className={styles.formActions}>
            <button type="submit" disabled={!name.trim()}>
              Create Playlist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
