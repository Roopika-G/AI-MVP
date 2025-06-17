import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './MainLayout.css';
import Sidebar from './components/sidebar.jsx';
import Topbar from './components/top_bar.jsx';

import { FaMicrophoneAlt } from "react-icons/fa";

function ApplicationsPage() {
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

      <main className="main-content">
        <div className="page-title-container">
          <h1 className="page-title">Applications</h1>
        </div>
        <section className="applications-section">
          <div className="cards-row">
            
            <div className="app-card" onClick={() => navigate('/pingfederate')} style={{ cursor: 'pointer' }}>
              <div className="card-title">PingFederate</div>
              <img src="/PF-Logo.png" alt="PingFederate" className="card-img" />
            </div>
            <div className="app-card">
              <div className="card-title">PingDirectory</div>
              <img src="/PD-Logo.jpeg" alt="PingDirectory" className="card-img" />
            </div>
            <div className="app-card" onClick={() => navigate('/voicetotext')} style={{ cursor: 'pointer' }}>
              <div className="card-title">Voicetotext test</div>
              <img src="/Mic-Logo.jpg" alt="PingDirectory" className="card-img" />
            </div>
          
          </div>
        </section>
      </main>
    </div>
  );
}

export default ApplicationsPage; 