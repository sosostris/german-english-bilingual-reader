import React, { useState, useEffect } from 'react';
import './NavigationBar.css';
import { TextMetadata, LLMProvider } from '../types';
import { apiService } from '../services/apiService';

interface NavigationBarProps {
  currentPage: number;
  totalPages: number;
  selectedText: string;
  availableTexts: TextMetadata[];
  llmProvider?: string;
  isTranslating?: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onPageJump: (pageNumber: number) => void;
  onTextSelection: (textFile: string) => void;
  onLLMProviderChange?: (provider: LLMProvider) => void;
  // Font and color customization
  fontFamily?: string;
  fontSize?: number;
  onFontFamilyChange?: (fontFamily: string) => void;
  onFontSizeChange?: (fontSize: number) => void;
  // Voice selection
  selectedVoice?: string;
  onVoiceChange?: (voice: string) => void;
  isGPTAvailable?: boolean;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  currentPage,
  totalPages,
  selectedText,
  availableTexts,
  llmProvider,
  isTranslating = false,
  onNextPage,
  onPreviousPage,
  onPageJump,
  onTextSelection,
  onLLMProviderChange,
  fontFamily = 'Helvetica',
  fontSize = 20,
  onFontFamilyChange,
  onFontSizeChange,
  selectedVoice = 'fable',
  onVoiceChange,
  isGPTAvailable = false,
}) => {
  const getSelectedTextMetadata = () => {
    return availableTexts.find(text => text.name === selectedText);
  };

  const formatTextName = (textMetadata: TextMetadata) => {
    return textMetadata.title || textMetadata.name.replace('.txt', '').replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  // State for page jump input
  const [pageInput, setPageInput] = useState<string>('');

  // State for LLM providers
  const [availableProviders, setAvailableProviders] = useState<Record<string, any>>({});
  const [currentProvider, setCurrentProvider] = useState<any>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Auto-adjust voice selection when GPT availability changes
  useEffect(() => {
    if (!isGPTAvailable && selectedVoice !== 'browser') {
      console.log('🔊 GPT unavailable, switching to browser voice');
      onVoiceChange?.('browser');
    }
  }, [isGPTAvailable, selectedVoice, onVoiceChange]);

  // Handler for page jump
  const handlePageJump = () => {
    const pageNumber = parseInt(pageInput);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageJump(pageNumber - 1); // Convert to 0-based index
      setPageInput(''); // Clear input after successful jump
    }
  };

  // Handler for Enter key press
  const handlePageInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageJump();
    }
  };

  // Load available LLM providers on component mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        console.log('🔄 Loading LLM providers...');
        setLoadingProviders(true);
        const data = await apiService.getAvailableLLMProviders();
        console.log('✅ LLM providers loaded:', data);
        setAvailableProviders(data.available_providers);
        setCurrentProvider(data.current_provider);
        console.log('📋 Available providers state:', data.available_providers);
        console.log('🎯 Current provider state:', data.current_provider);
      } catch (error) {
        console.error('❌ Failed to load LLM providers:', error);
      } finally {
        setLoadingProviders(false);
        console.log('🏁 Loading finished');
      }
    };

    loadProviders();
  }, []);

  // Handler for LLM provider change
  const handleLLMProviderChange = async (provider: LLMProvider) => {
    try {
      setLoadingProviders(true);
      const result = await apiService.switchLLMProvider(provider);
      
      if (result.success && result.provider) {
        // Update current provider with the new provider info
        setCurrentProvider({
          provider: result.provider.provider,
          description: result.provider.description
        });
        onLLMProviderChange?.(provider);
        console.log(`✅ Switched to ${provider}:`, result.message);
      } else {
        console.error('Failed to switch provider:', result.error);
        alert(`Failed to switch to ${provider}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error switching provider:', error);
      alert(`Error switching to ${provider}. Please check if the provider is properly configured.`);
    } finally {
      setLoadingProviders(false);
    }
  };

  return (
    <nav className="navigation-bar">
      <div className="nav-left">
        <h1 className="app-title">
          <img src="/favicon.ico" alt="Logo" className="app-logo" />
          <div className="title-text">
            <span className="title-line-1">German-English</span>
            <span className="title-line-2">Bilingual Reader</span>
          </div>
        </h1>
        <div className="text-selector">
          <span className="current-book-title">
            {getSelectedTextMetadata() ? formatTextName(getSelectedTextMetadata()!) : 'Select a text'}
          </span>
          <select
            id="text-select"
            value={selectedText}
            onChange={(e) => onTextSelection(e.target.value)}
            className="text-select"
            title={isTranslating ? "Cannot switch text while translating" : "Switch to a different text"}
            disabled={isTranslating}
          >
            <option value="" disabled>Select a text to read</option>
            {availableTexts.map((text) => (
              <option key={text.name} value={text.name}>
                {formatTextName(text)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="nav-center">
        <div className="navigation-controls">
          <button
            onClick={onPreviousPage}
            disabled={currentPage === 0}
            className="nav-button prev-button icon-only"
            title="Previous Page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>
          
          <div className="page-info-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            Page {currentPage + 1} of {totalPages}
          </div>
          
          <div className="page-jump-controls">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyPress={handlePageInputKeyPress}
              placeholder="Go to"
              className="page-input"
              title={`Jump to page (1-${totalPages})`}
            />
            <button
              onClick={handlePageJump}
              disabled={!pageInput || parseInt(pageInput) < 1 || parseInt(pageInput) > totalPages}
              className="jump-button"
              title="Jump to page"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12,5 19,12 12,19"></polyline>
              </svg>
            </button>
          </div>
          
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages - 1}
            className="nav-button next-button icon-only"
            title="Next Page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="nav-right">
        <div className="customization-controls">
          <div className="font-controls">
            <label htmlFor="font-family">Font:</label>
            <select
              id="font-family"
              value={fontFamily}
              onChange={(e) => onFontFamilyChange?.(e.target.value)}
              className="font-select"
            >
              <optgroup label="📖 Reading Optimized">
                <option value="Helvetica">Helvetica</option>
                <option value="Helvetica Neue">Helvetica Neue</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Source Sans Pro">Source Sans Pro</option>
                <option value="Inter">Inter</option>
                <option value="Georgia">Georgia</option>
                <option value="Crimson Text">Crimson Text</option>
              </optgroup>
              <optgroup label="Sans Serif Fonts">
                <option value="Arial">Arial</option>
                <option value="Roboto">Roboto</option>
                <option value="Lato">Lato</option>
                <option value="system-ui">System UI</option>
                <option value="sans-serif">Sans Serif</option>
              </optgroup>
              <optgroup label="Serif Fonts">
                <option value="Times New Roman">Times New Roman</option>
                <option value="Merriweather">Merriweather</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="serif">Serif</option>
              </optgroup>
              <optgroup label="Monospace Fonts">
                <option value="Courier New">Courier New</option>
                <option value="Monaco, monospace">Monaco</option>
                <option value="Consolas, monospace">Consolas</option>
                <option value="'Lucida Console', monospace">Lucida Console</option>
              </optgroup>
            </select>
            
            <label htmlFor="font-size">Size:</label>
            <select
              id="font-size"
              value={fontSize}
              onChange={(e) => onFontSizeChange?.(parseInt(e.target.value))}
              className="font-size-select"
            >
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
              <option value="20">20px</option>
              <option value="22">22px</option>
              <option value="24">24px</option>
              <option value="26">26px</option>
              <option value="28">28px</option>
              <option value="30">30px</option>
            </select>
          </div>
          
        </div>
        
        <div className="llm-selector">
          <label htmlFor="llm-provider">AI Model:</label>
          <select
            id="llm-provider"
            value={currentProvider?.provider || ''}
            onChange={(e) => handleLLMProviderChange(e.target.value as LLMProvider)}
            disabled={loadingProviders}
            className="llm-select"
            title={currentProvider ? `Current: ${currentProvider.description}` : 'Select AI Model'}
          >
            {loadingProviders ? (
              <option value="" disabled>Loading AI models...</option>
            ) : Object.keys(availableProviders).length === 0 ? (
              <option value="" disabled>No AI models available</option>
            ) : (
              <>
                {!currentProvider && (
                  <option value="" disabled>Select AI Model</option>
                )}
                {Object.entries(availableProviders)
                  .filter(([_, providerData]) => providerData.available)
                  .map(([providerKey, providerData]) => {
                    // Use the actual model name from the description
                    const displayName = providerData.description;
                    return (
                      <option 
                        key={providerKey} 
                        value={providerKey}
                      >
                        {displayName}
                      </option>
                    );
                  })}
              </>
            )}
          </select>
          {loadingProviders && (
            <div className="loading-indicator" title="Switching AI model...">
              <div className="loading-spinner-nav"></div>
            </div>
          )}
        </div>

        <div className="voice-selector">
          <label htmlFor="voice-select">Voice:</label>
          <select
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => onVoiceChange?.(e.target.value)}
            className="voice-select"
          >
            {isGPTAvailable ? (
              <>
                <optgroup label="AI Voices (GPT)">
                  <option value="alloy">Alloy</option>
                  <option value="echo">Echo</option>
                  <option value="fable">Fable</option>
                  <option value="onyx">Onyx</option>
                  <option value="nova">Nova</option>
                  <option value="shimmer">Shimmer</option>
                </optgroup>
                <optgroup label="Browser Voice">
                  <option value="browser">Browser</option>
                </optgroup>
              </>
            ) : (
              <optgroup label="Browser Voice (GPT unavailable)">
                <option value="browser">Browser</option>
              </optgroup>
            )}
          </select>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
