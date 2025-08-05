// client/src/components/SearchBar.js
import React, { useState, useRef } from 'react';

const SearchBar = ({ onSearch }) => {
  const [searchText, setSearchText] = useState('');
  const recognitionRef = useRef(null);

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Web Speech API is not supported by this browser. Please use a modern browser like Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false; // Listen for a single utterance
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US'; // Default to English, consider dynamic language selection

    recognitionRef.current.onstart = () => {
      console.log('Voice recognition started...');
      // You can add UI feedback here (e.g., change button text, show mic icon)
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchText(transcript);
      onSearch(transcript); // Trigger search immediately
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      alert(`Speech recognition error: ${event.error}. Please try again.`);
      // Handle specific errors like 'no-speech', 'not-allowed'
    };

    recognitionRef.current.onend = () => {
      console.log('Voice recognition ended.');
      // Reset UI feedback
    };

    recognitionRef.current.start();
  };

  const handleInputChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      onSearch(searchText.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="input-group mb-3">
      <input
        type="text"
        className="form-control"
        placeholder="Search books by title, author, or keyword..."
        value={searchText}
        onChange={handleInputChange}
      />
      <button className="btn btn-outline-primary" type="submit">
        Search
      </button>
      <button className="btn btn-outline-secondary" type="button" onClick={startSpeechRecognition}>
        <i className="bi bi-mic"></i> Speak
      </button>
    </form>
  );
};

export default SearchBar;