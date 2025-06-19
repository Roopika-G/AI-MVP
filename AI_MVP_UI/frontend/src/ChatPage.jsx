import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import VoiceToText from './components/voicetotext';
import './ChatPage.css';

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();  

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const userMsg = { type: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    const copy = inputValue;
    setInputValue('');
    setTimeout(() => {
      const botMsg = { type: 'bot', text: `Echo: ${copy}` };
      setMessages(prev => [...prev, botMsg]);
    }, 500);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-left">
        <div className="avatar-full-rectangle" />
        <div className="chat-icon-buttons">
          <VoiceToText onTranscript={text => setInputValue(text)}/>
        
        </div>
      </div>

      <div className="chat-right">
        {/* Back arrow */}
        <div className="chat-back-header">
          <button
            className="chat-back-button"
            onClick={() => navigate('/pingfederate')}
            title="Back to PingFederate"
          >
            &#8592;
          </button>
          <span className="chat-back-label">PingFederate</span>
        </div>

        <div className="chat-header">
          <h2>AI-Copilot</h2>
          <p>Ask questions, get help, or receive step-by-step guidance here.</p>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble ${msg.type}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;