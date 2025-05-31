import React, { createContext, useState, useContext, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

const NewPasswordDialog = React.memo(({
  showNewPasswordDialog,
  setShowNewPasswordDialog,
  newPassword,
  setNewPassword,
  setProtectedRoute,
  setError,
  setIsAuthenticated,
}) => {
  const navigate = useNavigate();

  const handleNewPassword = useCallback(async () => {
    if (newPassword) {
      await window.api.forgetPassword(newPassword);
      setShowNewPasswordDialog(false);
      setNewPassword("");
      setError("Şifre başarıyla değiştirildi!");
      setProtectedRoute(null);
      setIsAuthenticated(true);
      navigate("/");
    } else {
      setError("Şifre boş olamaz!");
    }
  }, [newPassword, setShowNewPasswordDialog, setNewPassword, setError, setProtectedRoute, setIsAuthenticated, navigate]);

  return (
    <Dialog
      open={showNewPasswordDialog}
      onClose={() => setShowNewPasswordDialog(false)}
    >
      <DialogTitle>Yeni Şifre</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Yeni Şifre"
          type="password"
          fullWidth
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowNewPasswordDialog(false)}>İptal</Button>
        <Button onClick={handleNewPassword}>Kaydet</Button>
      </DialogActions>
    </Dialog>
  );
});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [protectedRoute, setProtectedRoute] = useState(null);
  const [adminPwd, setAdminPwd] = useState("");
  const [showNewPasswordDialog, setShowNewPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();

  const handleAuth = useCallback(async () => {
    try {
      const settings = await window.api.getSettings();
      if (password === settings.adminPassword) {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setError("");
        setPassword("");
      } else {
        setError("Yanlış şifre!");
      }
    } catch (error) {
      setError("Bir hata oluştu!");
    }
  }, [password]);

  const checkAuth = useCallback((route) => {
    if (!isAuthenticated) {
      setProtectedRoute(route);
      setShowAuthModal(true);
      return false;
    }
    return true;
  }, [isAuthenticated]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const handleCancel = useCallback(() => {
    setShowAuthModal(false);
    setPassword("");
    setError("");
    setProtectedRoute(null);
    navigate("/");
  }, [navigate]);

  const handleForgetPassword = useCallback(async () => {
    const dbAdminPwd = await window.api.getAdminPassword();
    if (adminPwd !== dbAdminPwd) {
      setError("Admin Şifresi Yanlış!");
      return;
    }
    setShowNewPasswordDialog(true);
  }, [adminPwd]);

  const contextValue = React.useMemo(() => ({
    setShowAuthModal,
    isAuthenticated,
    checkAuth,
    logout
  }), [setShowAuthModal, isAuthenticated, checkAuth, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <NewPasswordDialog
        setError={setError}
        setProtectedRoute={setProtectedRoute}
        showNewPasswordDialog={showNewPasswordDialog}
        setShowNewPasswordDialog={setShowNewPasswordDialog}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        setIsAuthenticated={setIsAuthenticated}
      />
      <Dialog
        open={showAuthModal}
        onClose={handleCancel}
        disableEscapeKeyDown={false}
      >
        <DialogTitle>Şifre Gerekli</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Şifre"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAuth()}
          />
        </DialogContent>
        <DialogActions>
          <TextField
            autoFocus
            margin="dense"
            label="Admin Şifresi"
            type="password"
            fullWidth
            value={adminPwd}
            onChange={(e) => setAdminPwd(e.target.value)}
          />
          <Button onClick={handleForgetPassword}>Şifremi Unuttum</Button>
          <Button onClick={handleCancel}>İptal</Button>
          <Button onClick={handleAuth} variant="contained">
            Giriş
          </Button>
        </DialogActions>
      </Dialog>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
