import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import ReactMarkdown from 'react-markdown';
import VoiceToText from '../components/voicetotext';
import './ChatPage.css';
import Topbar from '../components/top_bar';
import Sidebar from '../components/sidebar';

function ChatPage() {
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hello! I'm your AI Copilot. Ask me questions about PingFederate, get help, or receive step-by-step guidance." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();  

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message to chat
    const newMessages = [...messages, { type: 'user', text: userMessage }];
    setMessages(newMessages);

    try {
      // Prepare chat history for API (exclude the welcome message)
      const chatHistory = newMessages
        .slice(1) // Remove welcome message
        .map(msg => ({
          question: msg.type === 'user' ? msg.text : '',
          answer: msg.type === 'bot' ? msg.text : ''
        }))
        .filter(exchange => exchange.question || exchange.answer);

      const response = await fetch('http://localhost:8000/Agentchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          history: chatHistory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Add bot response to chat
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: result.response || 'Sorry, I couldn\'t generate a response.' 
      }]);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'Sorry, I encountered an error while processing your question. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-page">
      <Topbar />
      <Sidebar />
    <div className="chat-container">
      {/* <div className="chat-left" >
        <div className="avatar-full-rectangle" style={{ background: 'linear-gradient(to right, #2196f3, #4caf50)' }}> 
        </div>
        <div className="chat-icon-buttons">
          <VoiceToText onTranscript={text => setInputValue(text)}/>
        
        </div>
      </div>

      <div className="chat-right">
        <div className="chat-back-header" style={{alignItems: 'center'}}>
          <button
            className="chat-back-button"
            onClick={() => navigate('/services')}
            title="Back to Services"
          >
            &#8592;
          </button>
          <span className="chat-back-label" >PingFederate</span>
        </div>

        <div className="chat-header">
          <h2>AI-Copilot</h2>
          <p>Ask questions, get help, or receive step-by-step guidance here.</p>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble ${msg.type}`}>
              {msg.type === 'bot' ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble bot loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
export default ChatPage;