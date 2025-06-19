import React, { useState } from 'react';
import './MessageComposer.css';

interface MessageComposerProps {
  message: string;
  onChange: (message: string) => void;
  maxLength?: number;
  placeholder?: string;
  suggestions?: string[];
  showCharCount?: boolean;
  className?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  message,
  onChange,
  maxLength = 200,
  placeholder = 'Add a message (optional)',
  suggestions = [],
  showCharCount = true,
  className = ''
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const getCharCountColor = () => {
    const percentage = (message.length / maxLength) * 100;
    if (percentage >= 90) return '#ef4444'; // Red
    if (percentage >= 75) return '#f59e0b'; // Orange
    return '#6b7280'; // Gray
  };

  return (
    <div className={`message-composer ${className}`}>
      <div className="message-input-section">
        <label className="message-label">
          Message
          {!message && <span className="optional-text">(optional)</span>}
        </label>
        
        <div className="message-input-wrapper">
          <textarea
            className="message-textarea"
            value={message}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={3}
            onFocus={() => setShowSuggestions(suggestions.length > 0 && !message)}
          />
          
          {showCharCount && (
            <div 
              className="char-count"
              style={{ color: getCharCountColor() }}
            >
              {message.length}/{maxLength}
            </div>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions-section">
          <button
            type="button"
            className="suggestions-toggle"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            💡 Quick suggestions
            <span className={`toggle-icon ${showSuggestions ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          
          {showSuggestions && (
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {message && (
        <div className="message-preview">
          <div className="preview-label">Preview:</div>
          <div className="preview-content">"{message}"</div>
        </div>
      )}
    </div>
  );
};

export default MessageComposer;
