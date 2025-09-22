import React from 'react';
import ProseTextSection from './ProseTextSection';
import DramaTextSection from './DramaTextSection';
import './OriginalTextSection.css';
import { PageData, TextMetadata, TextStyling, SentenceLocator } from '../types';

interface OriginalTextSectionProps {
  metadata: TextMetadata | null; // Book metadata (title, author, genre, etc.) - required
  pageData: PageData | null; // Structured page data with normalized IDs (null when loading/unavailable)
  currentPage: number;
  onTranslate: () => void;
  isTranslating: boolean;
  highlightedSentence?: SentenceLocator;
  onSentenceClick: (locator: SentenceLocator) => void;
  styling?: TextStyling; // Text styling options (font, size, etc.)
  onSpeak: () => void;
  onStopSpeaking: () => void;
  isSpeaking?: boolean;
}

const OriginalTextSection: React.FC<OriginalTextSectionProps> = ({
  metadata,
  pageData,
  currentPage,
  onTranslate,
  isTranslating,
  highlightedSentence,
  onSentenceClick,
  styling = { fontFamily: 'Helvetica', fontSize: 20 },
  onSpeak,
  onStopSpeaking,
  isSpeaking = false,
}) => {
  // Helper function to render text with line breaks
  const renderTextWithLineBreaks = (text: string) => {
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Function to render metadata (title and author) on page 1
  const renderMetadata = () => {
    if (currentPage !== 0 || !metadata) {
      return null;
    }

    return (
      <div className="text-metadata">
        <div className="text-spacer" style={{ height: '2em' }}></div>
        <div 
          className="text-title" 
          style={{ 
            fontFamily: styling.fontFamily, 
            fontSize: `${Math.floor(styling.fontSize * 1.5)}px` 
          }}
        >
          {metadata.title}
        </div>
        <div 
          className="text-author" 
          style={{ 
            fontFamily: styling.fontFamily, 
            fontSize: `${Math.floor(styling.fontSize * 1.1)}px` 
          }}
        >
          {metadata.author}
        </div>
        <div className="text-spacer" style={{ height: '2em' }}></div>
      </div>
    );
  };

  const renderTextContent = () => {
    if (!pageData || !metadata) {
      return (
        <div className="text-content">
          <div className="empty-state">
            <p>Select a text from the dropdown above to start reading German literature.</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      pageData,
      currentPage,
      highlightedSentence,
      onSentenceClick,
      styling,
      onSpeak,
      onStopSpeaking,
      isSpeaking,
      renderTextWithLineBreaks
    };

    return (
      <div className="text-content">
          {renderMetadata()}
          {metadata.genre === 'drama' ? <DramaTextSection {...commonProps} /> : <ProseTextSection {...commonProps} />}
      </div>
    );
  };

  return (
    <div className="original-text-section">
      <div className="section-header">
        <div className="header-title">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            German Text
          </h2>
        </div>
        <div className="header-actions">
          <button
            className="translate-button"
            onClick={onTranslate}
            disabled={isTranslating || !pageData}
          >
            Translate
          </button>
        </div>
      </div>
      {renderTextContent()}
    </div>
  )
};

export default OriginalTextSection;