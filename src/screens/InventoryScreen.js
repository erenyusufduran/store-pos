import React, { useState, useEffect } from "react";
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
  IconButton,
  TablePagination,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useProducts } from "../contexts/ProductContext.js";
import { useSupabase } from "../contexts/SupabaseContext.js";

function InventoryScreen() {
  const {
    categories,
    getProductsByCategory,
    addProduct,
    updateProductStock,
    getProducts,
    updateProduct,
    deleteProduct,
  } = useProducts();
  const { isOnline, fetchSupabaseData, syncSupabase } = useSupabase();
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    barcode: "",
    name: "",
    price: "",
    stock: "",
    category_id: "",
    purchase_price: "",
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [filterBarcode, setFilterBarcode] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterPrice, setFilterPrice] = useState("");
  const [filterPurchasePrice, setFilterPurchasePrice] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const rowsPerPage = 50;

  // Add state for delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    productId: null,
    productName: "",
  });

  // Load products with pagination and filters
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const filters = {
          category: selectedCategory,
          barcode: filterBarcode,
          name: filterName,
          price: filterPrice,
          purchasePrice: filterPurchasePrice,
        };

        const { products, total } = await getProducts({
          page: page,
          limit: rowsPerPage,
          filters: filters,
        });
        setDisplayedProducts(products);
        setTotalProducts(total);
      } catch (error) {
        console.error("Error loading products:", error);
        setNotification({
          open: true,
          message: "Ürünler yüklenemedi",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [
    page,
    selectedCategory,
    filterBarcode,
    filterName,
    filterPrice,
    filterPurchasePrice,
    getProducts
  ]);

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1); // MUI TablePagination is 0-based
  };

  // Handle adding a new product
  const handleAddProduct = async () => {
    try {
      if (!newProduct.barcode || !newProduct.price) {
        setNotification({
          open: true,
          message: "Barkod, isim ve fiyat gereklidir",
          severity: "error",
        });
        return;
      }

      const result = await addProduct({
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
        category_id: newProduct.category_id || null,
        purchase_price: parseFloat(newProduct.purchase_price) || 0,
      });

      if (result === "Bu barkod numarasına sahip bir ürün zaten mevcut.") {
        setNotification({
          open: true,
          message: "Bu barkod numarasına sahip bir ürün zaten mevcut.",
          severity: "error",
        });
      } else {
        setShowAddProduct(false);
        setNewProduct({
          barcode: "",
          name: "",
          price: "",
          stock: "",
          category_id: "",
          purchase_price: "",
        });

        // Refresh products list
        const { products, total } = await getProducts({
          page: page,
          limit: rowsPerPage,
          filters: {
            category: selectedCategory,
            barcode: filterBarcode,
            name: filterName,
            price: filterPrice,
            purchasePrice: filterPurchasePrice,
          },
        });
        setDisplayedProducts(products);
        setTotalProducts(total);

        setNotification({
          open: true,
          message: "Ürün başarıyla eklendi",
          severity: "success",
        });
      }
    } catch (error) {
      const message = error.message.includes("UNIQUE constraint failed")
        ? "Bu barkod numarasına sahip bir ürün zaten mevcut."
        : "Ürün eklerken hata.";
      setNotification({
        open: true,
        message: message,
        severity: "error",
      });
    }
  };

  // Handle updating product stock
  const handleUpdateStock = async (productId, newStock) => {
    try {
      await updateProductStock(productId, parseInt(newStock));

      // Refresh products list
      const { products, total } = await getProducts({
        page: page,
        limit: rowsPerPage,
        filters: {
          category: selectedCategory,
          barcode: filterBarcode,
          name: filterName,
          price: filterPrice,
          purchasePrice: filterPurchasePrice,
        },
      });
      setDisplayedProducts(products);
      setTotalProducts(total);

      setNotification({
        open: true,
        message: "Stok başarıyla güncellendi",
        severity: "success",
      });
    } catch (error) {
      console.error("Stok güncellenirken hata:", error);
      setNotification({
        open: true,
        message: "Stok güncellenemedi",
        severity: "error",
      });
    }
  };

  // Handle updating a product's details
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const productDataToUpdate = {
        ...editingProduct,
        price: parseFloat(editingProduct.price),
        stock: parseInt(editingProduct.stock) || 0,
        category_id: editingProduct.category_id || null,
        purchase_price: parseFloat(editingProduct.purchase_price) || 0,
      };

      await updateProduct(productDataToUpdate);

      setEditingProduct(null);
      
      // Refresh products list
      const { products, total } = await getProducts({
        page: page,
        limit: rowsPerPage,
        filters: {
          category: selectedCategory,
          barcode: filterBarcode,
          name: filterName,
          price: filterPrice,
          purchasePrice: filterPurchasePrice,
        },
      });
      setDisplayedProducts(products);
      setTotalProducts(total);

      setNotification({
        open: true,
        message: "Ürün başarıyla güncellendi",
        severity: "success",
      });
    } catch (error) {
      console.error("Ürün güncellenirken hata:", error);
      setNotification({
        open: true,
        message: "Ürün güncellenemedi",
        severity: "error",
      });
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async () => {
    if (!deleteConfirmation.productId) return;

    try {
      const { stock } = await deleteProduct(deleteConfirmation.productId);

      // Close the confirmation dialog
      setDeleteConfirmation({ open: false, productId: null, productName: "" });

      // Refresh products list
      const { products, total } = await getProducts({
        page: page,
        limit: rowsPerPage,
        filters: {
          category: selectedCategory,
          barcode: filterBarcode,
          name: filterName,
          price: filterPrice,
          purchasePrice: filterPurchasePrice,
        },
      });
      setDisplayedProducts(products);
      setTotalProducts(total);

      setNotification({
        open: true,
        message: stock === 0 
          ? "Ürün satış geçmişi olduğu için silinemedi. Stok değeri 0 yapıldı."
          : "Ürün başarıyla silindi",
        severity: "success",
      });
    } catch (error) {
      console.error("Ürün silinirken hata:", error);
      setNotification({
        open: true,
        message: "Ürün silinemedi",
        severity: "error",
      });
    }
  };

  const syncEverything = async () => {
    if (isOnline) {
      await syncSupabase();
      await fetchSupabaseData("categories", ["id", "name", "created_at"]);
      await fetchSupabaseData("products", ["id", "name", "barcode", "price", "stock", "category_id", "purchase_price"]);
    } else {
      setNotification({
        open: true,
        message: "İnternet bağlantısı yok",
        severity: "error",
      });
    }
  };

  // Get category name by id
  const getCategoryName = (categoryId) => {
    if (!categoryId) return "Yok";
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Bilinmiyor";
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 2 }}>
      <Grid container spacing={2} sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Products management */}
        <Grid item xs={12} sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Paper sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
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
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Alış Fiyatı"
                  variant="outlined"
                  size="small"
                  type="number"
                  value={filterPurchasePrice || ""}
                  onChange={(e) => setFilterPurchasePrice(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
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

            <TableContainer sx={{ flex: 1, overflow: "auto" }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Barkod</TableCell>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>İsim</TableCell>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Fiyat</TableCell>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Stok</TableCell>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Alış Fiyatı</TableCell>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Kategori</TableCell>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">Yükleniyor...</TableCell>
                    </TableRow>
                  ) : displayedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        {totalProducts > 0
                          ? "Mevcut filtrelerle eşleşen ürün bulunamadı."
                          : "Hiç ürün yok. Bazı ürünler eklemeyi deneyin!"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedProducts.map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell>{product.barcode}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.price ? product.price.toFixed(2) : "0.00"} ₺</TableCell>
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
                            sx={{ width: "80px" }}
                          />
                        </TableCell>
                        <TableCell>
                          {product.purchase_price ? product.purchase_price.toFixed(2) : "0.00"} ₺
                        </TableCell>
                        <TableCell>{getCategoryName(product.category_id)}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => setEditingProduct({ ...product })}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              setDeleteConfirmation({
                                open: true,
                                productId: product.id,
                                productName: product.name,
                              })
                            }
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalProducts}
              page={page - 1}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[50]}
            />
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
              onChange={(e) => setNewProduct((prev) => ({ ...prev, barcode: e.target.value }))}
            />
            <TextField
              fullWidth
              margin="dense"
              label="İsim"
              value={newProduct.name}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Fiyat"
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Başlangıç Stok"
              type="number"
              value={newProduct.stock}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Alış Fiyatı"
              type="number"
              value={newProduct.purchase_price || ""}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, purchase_price: e.target.value }))}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Kategori</InputLabel>
              <Select
                value={newProduct.category_id}
                label="Kategori"
                onChange={(e) => setNewProduct((prev) => ({ ...prev, category_id: e.target.value }))}
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
            <Button onClick={() => syncEverything()} color="primary">İşlemleri Senkronize Et</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog
          open={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Ürünü Düzenle</DialogTitle>
          {editingProduct && (
            <>
              <DialogContent>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Barkod"
                  value={editingProduct.barcode}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      barcode: e.target.value,
                    }))
                  }
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="İsim"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="Fiyat"
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="Stok"
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      stock: e.target.value,
                    }))
                  }
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="Alış Fiyatı"
                  type="number"
                  value={editingProduct.purchase_price || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      purchase_price: e.target.value,
                    }))
                  }
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    value={editingProduct.category_id || ""}
                    label="Kategori"
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        category_id: e.target.value,
                      }))
                    }
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmation.open}
          onClose={() =>
            setDeleteConfirmation({
              open: false,
              productId: null,
              productName: "",
            })
          }
        >
          <DialogTitle>Ürünü Sil</DialogTitle>
          <DialogContent>
            <Typography>
              "{deleteConfirmation.productName}" ürününü silmek istediğinizden
              emin misiniz? Bu işlem geri alınamaz.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setDeleteConfirmation({
                  open: false,
                  productId: null,
                  productName: "",
                })
              }
            >
              İptal
            </Button>
            <Button onClick={handleDeleteProduct} color="error">
              Sil
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            severity={notification.severity}
            onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Grid>
    </Box>
  );
}

export default InventoryScreen;
