import React from 'react';
import './DictionarySection.css';

interface DictionarySectionProps {
  selectedWord: string;
  definition: string;
  isLoading: boolean;
  onClose: () => void;
}

const DictionarySection: React.FC<DictionarySectionProps> = ({
  selectedWord,
  definition,
  isLoading,
  onClose
}) => {
  return (
    <div className="dictionary-section">
      <div className="section-header">
        <div className="header-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            <path d="M8 7h8"></path>
            <path d="M8 11h8"></path>
            <path d="M8 15h5"></path>
          </svg>
          <h2>Dictionary</h2>
        </div>
        <div className="header-actions">
          <button 
            className="close-button"
            onClick={onClose}
            title="Close dictionary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="dictionary-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Looking up "{selectedWord}"...</p>
          </div>
        ) : definition ? (
          <div className="definition-display">
            <div className="word-title">"{selectedWord}"</div>
            <div 
              className="definition-content"
              dangerouslySetInnerHTML={{ 
                __html: definition.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') 
              }}
            />
          </div>
        ) : (
          <div className="empty-state">
            <p>Select a word or phrase to see its definition.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionarySection;
