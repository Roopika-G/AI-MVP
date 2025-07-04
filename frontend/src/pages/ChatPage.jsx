import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import ReactMarkdown from 'react-markdown';
import VoiceToText from '../components/voicetotext';
import Avatar from '../components/avatar'; // Import Avatar component
import './ChatPage.css';
import Topbar from '../components/top_bar';
import Sidebar from '../components/sidebar';

function ChatPage() {
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hello! I'm your AI Copilot. Ask me questions about PingFederate, get help, or receive step-by-step guidance." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const transcriptTimeoutRef = useRef(null); // Reference to store timeout ID
  const isTranscriptRef = useRef(false); // Track if input is from transcript
  const [isAvatarActive, setIsAvatarActive] = useState(true); // Control avatar session
  const [avatarTextToSpeak, setAvatarTextToSpeak] = useState(''); // Text for avatar to speak
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
      const botResponse = result.response || 'Sorry, I couldn\'t generate a response.';
      
      // Add bot response to chat
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: botResponse 
      }]);

      // Send the text to the avatar to speak - prepare it for speech
      setAvatarTextToSpeak(prepareTextForSpeech(botResponse));

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = 'Sorry, I encountered an error while processing your question. Please try again.';
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: errorMessage 
      }]);
      
      // Send the error message to the avatar to speak
      setAvatarTextToSpeak(prepareTextForSpeech(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  // Function specifically for handling voice transcript auto-send
  const handleVoiceTranscript = (text) => {
    // First set the input value
    setInputValue(text);
    
    // Then set a direct timeout to send the message after 2 seconds
    if (text && text.trim()) {
      // Clear any existing timeout first
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }
      
      console.log("Voice transcript received, will auto-send in 2 seconds:", text);
      
      // Store the text for later use in the timeout
      const transcriptText = text.trim();
      
      // Create new timeout to send the message
      transcriptTimeoutRef.current = setTimeout(() => {
        console.log("Auto-sending voice transcript message:", transcriptText);
        
        // Explicitly set the messages before sending
        const userMessage = transcriptText;
        setInputValue('');
        setIsLoading(true);

        // Add user message to chat
        const newMessages = [...messages, { type: 'user', text: userMessage }];
        setMessages(newMessages);
        
        // Make the API call directly here instead of using handleSendMessage
        fetch('http://localhost:8000/Agentchat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: userMessage,
            history: newMessages
              .slice(1)
              .map(msg => ({
                question: msg.type === 'user' ? msg.text : '',
                answer: msg.type === 'bot' ? msg.text : ''
              }))
              .filter(exchange => exchange.question || exchange.answer)
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(result => {
          const botResponse = result.response || 'Sorry, I couldn\'t generate a response.';
          
          // Add bot response to chat
          setMessages(prev => [...prev, { 
            type: 'bot', 
            text: botResponse 
          }]);
          
          // Send the text to the avatar to speak
          setAvatarTextToSpeak(prepareTextForSpeech(botResponse));
        })
        .catch(error => {
          console.error('Chat error:', error);
          const errorMessage = 'Sorry, I encountered an error while processing your question. Please try again.';
          
          setMessages(prev => [...prev, { 
            type: 'bot', 
            text: errorMessage 
          }]);
          
          setAvatarTextToSpeak(prepareTextForSpeech(errorMessage));
        })
        .finally(() => {
          setIsLoading(false);
          transcriptTimeoutRef.current = null;
        });
      }, 2000);
    }
  };

  // Function to prepare text for speech
  const prepareTextForSpeech = (text) => {
    // Remove code blocks that aren't suitable for speech
    let speechText = text.replace(/```[\s\S]*?```/g, 'I\'ve included some code in my response. Please check the chat for details.');
    
    // Remove markdown formatting that isn't suitable for speech
    speechText = speechText.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    speechText = speechText.replace(/\*(.*?)\*/g, '$1');     // Italic
    speechText = speechText.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Links
    
    // Convert bullet points to spoken sentences
    speechText = speechText.replace(/- (.*?)(?:\n|$)/g, '$1. ');
    
    // Limit length to avoid very long speeches
    if (speechText.length > 500) {
      speechText = speechText.substring(0, 500) + ". I've provided more details in the chat.";
    }
    
    return speechText;
  };

  // Effect to auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Effect to clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }
    };
  }, []);
  
  // Effect to manage avatar session lifecycle
  useEffect(() => {
    console.log('ChatPage: Activating avatar...');
    setIsAvatarActive(true);
    
    // Add a slight delay before speaking welcome message to allow avatar to initialize
    const timer = setTimeout(() => {
      setAvatarTextToSpeak("Hi there! I'm your AI Copilot. How can I assist you today?");
    }, 2000);
    
    return () => {
      console.log('ChatPage: Unmounting - deactivating avatar...');
      clearTimeout(timer);
      setIsAvatarActive(false);
      
      // Log after a short delay to confirm state change propagation
      setTimeout(() => {
        console.log('ChatPage: Avatar deactivation complete, session should be closing...');
      }, 100);
    };
  }, []);

  return (
    <div className="chat-page">
      <Topbar />
      <Sidebar />
    <div className="chat-container">
      <div className="chat-left" >
        <div className="avatar-full-rectangle">
          <Avatar 
            isActive={isAvatarActive}
            textToSpeak={avatarTextToSpeak}
          />
        </div>
        <div className="chat-icon-buttons">
          <VoiceToText onTranscript={handleVoiceTranscript}/>
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
            onChange={(e) => {
              // If user manually types, cancel any pending auto-send
              if (transcriptTimeoutRef.current) {
                console.log("User typing detected, canceling auto-send");
                clearTimeout(transcriptTimeoutRef.current);
                transcriptTimeoutRef.current = null;
              }
              
              // Update the input value
              setInputValue(e.target.value);
            }}
            onKeyDown={(e) => {
              // Also clear timeout on any key press
              if (transcriptTimeoutRef.current) {
                clearTimeout(transcriptTimeoutRef.current);
                transcriptTimeoutRef.current = null;
              }
              
              // Send message on Enter key
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
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
};
export default ChatPage;