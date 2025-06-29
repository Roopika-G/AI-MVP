import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './MainLayout.css';
import Sidebar from '../components/sidebar.jsx';
import Topbar from '../components/top_bar.jsx';
import ChatPage from './ChatPage.jsx';

function ApplicationsPage({ children }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  return (
    <div className="main-layout full-screen">
      <Topbar />

      <Sidebar />
      <main className={`main-content`}>
        <div className="page-title-container">
          <button className="back-arrow-btn" onClick={() => navigate('/applications')} title="Back to Applications">
                &#8592;
          </button>
          <h1 className="page-title">Services</h1>
        </div>        
        <section className="applications-section">
          <div className="cards-row">
            
            <div className="app-card" onClick={() => navigate('/chatpage')} style={{ cursor: 'pointer' }}>
              <div className="card-title">PingFederate</div>
              <img src="/PF-Logo.png" alt="PingFederate" className="card-img" />
            </div>
            
            <div className="app-card">
              <div className="card-title">PingDirectory</div>
              <img src="/PD-Logo.jpeg" alt="PingDirectory" className="card-img" />
            </div>

            <div className="app-card" onClick={() => navigate('/voicetotest')} style={{ cursor: 'pointer' }}>
              <div className="card-title">VoicetoText Test</div>
              <img src="/Mic-Logo.jpg" alt="VoicetoText" className="card-img" />
            </div>
            
            <div className="app-card" onClick={() => navigate('/tts')} style={{ cursor: 'pointer' }}>
              <div className="card-title">Text to Speech Test</div>
              <img src="/TTS-Logo.png" alt="Text to Speech" className="card-img" />
            </div> 
            
            <div className="app-card" onClick={() => navigate('/aiavatar')} style={{ cursor: 'pointer' }}>
              <div className="card-title">AI Avatar Assistant</div>
              <img src="/Heygen-Logo.png" alt="Heygen" className="card-img" />
            </div>

          </div>
        </section>
      </main>

    </div>
  );
}

export default ApplicationsPage; 