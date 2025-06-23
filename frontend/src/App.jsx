import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import Login from './Login';
import MainLayout from './MainLayout';
import ApplicationsPage from './ApplicationsPage';
import './App.css';
import VoiceToTest from './pages/voicetotest';
import TTS from './pages/TTS';
import Heygen from './pages/heygen';

function App() {
  // For now, use localStorage for auth state (simple demo)
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/applications"
          element={isAuthenticated ? <ApplicationsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/pingfederate/*"
          element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}
        />
        <Route
          path="/voicetotest"
          element={isAuthenticated ? <VoiceToTest /> : <Navigate to="/login" />}
        />
        <Route
          path="/tts"
          element={isAuthenticated ? <TTS /> : <Navigate to="/login" />}
        />
        <Route
          path="/videoavatar"
          element={isAuthenticated ? <Heygen /> : <Navigate to="/login" />}
        />
        <Route
          path="/*"
          element={<Navigate to={isAuthenticated ? "/applications" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
