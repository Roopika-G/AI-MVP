import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './top_bar.css'

function Topbar() {
  const [active, setActive] = useState('Applications');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const username = localStorage.getItem('username') || 'User';
  const avatarLetter = username ? username.charAt(0).toUpperCase() : 'U';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  return (
    <div>
      <div className="top-header">
        <div className="header-logo">
          <img src="/Vega Logo.png" alt="Vega Logo" />
        </div>
        <div className="header-app-name">IAM-Copilot</div>
        <div className="header-user-info">
          <div
            className="user-avatar user-avatar-circle"
            ref={avatarRef}
            onClick={() => setShowDropdown((prev) => !prev)}
            style={{ cursor: 'pointer', position: 'relative' }}
            tabIndex={0}
            title='Dropdown'
          >
            {avatarLetter}
            
          </div>
          <div className="header-user-text">
            <div className="greeting">Hi there,</div>
            <div className="username">{username}</div>
          </div>
          {showDropdown && (
            <div
              className="logout-dropdown"
              ref={dropdownRef}
              onClick={handleLogout}
              style={{ cursor: 'pointer' }}
            >
              Logout
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Topbar;