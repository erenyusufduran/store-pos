import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSales } from '../contexts/SalesContext.js';

// Sale Details Dialog Component
const SaleDetailsDialog = ({ open, onClose, sale }) => {
  if (!sale) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Satış Detayları #{sale.id}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Tarih: {new Date(sale.created_at).toLocaleString()}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Ödeme Yöntemi: {sale.payment_type === 'cash' ? 'Nakit' : 'Kart'}
          </Typography>
          <Typography variant="h6" gutterBottom>
            Toplam Tutar: ₺{sale.total_amount.toFixed(2)}
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          Ürünler
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ürün</TableCell>
                <TableCell>Barkod</TableCell>
                <TableCell align="right">Fiyat</TableCell>
                <TableCell align="right">Miktar</TableCell>
                <TableCell align="right">Ara Toplam</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.barcode}</TableCell>
                  <TableCell align="right">₺{item.price.toFixed(2)}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">₺{(item.price * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Confirmation Dialog Component
const ConfirmDeleteDialog = ({ open, onClose, onConfirm, saleId }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Satış Silme Onayı</DialogTitle>
      <DialogContent>
        <Typography>
          #{saleId} numaralı satışı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          İptal
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Sil
        </Button>
      </DialogActions>
    </Dialog>
  );
};

function ReportScreen() {
  const { getSalesByDate, getSalesByDateRange, getSaleDetails, deleteSale } = useSales();
  const [sales, setSales] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [cashSales, setCashSales] = useState(0);
  const [cardSales, setCardSales] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState(0); // 0 for single date, 1 for date range
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);

  const fetchSingleDateSales = async () => {
    const salesData = await getSalesByDate(selectedDate);
    processSalesData(salesData);
  };

  const fetchDateRangeSales = async () => {
    const salesData = await getSalesByDateRange(startDate, endDate);
    processSalesData(salesData);
  };

  const processSalesData = (salesData) => {
    setSales(salesData || []);
    
    // Calculate statistics
    const total = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);
    setTotalSales(total);
    
    // Count total items sold
    const items = salesData.reduce((count, sale) => count + sale.items_count, 0);
    setTotalItems(items);
    
    // Calculate payment method totals
    const cash = salesData
      .filter(sale => sale.payment_type === 'cash')
      .reduce((sum, sale) => sum + sale.total_amount, 0);
    setCashSales(cash);
    
    const card = salesData
      .filter(sale => sale.payment_type === 'card')
      .reduce((sum, sale) => sum + sale.total_amount, 0);
    setCardSales(card);
    
    // Set transaction count
    setTransactionCount(salesData.length);
  };

  useEffect(() => {
    if (viewMode === 0) {
      fetchSingleDateSales();
    } else {
      fetchDateRangeSales();
    }
  }, [selectedDate, startDate, endDate, viewMode]);

  const handleViewSaleDetails = async (saleId) => {
    const details = await getSaleDetails(saleId);
    if (details) {
      setSelectedSale(details);
      setDetailsOpen(true);
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedSale(null);
  };

  const handleTabChange = (event, newValue) => {
    setViewMode(newValue);
  };

  const handleDeleteSale = (saleId) => {
    setSaleToDelete(saleId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSale = async () => {
    if (saleToDelete) {
      const success = await deleteSale(saleToDelete);
      if (success) {
        // Refresh the sales data
        if (viewMode === 0) {
          fetchSingleDateSales();
        } else {
          fetchDateRangeSales();
        }
      }
    }
    setDeleteDialogOpen(false);
    setSaleToDelete(null);
  };

  const cancelDeleteSale = () => {
    setDeleteDialogOpen(false);
    setSaleToDelete(null);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Satış Raporu
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={viewMode} onChange={handleTabChange} centered>
          <Tab label="Tek Gün" />
          <Tab label="Tarih Aralığı" />
        </Tabs>
        
        <Box sx={{ p: 2 }}>
          {viewMode === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                label="Tarih Seç"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button 
                variant="outlined" 
                sx={{ ml: 2 }}
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              >
                Bugün
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                label="Başlangıç Tarihi"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{ mr: 2 }}
              />
              <TextField
                label="Bitiş Tarihi"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Button 
                variant="outlined" 
                sx={{ ml: 2 }}
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setStartDate(today);
                  setEndDate(today);
                }}
              >
                Bugün
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Toplam Satış
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon sx={{ mr: 1 }} />
                <Typography variant="h4">
                  ₺{totalSales.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Satılan Ürünler
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartIcon sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {totalItems}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ödeme Yöntemleri
              </Typography>
              <Box>
                <Typography variant="body1">Nakit: ₺{cashSales.toFixed(2)}</Typography>
                <Typography variant="body1">Kart: ₺{cardSales.toFixed(2)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                İşlemler
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ReceiptIcon sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {transactionCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Sales Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          İşlemler
        </Typography>
        
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Tarih & Saat</TableCell>
                <TableCell>Tutar</TableCell>
                <TableCell>Ödeme</TableCell>
                <TableCell>Ürün Sayısı</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id} hover>
                  <TableCell>
                    {new Date(sale.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>₺{sale.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={sale.payment_type === 'cash' ? 'Nakit' : 'Kart'} 
                      color={sale.payment_type === 'cash' ? 'success' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{sale.items_count}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleViewSaleDetails(sale.id)}
                      >
                        Detayları Gör
                      </Button>
                      <IconButton 
                        color="error" 
                        size="small"
                        onClick={() => handleDeleteSale(sale.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Bu dönem için satış bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Sale Details Dialog */}
      <SaleDetailsDialog 
        open={detailsOpen} 
        onClose={handleCloseDetails} 
        sale={selectedSale} 
      />
      
      {/* Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={cancelDeleteSale}
        onConfirm={confirmDeleteSale}
        saleId={saleToDelete}
      />
    </Box>
  );
}

export default ReportScreen; 