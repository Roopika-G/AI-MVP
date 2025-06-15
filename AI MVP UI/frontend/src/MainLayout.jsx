import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainLayout.css';

const sidebarItems = [
  { label: 'Home' },
  { label: 'Applications' },
  { label: 'IAM-GPT' },
  { label: 'Settings' },
  { label: 'Support' },
  { label: 'Privacy' },
];

function MainLayout() {
  const [active, setActive] = useState('Applications');
  const [showDropdown, setShowDropdown] = useState(false);
  const username = localStorage.getItem('username') || 'User';
  const avatarLetter = username ? username.charAt(0).toUpperCase() : 'U';
  const navigate = useNavigate();

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
            {avatarLetter}
          </div>
          <div className="header-user-text">
            <div className="greeting">Hi there,</div>
            <div className="username">{username}</div>
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
          {sidebarItems.map(item => (
            <div
              key={item.label}
              className={`sidebar-item${active === item.label ? ' active' : ''}`}
              onClick={() => setActive(item.label)}
            >
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <div className="page-title-container">
          <button className="back-arrow-btn" onClick={() => navigate('/applications')} title="Back to Applications">
            &#8592;
          </button>
          <h1 className="page-title">PingFederate</h1>
        </div>
        <section className="applications-section">
          <div className="cards-row">
            <div className="app-card">
              <div className="card-title">SP Connections</div>
              <img src="/SP-Connections.png" alt="SP Connections" className="card-img" />
            </div>
            <div className="app-card">
              <div className="card-title">OAuth Clients</div>
              <img src="/OAUTH.png" alt="OAuth Clients" className="card-img" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MainLayout; 