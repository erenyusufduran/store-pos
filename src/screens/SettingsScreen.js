import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, TextField, Button, InputAdornment } from '@mui/material';
import { CircularProgress } from '@mui/material';
import { Snackbar } from '@mui/material';
import { Alert } from '@mui/material';

function SettingsScreen() {
  const [settings, setSettings] = useState({
    backstageMarginPercent: 0
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const savedSettings = await window.api.getSettings();
        setSettings(savedSettings || {
          backstageMarginPercent: 0
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