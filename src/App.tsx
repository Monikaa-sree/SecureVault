import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import FileViewer from './components/FileViewer';
import type { User } from './types';
import { encryptData, decryptData } from './utils/encryption';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [secretKey, setSecretKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('vaultUser');
    const storedKey = localStorage.getItem('vaultKey');
    
    if (storedUser && storedKey) {
      try {
        const decryptedUser = JSON.parse(decryptData(storedUser, storedKey));
        setUser(decryptedUser);
        setSecretKey(storedKey);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Invalid stored credentials');
        localStorage.removeItem('vaultUser');
        localStorage.removeItem('vaultKey');
      }
    }
  }, []);

  const handleLogin = (userData: User, key: string) => {
    const encryptedUser = encryptData(JSON.stringify(userData), key);
    localStorage.setItem('vaultUser', encryptedUser);
    localStorage.setItem('vaultKey', key);
    localStorage.setItem('currentUserId', userData.id);
    setUser(userData);
    setSecretKey(key);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('vaultUser');
    localStorage.removeItem('vaultKey');
    localStorage.removeItem('currentUserId');
    setUser(null);
    setSecretKey('');
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="fixed inset-0 bg-gradient-to-br from-black via-purple-950/20 to-black pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10">
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Auth onLogin={handleLogin} />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? (
                  <Dashboard 
                    user={user} 
                    secretKey={secretKey}
                    onLogout={handleLogout}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/file/:fileId" 
              element={
                isAuthenticated ? (
                  <FileViewer secretKey={secretKey} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;