import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainLayout.css';
import Sidebar from './components/sidebar';
import Topbar from './components/top_bar';

const sidebarItems = [
  { label: 'Applications' },
  { label: 'IAM-GPT' },
  { label: 'Settings' },
  { label: 'Support' },
  { label: 'Privacy' },
];

function MainLayout() {
  const [active, setActive] = useState('Applications');
  const navigate = useNavigate();
  return (
    <div className="main-layout full-screen">
      
      <Topbar />
      
      <Sidebar />

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