import React, { createContext, useState, useContext, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [protectedRoute, setProtectedRoute] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if there's a password set
    const checkPassword = async () => {
      const settings = await window.api.getSettings();
      if (!settings.adminPassword) {
        // If no password is set, set a default one
        await window.api.saveSettings({ ...settings, adminPassword: 'admin123' });
      }
    };
    checkPassword();
  }, []);

  const handleAuth = async () => {
    try {
      const settings = await window.api.getSettings();
      if (password === settings.adminPassword) {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setError('');
        setPassword('');
      } else {
        setError('Yanlış şifre!');
      }
    } catch (error) {
      setError('Bir hata oluştu!');
    }
  };

  const checkAuth = (route) => {
    if (!isAuthenticated) {
      setProtectedRoute(route);
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const handleCancel = () => {
    // First close the modal and clear states
    setShowAuthModal(false);
    setPassword('');
    setError('');
    setProtectedRoute(null);
    
    // Use setTimeout to ensure state updates are processed before navigation
    setTimeout(() => {
      navigate('/');
    }, 0);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, checkAuth, logout }}>
      {children}
      <Dialog 
        open={showAuthModal} 
        onClose={handleCancel}
        disableEscapeKeyDown={false}
      >
        <DialogTitle>Şifre Gerekli</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label="Şifre"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>İptal</Button>
          <Button onClick={handleAuth} variant="contained">Giriş</Button>
        </DialogActions>
      </Dialog>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 