import React from 'react';
import './ProseTranslationSection.css';
import { SentenceLocator, TextStyling, TranslationResponse } from '../types';

interface ProseTranslationSectionProps {
  structuredTranslation: TranslationResponse;
  highlightedSentence?: SentenceLocator;
  onSentenceClick: (locator: SentenceLocator) => void;
  styling: TextStyling;
}

const ProseTranslationSection: React.FC<ProseTranslationSectionProps> = ({
  structuredTranslation,
  highlightedSentence,
  onSentenceClick,
  styling,
}) => {
  const { fontFamily, fontSize } = styling;

  const renderStructuredTranslation = () => {
    const pageData = structuredTranslation.page_data;

    const contentElements = pageData.paragraphs.map((paragraph: any, paragraphIndex: number) => {
      const paragraphSentences = paragraph.sentences.map((sentence: any, sentenceIndex: number) => {
        const locator: SentenceLocator = { paragraphIndex, sentenceIndex };
        const isHighlighted = highlightedSentence && 
          highlightedSentence.paragraphIndex === paragraphIndex && 
          highlightedSentence.sentenceIndex === sentenceIndex;
        
        // For prose, just join the english_translation array with spaces (no line break preservation)
        const displayText = sentence.english_translation 
          ? sentence.english_translation.join(' ')
          : sentence.text;

        return (
          <span
            key={`sentence-${paragraph.paragraph_id}-${sentence.sentence_id}`}
            className={`sentence ${isHighlighted ? 'highlighted' : ''}`}
            onClick={() => onSentenceClick(locator)}
            style={{ 
              cursor: 'pointer',
              fontFamily,
              fontSize: `${fontSize}px`
            }}
          >
            {displayText}
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
    
    return <div className="prose-content">{contentElements}</div>;
  };

  return (
    <>
      {renderStructuredTranslation()}
    </>
  );
};

export default ProseTranslationSection;
