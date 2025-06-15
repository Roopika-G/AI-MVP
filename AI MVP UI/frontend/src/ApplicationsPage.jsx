import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './MainLayout.css';

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
      <div className="top-header">
        <div className="header-logo">
          <img src="/Vega Logo.png" alt="Vega Logo" />
        </div>
        <div className="header-app-name">AI-Copilot</div>
        <div className="header-user-info">
          <div
            className="user-avatar user-avatar-circle"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ cursor: 'pointer' }}
            title="Click to logout"
          >
            {localStorage.getItem('username')?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="header-user-text">
            <div className="greeting">Hi there,</div>
            <div className="username">{localStorage.getItem('username') || 'User'}</div>
          </div>
          {showDropdown && (
            <div className="logout-dropdown" onClick={handleLogout}>
              Logout
            </div>
          )}
        </div>
      </div>
      <aside className="sidebar">
        <nav>
          <div className="sidebar-item active" onClick={() => navigate('/applications')} style={{ cursor: 'pointer' }}>
            <span>Applications</span>
          </div>
          <div className="sidebar-item" style={{ cursor: 'not-allowed', opacity: 0.6 }}>
            <span>IAM-GPT</span>
          </div>
          <div className="sidebar-item" style={{ cursor: 'not-allowed', opacity: 0.6 }}>
            <span>Settings</span>
          </div>
          <div className="sidebar-item" style={{ cursor: 'not-allowed', opacity: 0.6 }}>
            <span>Support</span>
          </div>
          <div className="sidebar-item" style={{ cursor: 'not-allowed', opacity: 0.6 }}>
            <span>Privacy</span>
          </div>
        </nav>
      </aside>
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
          </div>
        </section>
      </main>
    </div>
  );
}

export default ApplicationsPage; 