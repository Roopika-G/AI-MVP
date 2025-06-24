import React, { useState, useRef } from 'react';
import './SettingsPage.css';

function SettingsPage() {
  // Upload state
  const [uploadStatus, setUploadStatus] = useState('');
  // Chat state
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hello! I'm your knowledge base assistant. Upload PDFs or provide website URLs to help me answer your questions better." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // ...upload and chat handlers here...

  return (
    <div className="settings-split-container">
      {/* Left: Uploads */}
      <div className="settings-upload-panel">
        <h3>Upload Knowledge</h3>
        <form>
          <div>
            {/* <label>Process Website</label> */}
            <input type="text" placeholder="https://example.com" />
            <button type="button">Process Website</button>
          </div>
          <div>
            {/* <label>Process PDF</label> */}
            <input type="file" accept=".pdf" />
            <button type="button">Upload PDF</button>
          </div>
          <div>
            {/* <label>Process DOCX</label> */}
            <input type="file" accept=".docx" />
            <button type="button">Upload DOCX</button>
          </div>
          <div>
            {/* <label>Process PPT</label> */}
            <input type="file" accept=".ppt,.pptx" />
            <button type="button">Upload PPT</button>
          </div>
        </form>
        {uploadStatus && <div className="upload-status">{uploadStatus}</div>}
      </div>

      {/* Right: Chat */}
      <div className="settings-chat-panel">
        <div className="chat-messages" ref={messagesEndRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.type}`}>{msg.text}</div>
          ))}
        </div>
        <form
          className="chat-input-form"
          onSubmit={e => {
            e.preventDefault();
            // handle chat send
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type your question..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;