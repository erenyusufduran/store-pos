import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, TextField, Button, InputAdornment, Divider, Stack } from '@mui/material';
import { CircularProgress } from '@mui/material';
import { Snackbar } from '@mui/material';
import { Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function SettingsScreen() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    backstageMarginPercent: 0,
    adminPassword: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const savedSettings = await window.api.getSettings();
        setSettings(savedSettings || {
          backstageMarginPercent: 0,
          adminPassword: ''
        });
      } catch (error) {
        console.error('Ayarları yüklerken hata:', error);
        setNotification({
          open: true,
          message: 'Ayarlar yüklenemedi',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleCleanDatabase = async () => {
    await window.api.cleanDatabase();
    setNotification({
      open: true,
      message: 'Veritabanı temizlendi',
      severity: 'success'
    });
  };

  // Handle settings changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Save settings
  const handleSave = async () => {
    try {
      await window.api.saveSettings(settings);
      setNotification({
        open: true,
        message: 'Ayarlar başarıyla kaydedildi',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ayarları kaydederken hata:', error);
      setNotification({
        open: true,
        message: 'Ayarlar kaydedilemedi',
        severity: 'error'
      });
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setNotification({
        open: true,
        message: 'Şifreler eşleşmiyor!',
        severity: 'error'
      });
      return;
    }

    try {
      await window.api.saveSettings({
        ...settings,
        adminPassword: newPassword
      });
      setNewPassword('');
      setConfirmPassword('');
      setNotification({
        open: true,
        message: 'Şifre başarıyla değiştirildi',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Şifre değiştirilemedi',
        severity: 'error'
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
    setNotification({
      open: true,
      message: 'Başarıyla çıkış yapıldı',
      severity: 'success'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Backstage Ayarları
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Backstage Satış Yüzdesi (%)"
                  name="backstageMarginPercent"
                  type="number"
                  value={settings.backstageMarginPercent}
                  onChange={handleChange}
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button variant="contained" color="primary" onClick={handleSave}>
                Ayarları Kaydet
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Şifre Değiştir
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Yeni Şifre"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Şifre Tekrar"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  margin="normal"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Stack direction="row" spacing={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handlePasswordChange}
                  disabled={!newPassword || !confirmPassword}
                >
                  Şifreyi Değiştir
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={handleLogout}
                >
                  Çıkış Yap
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Veritabanı Temizle
          </Typography>
          <Button variant="contained" color="error" onClick={handleCleanDatabase}>
            Veritabanı Temizle
          </Button>
        </Paper>
      </Grid>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SettingsScreen; 