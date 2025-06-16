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
          path="/pingfederate"
          element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}
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
