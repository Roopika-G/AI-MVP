import React, { useState, useRef, useEffect, useCallback } from 'react';
import './SettingsPage.css';

function SettingsPage() {
  // Upload state
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadStatusType, setUploadStatusType] = useState(''); // 'success', 'error', 'duplicate', 'processing'
  const [showNotification, setShowNotification] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [selectedDocxFile, setSelectedDocxFile] = useState(null);
  const [selectedPptFile, setSelectedPptFile] = useState(null);
  const notificationTimeoutRef = useRef(null);
  
  // Chat state
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hello! I'm your knowledge base assistant. Upload PDFs or provide website URLs to help me answer your questions better." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  // Function to manually dismiss notification
  const dismissNotification = () => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setShowNotification(false);
    setTimeout(() => {
      setUploadStatus('');
      setUploadStatusType('');
    }, 400);
  };

  // Function to show notification with auto-dismiss
  const showUploadNotification = useCallback((message, type) => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setUploadStatus(message);
    setUploadStatusType(type);
    setShowNotification(true);

    // Auto-dismiss after 12 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setShowNotification(false);
      // Clear the status after animation completes
      setTimeout(() => {
        setUploadStatus('');
        setUploadStatusType('');
      }, 400); // Match the CSS transition duration
    }, 12000);
  }, []);

  // Function to get status icon
  const getStatusIcon = (type) => {
    switch (type) {
      case 'success': return '🎉';
      case 'duplicate': return '⚠️';
      case 'error': return '❌';
      case 'processing': return '⏳';
      default: return '';
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);
  // Handle website processing
  const handleProcessWebsite = async () => {
    if (!websiteUrl.trim()) {
      showUploadNotification('Please enter a valid website URL', 'error');
      return;
    }

    showUploadNotification('Processing website...', 'processing');
    
    try {
      const formData = new FormData();
      formData.append('url', websiteUrl);

      const response = await fetch('http://localhost:8000/process/website', {
        method: 'POST',
        body: formData
      });      const result = await response.json();
        if (result.status === 'success') {
        showUploadNotification(`Website processed successfully! Doc ID: ${result.doc_id}`, 'success');
        setWebsiteUrl(''); // Clear the input
      } else if (result.status === 'duplicate') {
        showUploadNotification(`${result.message} (Doc ID: ${result.doc_id})`, 'duplicate');
        setWebsiteUrl(''); // Clear the input
      } else {
        showUploadNotification(`Error: ${result.message}`, 'error');
      }
    } catch (error) {
      showUploadNotification(`Error processing website: ${error.message}`, 'error');
    }  };
  // Handle PDF upload
  const handlePdfUpload = async () => {
    if (!selectedPdfFile) {
      showUploadNotification('Please select a PDF file first', 'error');
      return;
    }

    showUploadNotification('Uploading PDF...', 'processing');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedPdfFile);

      const response = await fetch('http://localhost:8000/upload/pdf', {
        method: 'POST',
        body: formData
      });      const result = await response.json();
        if (result.status === 'success') {
        showUploadNotification(`PDF uploaded successfully! Doc ID: ${result.doc_id}`, 'success');
        setSelectedPdfFile(null); // Clear selected file
      } else if (result.status === 'duplicate') {
        showUploadNotification(`${result.message} (Doc ID: ${result.doc_id})`, 'duplicate');
        setSelectedPdfFile(null); // Clear selected file
      } else {
        showUploadNotification(`Error: ${result.message}`, 'error');
      }
    } catch (error) {
      showUploadNotification(`Error uploading PDF: ${error.message}`, 'error');
    }  };
  // Handle DOCX upload
  const handleDocxUpload = async () => {
    if (!selectedDocxFile) {
      showUploadNotification('Please select a DOCX file first', 'error');
      return;
    }

    showUploadNotification('Uploading DOCX...', 'processing');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedDocxFile);

      const response = await fetch('http://localhost:8000/upload/docx', {
        method: 'POST',
        body: formData
      });      const result = await response.json();
        if (result.status === 'success') {
        showUploadNotification(`DOCX uploaded successfully! Doc ID: ${result.doc_id}`, 'success');
        setSelectedDocxFile(null); // Clear selected file
      } else if (result.status === 'duplicate') {
        showUploadNotification(`${result.message} (Doc ID: ${result.doc_id})`, 'duplicate');
        setSelectedDocxFile(null); // Clear selected file
      } else {
        showUploadNotification(`Error: ${result.message}`, 'error');      }
    } catch (error) {
      showUploadNotification(`Error uploading DOCX: ${error.message}`, 'error');
    }
  };
  // Handle PPT upload
  const handlePptUpload = async () => {
    if (!selectedPptFile) {
      showUploadNotification('Please select a PPT file first', 'error');
      return;
    }

    showUploadNotification('Uploading PPT...', 'processing');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedPptFile);

      const response = await fetch('http://localhost:8000/upload/ppt', {
        method: 'POST',
        body: formData
      });      const result = await response.json();
        if (result.status === 'success') {
        showUploadNotification(`PPT uploaded successfully! Doc ID: ${result.doc_id}`, 'success');
        setSelectedPptFile(null); // Clear selected file
      } else if (result.status === 'duplicate') {
        showUploadNotification(`${result.message} (Doc ID: ${result.doc_id})`, 'duplicate');
        setSelectedPptFile(null); // Clear selected file
      } else {
        showUploadNotification(`Error: ${result.message}`, 'error');
      }
    } catch (error) {
      showUploadNotification(`Error uploading PPT: ${error.message}`, 'error');
    }
  };return (
    <div className="settings-split-container">      {/* Left: Uploads */}
      <div className="settings-upload-panel">
        <h3>Upload Knowledge</h3>        {uploadStatus && (
          <div className={`upload-status ${uploadStatusType} ${showNotification ? 'show' : 'hide'}`}>
            <span className="status-icon">{getStatusIcon(uploadStatusType)}</span>
            {uploadStatus}
            <button 
              className="notification-close"
              onClick={dismissNotification}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
        <form>
          <div>
            <input 
              type="text" 
              placeholder="https://example.com" 
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
            <button type="button" onClick={handleProcessWebsite}>Process Website</button>
          </div>          <div>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setSelectedPdfFile(e.target.files[0])}
              style={{ display: 'none' }}
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" style={{ 
              display: 'block',
              padding: '0.875rem 1rem',
              border: '2px dashed #e2e8f0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              transition: 'all 0.3s ease'
            }}>
              {selectedPdfFile ? selectedPdfFile.name : 'Choose PDF file...'}
            </label>
            <button type="button" onClick={handlePdfUpload} disabled={!selectedPdfFile}>
              Upload PDF
            </button>
          </div>
          <div>
            <input 
              type="file" 
              accept=".docx" 
              onChange={(e) => setSelectedDocxFile(e.target.files[0])}
              style={{ display: 'none' }}
              id="docx-upload"
            />
            <label htmlFor="docx-upload" style={{ 
              display: 'block',
              padding: '0.875rem 1rem',
              border: '2px dashed #e2e8f0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              transition: 'all 0.3s ease'
            }}>
              {selectedDocxFile ? selectedDocxFile.name : 'Choose DOCX file...'}
            </label>
            <button type="button" onClick={handleDocxUpload} disabled={!selectedDocxFile}>
              Upload DOCX
            </button>          </div>
          <div>
            <input 
              type="file" 
              accept=".ppt,.pptx" 
              onChange={(e) => setSelectedPptFile(e.target.files[0])}
              style={{ display: 'none' }}
              id="ppt-upload"
            />
            <label htmlFor="ppt-upload" style={{ 
              display: 'block',
              padding: '0.875rem 1rem',
              border: '2px dashed #e2e8f0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              transition: 'all 0.3s ease'
            }}>
              {selectedPptFile ? selectedPptFile.name : 'Choose PPT file...'}
            </label>
            <button type="button" onClick={handlePptUpload} disabled={!selectedPptFile}>
              Upload PPT
            </button>
          </div>
        </form>
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