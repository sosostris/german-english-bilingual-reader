import React from 'react';
import { PageData, SentenceLocator, TextStyling } from '../types';
import './DramaTextSection.css';

interface DramaTextSectionProps {
  pageData: PageData; // Required structured page data with normalized IDs
  highlightedSentence?: SentenceLocator;
  onSentenceClick: (locator: SentenceLocator) => void;
  styling: TextStyling;
  onSpeak: () => void;
  onStopSpeaking: () => void;
  isSpeaking?: boolean;
  renderTextWithLineBreaks: (text: string) => React.ReactNode;
}

const DramaTextSection: React.FC<DramaTextSectionProps> = ({
  pageData,
  highlightedSentence,
  onSentenceClick,
  styling,
  onSpeak,
  onStopSpeaking,
  isSpeaking,
  renderTextWithLineBreaks
}) => {
  // Render structured drama content using pageData with sentence types
  const renderStructuredDrama = () => {
    let globalSentenceIndex = 0;
    
    // Process all sentences from all paragraphs in order
    const allContent: React.ReactNode[] = [];
    
    pageData.paragraphs.forEach((paragraph, paragraphIndex) => {
      // Track if we need paragraph spacing
      let needsParagraphSpacing = false;
      
      paragraph.sentences.forEach((sentence, sentenceIndex) => {
        const locator: SentenceLocator = { paragraphIndex, sentenceIndex };
        const isHighlighted = highlightedSentence && 
          highlightedSentence.paragraphIndex === paragraphIndex && 
          highlightedSentence.sentenceIndex === sentenceIndex;
        globalSentenceIndex++;
        
        // Render different sentence types with appropriate styling
        let sentenceElement: React.ReactNode;
        
        if (sentence.type === 'stage_direction') {
          sentenceElement = (
            <div 
              key={`sentence-${paragraph.paragraph_id}-${sentence.sentence_id}`}
              className={`stage-direction ${isHighlighted ? 'highlighted' : ''}`}
              style={{ 
                cursor: 'pointer',
                fontFamily: styling.fontFamily,
                fontSize: `${styling.fontSize}px`
              }}
              onClick={() => onSentenceClick(locator)}
            >
              <em>{renderTextWithLineBreaks(sentence.text)}</em>
              {isHighlighted && (
                <button
                  className="inline-speak-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpeak && onSpeak();
                  }}
                  title={isSpeaking ? "Stop speaking" : "Speak this stage direction"}
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
            </div>
          );
        } else if (sentence.type === 'speaker_name') {
          sentenceElement = (
            <div 
              key={`sentence-${paragraph.paragraph_id}-${sentence.sentence_id}`}
              className={`speaker-name ${isHighlighted ? 'highlighted' : ''}`}
              style={{ 
                cursor: 'pointer',
                fontFamily: styling.fontFamily,
                fontSize: `${styling.fontSize}px`
              }}
              onClick={() => onSentenceClick(locator)}
            >
              <strong>{renderTextWithLineBreaks(sentence.text)}:</strong>
              {isHighlighted && (
                <button
                  className="inline-speak-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpeak && onSpeak();
                  }}
                  title={isSpeaking ? "Stop speaking" : "Speak this speaker name"}
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
            </div>
          );
        } else if (sentence.type === 'dialogue') {
          // For dialogue, add paragraph-level spacing if this is the first dialogue sentence in the paragraph
          if (!needsParagraphSpacing && sentenceIndex === 0) {
            needsParagraphSpacing = true;
          }
          
          sentenceElement = (
            <span
              key={`sentence-${paragraph.paragraph_id}-${sentence.sentence_id}`}
              className={`sentence dialogue ${isHighlighted ? 'highlighted' : ''}`}
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
            </span>
          );
        } else {
          // Default handling for other sentence types (narration, etc.)
          sentenceElement = (
            <span
              key={`sentence-${paragraph.paragraph_id}-${sentence.sentence_id}`}
              className={`sentence ${sentence.type} ${isHighlighted ? 'highlighted' : ''}`}
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
            </span>
          );
        }
        
        allContent.push(sentenceElement);
        
        // Add line break after sentence if it's dialogue in a multi-sentence paragraph
        if (sentence.type === 'dialogue' && sentenceIndex < paragraph.sentences.length - 1) {
          allContent.push(<span key={`break-${paragraph.paragraph_id}-${sentence.sentence_id}`}> </span>);
        }
      });
      
      // Add paragraph spacing after dialogue paragraphs
      if (needsParagraphSpacing) {
        allContent.push(<div key={`para-break-${paragraph.paragraph_id}`} className="paragraph-break" />);
      }
    });
    
    return <div className="drama-content">{allContent}</div>;
  };

  return renderStructuredDrama();
};

export default DramaTextSection;