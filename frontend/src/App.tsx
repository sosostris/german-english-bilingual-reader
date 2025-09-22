import React, { useState, useEffect } from 'react';
import './App.css';
import NavigationBar from './components/NavigationBar';
import OriginalTextSection from './components/OriginalTextSection';
import TranslationSection from './components/TranslationSection';
import ChatSection from './components/ChatSection';
import DictionarySection from './components/DictionarySection';
import { ChatMessage, TextMetadata, PageData, TranslationResponse, LLMProvider, SentenceLocator } from './types';
import { apiService } from './services/apiService';

function App() {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedTextFile, setSelectedTextFile] = useState<string>('');
  const [availableTexts, setAvailableTexts] = useState<TextMetadata[]>([]);
  const [translation, setTranslation] = useState<string>('');
  const [structuredTranslation, setStructuredTranslation] = useState<TranslationResponse | null>(null);
  const [currentMetadata, setCurrentMetadata] = useState<TextMetadata | null>(null);
  const [currentPageData, setCurrentPageData] = useState<PageData | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [llmProvider, setLlmProvider] = useState<string>('');
  const [highlightedGermanSentence, setHighlightedGermanSentence] = useState<SentenceLocator | undefined>(undefined);
  const [highlightedEnglishSentence, setHighlightedEnglishSentence] = useState<SentenceLocator | undefined>(undefined);
  const [highlightedSentenceText, setHighlightedSentenceText] = useState<string>('');
  
  // Customization state
  const [fontFamily, setFontFamily] = useState<string>('Helvetica');
  const [fontSize, setFontSize] = useState<number>(20);
  
  // TTS state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('fable');
  const [isGPTAvailable, setIsGPTAvailable] = useState<boolean>(false);
  
  // Translation cache: key = "textFile:pageNumber", value = complete translation data
  const [translationCache, setTranslationCache] = useState<Map<string, {
    translation: string;
    structuredTranslation: TranslationResponse | null;
  }>>(new Map());
  
  // Dictionary state
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [dictionaryDefinition, setDictionaryDefinition] = useState<string>('');
  const [isDictionaryLoading, setIsDictionaryLoading] = useState<boolean>(false);
  const [showDictionary, setShowDictionary] = useState<boolean>(false);

  // Check GPT availability for TTS on component mount
  useEffect(() => {
    const checkGPTAvailability = async () => {
      try {
        const data = await apiService.getAvailableLLMProviders();
        const openaiProvider = data.available_providers.openai;
        setIsGPTAvailable(openaiProvider?.available || false);
        console.log('🔊 GPT TTS availability:', openaiProvider?.available || false);
      } catch (error) {
        console.error('Failed to check GPT availability for TTS:', error);
        setIsGPTAvailable(false);
      }
    };

    checkGPTAvailability();
  }, []);

  // Load available texts on component mount
  useEffect(() => {
  // Add debug methods to window for development
  if (process.env.NODE_ENV === 'development') {
    (window as any).ttsStorage = {
      stats: async () => {
        console.log('TTS cache is now managed by backend file system');
        return { message: 'Backend file cache - check cache/ directory' };
      },
      clear: async () => {
        console.log('TTS cache clearing is now managed by backend file system');
      }
    };
  }

    const loadInitialData = async () => {
      try {
        const texts = await apiService.getAvailableTexts();
        setAvailableTexts(texts);
        
        // Don't auto-select any text - let user choose
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load current page when text or page changes
  useEffect(() => {
    if (selectedTextFile) {
      loadCurrentPage();
    }
  }, [selectedTextFile, currentPage]);

  // Apply dynamic styles based on user preferences
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply font family and size to text sections with higher specificity
    root.style.setProperty('--user-font-family', fontFamily);
    root.style.setProperty('--user-font-size', `${fontSize}px`);
    
    // Apply font family directly to text display elements for better override
    const applyFontStyles = () => {
      const textDisplays = document.querySelectorAll('.text-display, .translation-display');
      textDisplays.forEach((element) => {
        (element as HTMLElement).style.fontFamily = fontFamily;
        (element as HTMLElement).style.fontSize = `${fontSize}px`;
      });
    };
    
    // Apply immediately
    applyFontStyles();
    
    // Also apply after a short delay to catch dynamically loaded content
    setTimeout(applyFontStyles, 100);
    
  }, [fontFamily, fontSize]);

  // Apply font styles when text content changes
  useEffect(() => {
    const applyFontStyles = () => {
      const textDisplays = document.querySelectorAll('.text-display, .translation-display');
      textDisplays.forEach((element) => {
        (element as HTMLElement).style.fontFamily = fontFamily;
        (element as HTMLElement).style.fontSize = `${fontSize}px`;
      });
    };
    
    if (currentPageData || translation) {
      // Apply styles after content is rendered
      setTimeout(applyFontStyles, 50);
    }
  }, [currentPageData, translation, fontFamily, fontSize]);

  const loadCurrentPage = async () => {
    if (!selectedTextFile) return;

    try {
      const pageData = await apiService.getTextPage(selectedTextFile, currentPage);
      setTotalPages(pageData.total_pages);
      setCurrentMetadata(pageData.metadata);
      setCurrentPageData(pageData.page_data);
      
      // Check if we have a cached translation for this page
      const cacheKey = `${selectedTextFile}:${currentPage}`;
      const cachedData = translationCache.get(cacheKey);
      
      if (cachedData) {
        console.log('📋 Using cached translation for', cacheKey);
        setTranslation(cachedData.translation);
        setStructuredTranslation(cachedData.structuredTranslation);
      } else {
        setTranslation(''); // Clear previous translation
        setStructuredTranslation(null); // Clear structured translation
      }
      
      setHighlightedGermanSentence(undefined); // Clear highlighting when changing pages
      setHighlightedEnglishSentence(undefined);
      setHighlightedSentenceText('');
    } catch (error) {
      console.error('Failed to load page:', error);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageJump = (pageNumber: number) => {
    if (pageNumber >= 0 && pageNumber < totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleLLMProviderChange = (provider: LLMProvider) => {
    setLlmProvider(provider);
    console.log(`App: LLM provider changed to ${provider}`);
  };

  const handleTextSelection = (textFile: string) => {
    setSelectedTextFile(textFile);
    setCurrentPage(0);
    setChatMessages([]); // Clear chat when switching texts
    setHighlightedGermanSentence(undefined); // Clear highlighting when switching texts
    setHighlightedEnglishSentence(undefined);
    setHighlightedSentenceText('');
    // Clear translation state when switching books
    setTranslation('');
    setStructuredTranslation(null);
  };

  const handleGermanSentenceClick = (locator: SentenceLocator) => {
    // Set the German sentence highlight
    setHighlightedGermanSentence(locator);
    
    // Get the sentence text for TTS and other features
    if (currentPageData) {
      const paragraph = currentPageData.paragraphs[locator.paragraphIndex];
      if (paragraph && paragraph.sentences[locator.sentenceIndex]) {
        setHighlightedSentenceText(paragraph.sentences[locator.sentenceIndex].text);
      }
    }
    
    // Simple 1:1 correspondence - highlight the corresponding English sentence
    if (structuredTranslation) {
      setHighlightedEnglishSentence(locator);
    } else {
      // No translation available
      setHighlightedEnglishSentence(undefined);
    }
  };

  const handleEnglishSentenceClick = (locator: SentenceLocator) => {
    // Set the English sentence highlight
    setHighlightedEnglishSentence(locator);
    
    // Simple 1:1 correspondence - highlight the corresponding German sentence
    if (structuredTranslation && currentPageData) {
      const paragraph = currentPageData.paragraphs[locator.paragraphIndex];
      if (paragraph && paragraph.sentences[locator.sentenceIndex]) {
        setHighlightedGermanSentence(locator);
        setHighlightedSentenceText(paragraph.sentences[locator.sentenceIndex].text);
      }
    }
  };

  // TTS functions - speak only the highlighted sentence
  const handleSpeakHighlightedSentence = async () => {
    if (highlightedGermanSentence === undefined || !highlightedSentenceText || !currentPageData) return;
    
    try {
      setIsSpeaking(true);
      
      // Import enhanced TTS service dynamically
      const { enhancedTtsService } = await import('./services/enhancedTtsService');
      
      if (!enhancedTtsService.isSupported()) {
        alert('Text-to-speech is not supported. Please check your browser or internet connection.');
        return;
      }
      
      // Extract location information for backend caching
      const paragraph = currentPageData.paragraphs[highlightedGermanSentence.paragraphIndex];
      const sentence = paragraph?.sentences[highlightedGermanSentence.sentenceIndex];
      
      if (!paragraph || !sentence) {
        console.error('Cannot find sentence data for TTS');
        return;
      }

      const location = {
        textId: selectedTextFile,
        pageId: currentPageData.page_number.toString(),
        paragraphId: paragraph.paragraph_id.toString(),
        sentenceId: sentence.sentence_id.toString()
      };
      
      // Use the exact sentence text that was clicked
      console.log('🔊 Speaking sentence:', highlightedSentenceText);
      console.log('📍 TTS Location:', location);
      
      // Backend cache will handle optimization automatically
      
      await enhancedTtsService.speakSentence(highlightedSentenceText, location, {
        useGPT: isGPTAvailable, // Use GPT if available, browser otherwise
        speed: 0.9,   // Slightly slower for learning
        voice: selectedVoice // Use selected voice from dropdown
      });
    } catch (error) {
      console.error('TTS Error:', error);
      alert('Failed to speak sentence. Please try again.');
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleStopSpeaking = async () => {
    try {
      const { enhancedTtsService } = await import('./services/enhancedTtsService');
      enhancedTtsService.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Stop TTS Error:', error);
    }
  };

  const handleTranslate = async () => {
    console.log('🚀 Starting translation...');
    
    if (!currentPageData || isTranslating) {
      return;
    }

    const cacheKey = `${selectedTextFile}:${currentPage}`;
    console.log('🔑 Cache key:', cacheKey);
    
    // Always perform fresh translation (user explicitly clicked translate)
    console.log('🧹 Clearing previous state...');
    setIsTranslating(true);
    
    // Clear any existing translation before starting
    setTranslation('');
    setStructuredTranslation(null);
    setHighlightedGermanSentence(undefined);
    setHighlightedEnglishSentence(undefined);
    setHighlightedSentenceText('');
    
    try {
      // Use structured translation API (always available now)
      console.log('🏗️ Using structured translation API for', selectedTextFile);
      const translationResult = await apiService.translatePage(selectedTextFile, currentPage);
      
      console.log('🔍 UNIFIED TRANSLATION RESPONSE:', translationResult);
      
      // Handle the new structured response format from LLM services
      if (translationResult && translationResult.page_data) {
        const translationPageData = translationResult.page_data;
        
        // Create flattened translation for backwards compatibility with existing UI
        const translationParts = [];
        for (const paragraph of translationPageData.paragraphs) {
          for (const sentence of paragraph.sentences) {
            // Extract English translations from the new structure
            const englishTranslations = sentence.english_translation || [];
            translationParts.push(...englishTranslations);
          }
        }
        const flattenedTranslation = translationParts.join(' ');
        
        console.log('📝 Setting structured translation with page data');
        console.log('🏭 Provider:', translationResult.provider);
        
        setTranslation(flattenedTranslation);
        
        // Set structured translation using the new page_data format
        setStructuredTranslation({ 
          page_data: translationPageData, 
          provider: translationResult.provider,
          metadata: translationResult.metadata  // Include translated metadata
        });
        console.log('🎯 Set structured translation with new page_data format');
        
        // Cache the complete translation data
        setTranslationCache(prev => {
          const newCache = new Map(prev);
          const wasAlreadyCached = newCache.has(cacheKey);
          newCache.set(cacheKey, {
            translation: flattenedTranslation,
            structuredTranslation: { 
              page_data: translationPageData, 
              provider: translationResult.provider,
              metadata: translationResult.metadata
            }
          });
          console.log(`💾 ${wasAlreadyCached ? 'Updated' : 'Cached'} translation for`, cacheKey, `(${newCache.size} total cached)`);
          return newCache;
        });
        
        console.log('✅ Translation completed successfully with', translationResult.provider);
      } else {
        console.log('❌ No page_data found in translation response:', translationResult);
      }
      
    } catch (error) {
      console.error('❌ Translation failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status
      });
      setTranslation('Translation failed. Please try again.');
    } finally {
      console.log('🏁 Translation finished, setting isTranslating to false');
      setIsTranslating(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);

    try {
      // Convert structured data to text for chat context
      const contextText = currentPageData ? 
        currentPageData.paragraphs.map(p => 
          p.sentences.map(s => s.text).join(' ')
        ).join('\n\n') : '';
      const response = await apiService.sendChatMessage(message, contextText);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'assistant',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat failed:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // Dictionary functions
  const handleWordSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      setSelectedWord(selectedText);
      setShowDictionary(true);
      lookupWord(selectedText);
    }
  };

  const lookupWord = async (word: string) => {
    if (!word.trim()) return;
    
    setIsDictionaryLoading(true);
    setDictionaryDefinition('');
    
    try {
      // Get context from the current sentence if available
      // Use highlighted sentence or convert structured data for context
      const contextText = currentPageData ? 
        currentPageData.paragraphs.map(p => 
          p.sentences.map(s => s.text).join(' ')
        ).join('\n\n') : '';
      const context = highlightedSentenceText || contextText.substring(0, 200);
      const result = await apiService.dictionaryLookup(word, context);
      setDictionaryDefinition(result.definition);
    } catch (error) {
      console.error('Dictionary lookup failed:', error);
      setDictionaryDefinition('Dictionary lookup failed. Please try again.');
    } finally {
      setIsDictionaryLoading(false);
    }
  };

  const handleCloseDictionary = () => {
    setShowDictionary(false);
    setSelectedWord('');
    setDictionaryDefinition('');
    
    // Clear text selection
    const selection = window.getSelection();
    selection?.removeAllRanges();
  };

  // Add text selection event listeners - only for German text section
  // Monitor translation state changes
  // Track translation state for debugging
  useEffect(() => {
    if (translation) {
      console.log('✅ Translation loaded');
    }
  }, [translation]);


  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 0 && selection && selection.rangeCount > 0) {
        // Check if the selection is within the German text section
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const germanTextSection = document.querySelector('.original-text-section');
        const textContent = germanTextSection?.querySelector('.text-content');
        
        // Check if selection is within actual text content, not UI elements
        const isInTextContent = (textContent?.contains(container) || 
                               textContent?.contains(container.parentElement)) ||
                               // Fallback: check if it's in German section but not in headers/buttons
                               (germanTextSection?.contains(container) && 
                                !container.parentElement?.closest('.section-header'));
        
        // Additional check: exclude selections from buttons, headers, and other UI elements
        const isUIElement = container.parentElement?.closest('button') ||
                           container.parentElement?.closest('.section-header') ||
                           container.parentElement?.closest('.action-buttons') ||
                           container.parentElement?.closest('.inline-speaker-button');
        
        if (isInTextContent && !isUIElement) {
          // Debounce the selection to avoid too many API calls
          const timeoutId = setTimeout(() => {
            handleWordSelection();
          }, 500);
          
          return () => clearTimeout(timeoutId);
        }
      } else if (showDictionary && !selectedText) {
        // Auto-hide dictionary when selection is cleared (with delay)
        const timeoutId = setTimeout(() => {
          setShowDictionary(false);
        }, 2000);
        
        return () => clearTimeout(timeoutId);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [showDictionary]);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading German texts...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <NavigationBar
        currentPage={currentPage}
        totalPages={totalPages}
        selectedText={selectedTextFile}
        availableTexts={availableTexts}
        llmProvider={llmProvider}
        isTranslating={isTranslating}
        onNextPage={handleNextPage}
        onPreviousPage={handlePreviousPage}
        onPageJump={handlePageJump}
        onTextSelection={handleTextSelection}
        onLLMProviderChange={handleLLMProviderChange}
        fontFamily={fontFamily}
        fontSize={fontSize}
        onFontFamilyChange={setFontFamily}
        onFontSizeChange={setFontSize}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        isGPTAvailable={isGPTAvailable}
      />
      
      <div className="main-content">
        <div className="text-sections">
          <OriginalTextSection
            metadata={currentMetadata}
            pageData={currentPageData}
            currentPage={currentPage}
            onTranslate={handleTranslate}
            isTranslating={isTranslating}
            highlightedSentence={highlightedGermanSentence}
            onSentenceClick={handleGermanSentenceClick}
            styling={{ fontFamily, fontSize }}
            onSpeak={handleSpeakHighlightedSentence}
            onStopSpeaking={handleStopSpeaking}
            isSpeaking={isSpeaking}
          />
          <TranslationSection
            structuredTranslation={structuredTranslation}
            currentPage={currentPage}
            isTranslating={isTranslating}
            highlightedSentence={highlightedEnglishSentence}
            onSentenceClick={handleEnglishSentenceClick}
            styling={{ fontFamily, fontSize }}
          />
        </div>
        
        <div className="right-panel">
          <div className={`chat-wrapper ${showDictionary ? 'with-dictionary' : ''}`}>
            <ChatSection
              messages={chatMessages}
              onSendMessage={handleSendMessage}
            />
          </div>
          
          {showDictionary && (
            <DictionarySection
              selectedWord={selectedWord}
              definition={dictionaryDefinition}
              isLoading={isDictionaryLoading}
              onClose={handleCloseDictionary}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
