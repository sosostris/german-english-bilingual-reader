import React from 'react';
import './DramaTranslationSection.css';
import { TextStyling, TranslationResponse, SentenceLocator } from '../types';

interface DramaTranslationSectionProps {
  structuredTranslation: TranslationResponse;
  highlightedSentence?: SentenceLocator;
  onSentenceClick: (locator: SentenceLocator) => void;
  styling: TextStyling;
}

const DramaTranslationSection: React.FC<DramaTranslationSectionProps> = ({
  structuredTranslation,
  highlightedSentence,
  onSentenceClick,
  styling,
}) => {
  const { fontFamily, fontSize } = styling;

  // Enhanced line break processing - render English elements with <br> when German has \n
  const handleEnglishTranslationWithLineBreaks = (germanText: string, englishTranslation: string[]): React.ReactNode => {
    // If German text has no line breaks, join English sentences with spaces (for prose)
    if (!germanText.includes('\n')) {
      return englishTranslation.join(' ');
    }

    // German has line breaks - each element in english_translation array represents a line
    // Render with <br> tags between lines and ensure proper capitalization
    const capitalizedLines = englishTranslation.map((line) => {
      if (!line) return line;
      const trimmed = line.trim();
      if (trimmed.length === 0) return line;
      
      const firstChar = trimmed.charAt(0);
      
      // Always capitalize first letter of each line if it's a letter
      if (firstChar && /[a-zA-Z]/.test(firstChar)) {
        const capitalizedLine = firstChar.toUpperCase() + trimmed.slice(1);
        return capitalizedLine;
      }
      
      return line.trim();
    });

    // Return React elements with <br> tags between lines
    return capitalizedLines.map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };


  const renderStructuredTranslation = () => {
    // Process all sentences from all paragraphs in order
    const allContent: React.ReactNode[] = [];
    
    structuredTranslation.page_data.paragraphs.forEach((paragraph: any, paragraphIndex: number) => {
      // Track if we need paragraph spacing
      let needsParagraphSpacing = false;
      
      paragraph.sentences.forEach((sentence: any, sentenceIndex: number) => {
        const locator: SentenceLocator = { paragraphIndex, sentenceIndex };
        const isHighlighted = highlightedSentence && 
          highlightedSentence.paragraphIndex === paragraphIndex && 
          highlightedSentence.sentenceIndex === sentenceIndex;
        
        // Use new line break processing function
        const displayText = sentence.english_translation && sentence.text 
          ? handleEnglishTranslationWithLineBreaks(sentence.text, sentence.english_translation)
          : sentence.text;
        
        // Render different sentence types with appropriate styling
        let sentenceElement: React.ReactNode;
        
        if (sentence.type === 'stage_direction') {
          sentenceElement = (
            <div 
              key={`sentence-${paragraph.paragraph_id}-${sentence.sentence_id}`}
              className={`stage-direction ${isHighlighted ? 'highlighted' : ''}`}
              style={{ 
                cursor: 'pointer',
                fontFamily,
                fontSize: `${fontSize}px`
              }}
              onClick={() => onSentenceClick(locator)}
            >
              <em>{displayText}</em>
            </div>
          );
        } else if (sentence.type === 'speaker_name') {
          sentenceElement = (
            <div 
              key={`sentence-${paragraph.paragraph_id}-${sentence.sentence_id}`}
              className={`speaker-name ${isHighlighted ? 'highlighted' : ''}`}
              style={{ 
                cursor: 'pointer',
                fontFamily,
                fontSize: `${fontSize}px`
              }}
              onClick={() => onSentenceClick(locator)}
            >
              <strong>{displayText}:</strong>
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
                fontFamily,
                fontSize: `${fontSize}px`
              }}
              onClick={() => onSentenceClick(locator)}
            >
              {displayText}
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
                fontFamily,
                fontSize: `${fontSize}px`
              }}
              onClick={() => onSentenceClick(locator)}
            >
              {displayText}
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

  return (
    <>
      {structuredTranslation ? renderStructuredTranslation() : null}
    </>
  );
};

export default DramaTranslationSection;