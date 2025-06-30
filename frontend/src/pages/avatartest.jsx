import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 

import Avatar from "../components/avatar";
function AvatarPage() {
    const navigate = useNavigate();
  return (
    <div style={{ overflow: 'auto'}}>
        <button
            className="chat-back-button"
            onClick={() => navigate('/services')}
            title="Back to Services">
            &#8592;
          </button>
      <h1>Avatar Test Page</h1>
      <div id="avatar-container">
        <Avatar/>
      </div>
    </div>
  );
}
export default AvatarPage;