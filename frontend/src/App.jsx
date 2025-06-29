
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import Services from './pages/Services';
import './App.css';
import VoiceToTest from './pages/voicetotest';
import TTS from './pages/TTS';
import SettingsPage from './pages/SettingsPage';
import AvatarPage from './pages/avatartest';
import ChatPage from './pages/ChatPage';

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
          // path="/applications"
          path="/applications"
          element={
            role === 'user'
              ? <HomePage />
              : <Navigate to={role === 'admin' ? '/settings' : '/login'} />}
        />

        <Route
          // path="/pingfederate/*"
          path = "/services/*"
          element={isAuthenticated ? <Services /> : <Navigate to="/login" />}
        />

        <Route
          // path="/pingfederate/*"
          path = "/chatpage"
          element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />}
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
          path="/aiavatar"
          element={isAuthenticated ? <AvatarPage /> : <Navigate to="/login" />}
        />

        <Route
          path="/*"
          element={<Navigate to={isAuthenticated ? "/applications" : "/login"} />}
        />
        
        <Route
        path="/settings"
        element={
          role === 'admin'
            ? <SettingsPage />
            : <Navigate to={role === 'user' ? "/applications" : "/login"} />
        }
        />
      </Routes>
    </Router>
  );
}

export default App;
