import { useNavigate } from "react-router-dom";
import { useState } from "react";
import './sidebarLayout.css'; 


function Sidebar() {
    const navigate = useNavigate();
    const [active, setActive] = useState('Applications');
    return (
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
    );
}

export default Sidebar