import { useNavigate } from 'react-router-dom';
import './MainLayout.css';
import Sidebar from '../components/sidebar.jsx';
import Topbar from '../components/top_bar.jsx';

function ApplicationsPage() {
  const navigate = useNavigate();

  return (
    <div className="main-layout">
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
              <div className="card-title" >PingFederate</div>
              <img src="/PF-Logo.png" alt="PingFederate" className="card-img" />
            </div>
            
            <div className="app-card">
              <div className="card-title">Google Workspace</div>
              <img src="/Google_logo.png" alt="Google Workspace" className="card-img" />
            </div>

            <div className="app-card" onClick={() => navigate('/voicetotest')}>
              <div className="card-title">(VoicetoText Test)</div>
              <img src="/Salesforce_logo.svg" alt="VoicetoText" className="card-img" />
            </div>
            
            <div className="app-card" onClick={() => navigate('/tts')} >
              <div className="card-title">(Text to Speech Test)</div>
              <img src="/servicenow.png" alt="Text to Speech" className="card-img" />
            </div> 
            
            <div className="app-card" onClick={() => navigate('/aiavatar')}>
              <div className="card-title">AI Avatar Assistant</div>
              <img src="/slack.png" alt="Heygen" className="card-img" />
            </div>

          </div>
        </section>
      </main>

    </div>
  );
}

export default ApplicationsPage; 