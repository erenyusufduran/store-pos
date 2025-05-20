import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, TextField, Button, InputAdornment } from '@mui/material';
import { CircularProgress } from '@mui/material';
import { Snackbar } from '@mui/material';
import { Alert } from '@mui/material';

function SettingsScreen() {
  const [settings, setSettings] = useState({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    taxRate: 0,
    receiptFooter: '',
    backupLocation: ''
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const savedSettings = await window.electron.invoke('get-settings');
        setSettings(savedSettings || {
          storeName: '',
          storeAddress: '',
          storePhone: '',
          taxRate: 0,
          receiptFooter: '',
          backupLocation: ''
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
      [name]: name === 'taxRate' ? parseFloat(value) : value
    }));
  };

  // Save settings
  const handleSave = async () => {
    try {
      await window.electron.invoke('save-settings', settings);
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

  // Handle backup location selection
  const handleSelectBackupLocation = async () => {
    try {
      const result = await window.electron.invoke('select-backup-location');
      if (result) {
        setSettings((prev) => ({
          ...prev,
          backupLocation: result
        }));
      }
    } catch (error) {
      console.error('Yedekleme konumu seçilirken hata:', error);
      setNotification({
        open: true,
        message: 'Yedekleme konumu seçilemedi',
        severity: 'error'
      });
    }
  };

  // Create backup
  const handleCreateBackup = async () => {
    try {
      if (!settings.backupLocation) {
        setNotification({
          open: true,
          message: 'Lütfen önce bir yedekleme konumu seçin',
          severity: 'warning'
        });
        return;
      }

      await window.electron.invoke('create-backup', settings.backupLocation);
      setNotification({
        open: true,
        message: 'Yedekleme başarıyla oluşturuldu',
        severity: 'success'
      });
    } catch (error) {
      console.error('Yedekleme oluşturulurken hata:', error);
      setNotification({
        open: true,
        message: 'Yedekleme oluşturulamadı',
        severity: 'error'
      });
    }
  };

  // Restore from backup
  const handleRestoreBackup = async () => {
    try {
      const confirmed = window.confirm(
        'Yedekten geri yükleme mevcut verilerin üzerine yazacaktır. Devam etmek istiyor musunuz?'
      );
      if (!confirmed) return;

      const backupFile = await window.electron.invoke('select-backup-file');
      if (!backupFile) return;

      await window.electron.invoke('restore-backup', backupFile);
      setNotification({
        open: true,
        message: 'Yedekten geri yükleme başarılı',
        severity: 'success'
      });
    } catch (error) {
      console.error('Yedekten geri yüklenirken hata:', error);
      setNotification({
        open: true,
        message: 'Yedekten geri yükleme başarısız',
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
              Mağaza Ayarları
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mağaza Adı"
                  name="storeName"
                  value={settings.storeName}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefon"
                  name="storePhone"
                  value={settings.storePhone}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Adres"
                  name="storeAddress"
                  value={settings.storeAddress}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vergi Oranı (%)"
                  name="taxRate"
                  type="number"
                  value={settings.taxRate}
                  onChange={handleChange}
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Fiş Altbilgisi"
                  name="receiptFooter"
                  value={settings.receiptFooter}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder="Teşekkür mesajı veya mağaza politikası"
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
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h5" gutterBottom>
              Yedekleme ve Geri Yükleme
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Yedekleme Konumu"
                  value={settings.backupLocation}
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button variant="outlined" onClick={handleSelectBackupLocation}>
                          Konum Seç
                        </Button>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCreateBackup}
                    disabled={!settings.backupLocation}
                  >
                    Yedekleme Oluştur
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={handleRestoreBackup}>
                    Yedekten Geri Yükle
                  </Button>
                </Box>
              </Grid>
            </Grid>
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