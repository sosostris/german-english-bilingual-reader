import React from 'react';
import ProseTranslationSection from './ProseTranslationSection';
import DramaTranslationSection from './DramaTranslationSection';
import './TranslationSection.css';
import { TextStyling, TranslationResponse, SentenceLocator, TextMetadata } from '../types';

interface TranslationSectionProps {
  structuredTranslation?: TranslationResponse | null;
  currentPage: number;
  isTranslating: boolean;
  highlightedSentence?: SentenceLocator;
  onSentenceClick: (locator: SentenceLocator) => void;
  styling?: TextStyling; // Text styling options (font, size, etc.)
}

const TranslationSection: React.FC<TranslationSectionProps> = ({
  structuredTranslation,
  currentPage,
  isTranslating,
  highlightedSentence,
  onSentenceClick,
  styling = { fontFamily: 'Helvetica', fontSize: 20 },
}) => {
  // Render metadata (title, author, spacer) for first page if available
  const renderMetadata = () => {
    // Use translated metadata if available, otherwise fall back to original metadata
    const translatedMetadata = structuredTranslation?.metadata;
    
    if (currentPage !== 0 || !translatedMetadata) {
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
          {translatedMetadata.title}
        </div>
        <div
          className="text-author"
          style={{
            fontFamily: styling.fontFamily,
            fontSize: `${Math.floor(styling.fontSize * 1.1)}px`
          }}
        >
          {translatedMetadata.author}
        </div>
        <div className="text-spacer" style={{ height: '2em' }}></div>
      </div>
    );
  };

  // Common props to pass to child components
  const commonProps = {
    structuredTranslation,
    highlightedSentence,
    onSentenceClick,
    styling,
  };

  // Helper function to render the main translation content
  const renderTranslationContent = () => {
    // Check for loading state first, regardless of existing data
    if (isTranslating) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Translating ...</p>
        </div>
      );
    }

    if (!structuredTranslation) {
      return (
        <div className="empty-state">
          <p>Click "Translate" to see the English translation</p>
        </div>
      );
    }

    const validCommonProps = {
      ...commonProps,
      structuredTranslation, // This ensures non-null type
    };
    return structuredTranslation.metadata.genre === 'drama' ? (
      <DramaTranslationSection {...validCommonProps} />
    ) : (
      <ProseTranslationSection
        structuredTranslation={structuredTranslation}
        highlightedSentence={highlightedSentence}
        onSentenceClick={onSentenceClick}
        styling={styling}
      />
    );
  }

  return (
    <div className="translation-section">
      <div className="section-header">
        <div className="header-title">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            English Translation
          </h2>
        </div>
        <div className="header-actions">
              {/* Invisible placeholder buttons to maintain consistent header height */}
              <div className="placeholder-button"></div>
            </div>
      </div>
      <div className="text-content">
        {renderMetadata()}
        {renderTranslationContent()}
      </div>
    </div>
  );
};

export default TranslationSection;