import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProducts } from '../contexts/ProductContext.js';

function InventoryScreen() {
  const { categories, getProductsByCategory, addProduct, updateProductStock, getProducts, updateProduct, deleteProduct } = useProducts();
  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ barcode: '', name: '', price: '', stock: '', category_id: '' });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const [filterBarcode, setFilterBarcode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterPrice, setFilterPrice] = useState('');

  // Add state for delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, productId: null, productName: '' });

  // Load all products on component mount
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        // Ensure getProducts is available and fetches all products
        if (getProducts) {
          const products = await getProducts();
          setAllProducts(products || []);
        } else {
          console.warn(
            'getProducts fonksiyonu ProductContext içinde mevcut değil. Tüm ürünleri yüklemek için lütfen bu fonksiyonu ekleyin.'
          );
          setAllProducts([]);
        }
      } catch (error) {
        console.error('Tüm ürünleri yüklerken hata:', error);
        setNotification({ open: true, message: 'Ürünler yüklenemedi', severity: 'error' });
        setAllProducts([]);
      }
    };

    loadAllProducts();
  }, [getProducts]);

  // Filter and update displayed products when allProducts, selectedCategory, or filters change
  useEffect(() => {
    let productsToDisplay = [...allProducts];

    if (selectedCategory) {
      productsToDisplay = productsToDisplay.filter((p) => p.category_id === selectedCategory);
    }

    if (filterBarcode) {
      productsToDisplay = productsToDisplay.filter((p) => p.barcode.toLowerCase().includes(filterBarcode.toLowerCase()));
    }
    if (filterName) {
      productsToDisplay = productsToDisplay.filter((p) => p.name.toLowerCase().includes(filterName.toLowerCase()));
    }
    if (filterPrice) {
      productsToDisplay = productsToDisplay.filter((p) => p.price.toString().includes(filterPrice));
    }

    setDisplayedProducts(productsToDisplay);
  }, [allProducts, selectedCategory, filterBarcode, filterName, filterPrice]);

  // Handle adding a new product
  const handleAddProduct = async () => {
    try {
      if (!newProduct.barcode || !newProduct.price) {
        setNotification({
          open: true,
          message: 'Barkod, isim ve fiyat gereklidir',
          severity: 'error'
        });
        return;
      }

      const result = await addProduct({
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
        category_id: newProduct.category_id || null
      });

      if (result === 'Bu barkod numarasına sahip bir ürün zaten mevcut.') {
        setNotification({
          open: true,
          message: 'Bu barkod numarasına sahip bir ürün zaten mevcut.',
          severity: 'error'
        });
      } else {
        setShowAddProduct(false);
        setNewProduct({ barcode: '', name: '', price: '', stock: '', category_id: '' });

        // Refresh all products list
        if (getProducts) {
          const updatedProducts = await getProducts();
          setAllProducts(updatedProducts || []);
        }

        setNotification({
          open: true,
          message: 'Ürün başarıyla eklendi',
          severity: 'success'
        });
      }
    } catch (error) {
      const message = error.message.includes('UNIQUE constraint failed')
        ? 'Bu barkod numarasına sahip bir ürün zaten mevcut.'
        : 'Ürün eklerken hata.';
      setNotification({
        open: true,
        message: message,
        severity: 'error'
      });
    }
  };

  // Handle updating product stock
  const handleUpdateStock = async (productId, newStock) => {
    try {
      await updateProductStock(productId, parseInt(newStock));

      // Refresh all products list
      if (getProducts) {
        const updatedProducts = await getProducts();
        setAllProducts(updatedProducts || []);
      }

      setNotification({
        open: true,
        message: 'Stok başarıyla güncellendi',
        severity: 'success'
      });
    } catch (error) {
      console.error('Stok güncellenirken hata:', error);
      setNotification({
        open: true,
        message: 'Stok güncellenemedi',
        severity: 'error'
      });
    }
  };

  // Handle updating a product's details (from Edit Product Dialog)
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const productDataToUpdate = {
        ...editingProduct,
        price: parseFloat(editingProduct.price),
        stock: parseInt(editingProduct.stock) || 0,
        category_id: editingProduct.category_id || null
      };

      await updateProduct(productDataToUpdate);

      setEditingProduct(null);
      // Refresh all products list
      if (getProducts) {
        const updatedProducts = await getProducts();
        setAllProducts(updatedProducts || []);
      }
      setNotification({ open: true, message: 'Ürün başarıyla güncellendi', severity: 'success' });
    } catch (error) {
      console.error('Ürün güncellenirken hata:', error);
      setNotification({ open: true, message: 'Ürün güncellenemedi', severity: 'error' });
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async () => {
    if (!deleteConfirmation.productId) return;

    try {
      const { stock } = await deleteProduct(deleteConfirmation.productId);

      // Close the confirmation dialog
      setDeleteConfirmation({ open: false, productId: null, productName: '' });

      if (stock == 0) {
        setNotification({
          open: true,
          message: 'Ürün satış geçmişi olduğu için silinemedi. Stok değeri 0 yapıldı.',
          severity: 'success'
        });
        const updatedProducts = allProducts.map((product) =>
          product.id === deleteConfirmation.productId ? { ...product, stock: 0 } : product
        );
        setAllProducts(updatedProducts);
        setDisplayedProducts((prevDisplayed) =>
          prevDisplayed.map((product) => (product.id === deleteConfirmation.productId ? { ...product, stock: 0 } : product))
        );
      } else {
        setNotification({
          open: true,
          message: 'Ürün başarıyla silindi',
          severity: 'success'
        });
        const updatedProducts = allProducts.filter((product) => product.id !== deleteConfirmation.productId);
        setAllProducts(updatedProducts);
        setDisplayedProducts((prevDisplayed) => prevDisplayed.filter((product) => product.id !== deleteConfirmation.productId));
      }
    } catch (error) {
      console.error('Ürün silinirken hata:', error);
      setNotification({
        open: true,
        message: 'Ürün silinemedi',
        severity: 'error'
      });
    }
  };

  // Get category name by id
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Yok';
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Bilinmiyor';
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Grid container spacing={2} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Products management */}
        <Grid item xs={12} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Ürünler</Typography>
              <Button variant="contained" color="primary" onClick={() => setShowAddProduct(true)}>
                Ürün Ekle
              </Button>
            </Box>

            {/* Filter Inputs */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Barkoda Göre Filtrele"
                  variant="outlined"
                  size="small"
                  value={filterBarcode}
                  onChange={(e) => setFilterBarcode(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="İsme Göre Filtrele"
                  variant="outlined"
                  size="small"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Fiyata Göre Filtrele"
                  variant="outlined"
                  size="small"
                  type="text"
                  value={filterPrice}
                  onChange={(e) => setFilterPrice(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="category-filter-label">Kategori</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    value={selectedCategory}
                    label="Kategori"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Tüm Kategoriler</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Barkod</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>İsim</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Fiyat</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Stok</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Kategori</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedProducts.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>{product.barcode}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>${product.price ? product.price.toFixed(2) : '0.00'}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          defaultValue={product.stock}
                          onBlur={(e) => {
                            const newStockValue = parseInt(e.target.value, 10);
                            if (!isNaN(newStockValue) && newStockValue !== product.stock) {
                              handleUpdateStock(product.id, newStockValue);
                            } else {
                              e.target.value = product.stock;
                            }
                          }}
                          inputProps={{ min: 0 }}
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell>{getCategoryName(product.category_id)}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => setEditingProduct({ ...product })} color="primary" size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() =>
                            setDeleteConfirmation({
                              open: true,
                              productId: product.id,
                              productName: product.name
                            })
                          }
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {displayedProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        {allProducts.length > 0
                          ? 'Mevcut filtrelerle eşleşen ürün bulunamadı.'
                          : 'Hiç ürün yok. Bazı ürünler eklemeyi deneyin!'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Add Product Dialog */}
        <Dialog open={showAddProduct} onClose={() => setShowAddProduct(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Yeni Ürün Ekle</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              label="Barkod"
              value={newProduct.barcode}
              onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
            />
            <TextField
              fullWidth
              margin="dense"
              label="İsim"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Fiyat"
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Başlangıç Stok"
              type="number"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Kategori</InputLabel>
              <Select
                value={newProduct.category_id}
                label="Kategori"
                onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
              >
                <MenuItem value="">
                  <em>Yok</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddProduct(false)}>İptal</Button>
            <Button onClick={handleAddProduct} color="primary">
              Ürün Ekle
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={Boolean(editingProduct)} onClose={() => setEditingProduct(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Ürünü Düzenle</DialogTitle>
          {editingProduct && (
            <>
              <DialogContent>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Barkod"
                  value={editingProduct.barcode}
                  onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="İsim"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="Fiyat"
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="Stok"
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    value={editingProduct.category_id || ''}
                    label="Kategori"
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>Yok</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEditingProduct(null)}>İptal</Button>
                <Button onClick={handleUpdateProduct} color="primary">
                  Değişiklikleri Kaydet
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Add Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmation.open} onClose={() => setDeleteConfirmation({ open: false, productId: null, productName: '' })}>
          <DialogTitle>Ürünü Sil</DialogTitle>
          <DialogContent>
            <Typography>"{deleteConfirmation.productName}" ürününü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmation({ open: false, productId: null, productName: '' })}>İptal</Button>
            <Button onClick={handleDeleteProduct} color="error">
              Sil
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
          <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Grid>
    </Box>
  );
}

export default InventoryScreen;

