
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
import SettingsPage from './SettingsPage';

function App() {
  // For now, use localStorage for auth state (simple demo)
  const role = localStorage.getItem('role');
  const isAuthenticated = !!localStorage.getItem('role');
  // Add these logs:
  console.log('App.jsx: role from localStorage:', role);
  console.log('App.jsx: isAuthenticated:', isAuthenticated);

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" element={<Login />} />
        <Route
          path="/applications"
          element={
            role === 'user'
              ? <ApplicationsPage />
              : <Navigate to={role === 'admin' ? '/settings' : '/login'} />}
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
        <Route
        path="/settings"
        element={
          role === 'admin'
            ? <MainLayout><SettingsPage /></MainLayout>
            : <Navigate to={role === 'user' ? "/applications" : "/login"} />
        }
        />
      </Routes>
    </Router>
  );
}

export default App;
