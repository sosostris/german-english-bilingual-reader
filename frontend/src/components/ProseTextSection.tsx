import React from 'react';
import './ProseTextSection.css';
import { PageData, SentenceLocator, TextStyling } from '../types';

interface ProseTextSectionProps {
  pageData: PageData; // Required structured page data with normalized IDs
  highlightedSentence?: SentenceLocator;
  onSentenceClick: (locator: SentenceLocator) => void;
  styling: TextStyling;
  onSpeak: () => void;
  onStopSpeaking: () => void;
  isSpeaking?: boolean;
  renderTextWithLineBreaks: (text: string) => React.ReactNode;
}

const ProseTextSection: React.FC<ProseTextSectionProps> = ({
  pageData,
  highlightedSentence,
  onSentenceClick,
  styling,
  onSpeak,
  onStopSpeaking,
  isSpeaking = false,
  renderTextWithLineBreaks
}) => {
  // Render structured prose content using normalized IDs
  const renderContent = () => {
    let globalSentenceIndex = 0;
    
    return pageData.paragraphs.map((paragraph, paragraphIndex) => {
      const paragraphSentences = paragraph.sentences.map((sentence, sentenceIndex) => {
        const locator: SentenceLocator = { paragraphIndex, sentenceIndex };
        const isHighlighted = highlightedSentence && 
          highlightedSentence.paragraphIndex === paragraphIndex && 
          highlightedSentence.sentenceIndex === sentenceIndex;
        globalSentenceIndex++;
        
        return (
          <span
            key={`sentence-${paragraph.paragraph_id}-${sentence.sentence_id}`}
            className={`sentence ${sentence.type || 'narration'} ${isHighlighted ? 'highlighted' : ''}`}
            style={{ 
              cursor: 'pointer',
              fontFamily: styling.fontFamily,
              fontSize: `${styling.fontSize}px`
            }}
            onClick={() => onSentenceClick(locator)}
          >
            {renderTextWithLineBreaks(sentence.text)}
            {onSpeak && isHighlighted && (
              <button
                className={`inline-speak-button ${isSpeaking ? 'speaking' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSpeaking) {
                    onStopSpeaking?.();
                  } else {
                    onSpeak();
                  }
                }}
                title={isSpeaking ? "Stop speaking" : "Speak this sentence"}
              >
                {isSpeaking ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.08"/>
                  </svg>
                )}
              </button>
            )}
            {' '}
          </span>
        );
      });
      
      return (
        <p key={`paragraph-${paragraph.paragraph_id}`} className="prose-paragraph">
          {paragraphSentences}
        </p>
      );
    });
  };

  return (
    <div className="prose-text-section">
      <div className="text-display">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProseTextSection;