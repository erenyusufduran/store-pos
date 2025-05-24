import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Button,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CancelIcon from "@mui/icons-material/Cancel";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useProducts } from "../contexts/ProductContext.js";
import { useSales } from "../contexts/SalesContext.js";

// Main BarcodeScanner component
const BarcodeScanner = ({ onProductScanned }) => {
  const [barcode, setBarcode] = useState("");
  const inputRef = useRef(null);

  // Keep focus on the barcode input
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    focusInput();

    // Focus the input when window is clicked
    window.addEventListener("enter", focusInput);

    return () => {
      window.removeEventListener("enter", focusInput);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (barcode.trim() === "") return;

    await onProductScanned(barcode);
    setBarcode("");
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Ürün Tara
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Barkod"
          variant="outlined"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          autoFocus
          inputRef={inputRef}
        />
      </form>
    </Paper>
  );
};

// New Product Dialog
const NewProductDialog = ({
  open,
  onClose,
  onAddProduct,
  initialBarcode,
  categories: availableCategories,
}) => {
  const [product, setProduct] = useState({
    barcode: "",
    name: "",
    price: "",
    stock: 1,
    category_id: "",
  });

  useEffect(() => {
    if (open) {
      setProduct({
        barcode: initialBarcode || "",
        name: "",
        price: "",
        stock: 1,
        category_id: "",
      });
    }
  }, [open, initialBarcode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await onAddProduct({
        ...product,
        price: parseFloat(product.price) || 0,
        stock: parseInt(product.stock) || 0,
        category_id: product.category_id || null,
      });
      onClose();
    } catch (error) {
      console.error("Ürün eklenirken hata:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Yeni Ürün Ekle</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Barkod"
          type="text"
          fullWidth
          name="barcode"
          value={product.barcode}
          onChange={handleChange}
          disabled={Boolean(initialBarcode)}
        />
        <TextField
          margin="dense"
          label="Ürün Adı"
          type="text"
          fullWidth
          name="name"
          value={product.name}
          onChange={handleChange}
          autoFocus
        />
        <TextField
          margin="dense"
          label="Fiyat"
          type="number"
          fullWidth
          name="price"
          value={product.price}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          label="Başlangıç Stok"
          type="number"
          fullWidth
          name="stock"
          value={product.stock}
          onChange={handleChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel id="category-select-label">Kategori</InputLabel>
          <Select
            labelId="category-select-label"
            id="category-select"
            name="category_id"
            value={product.category_id}
            label="Kategori"
            onChange={handleChange}
          >
            <MenuItem value="">
              <em>Hiçbiri</em>
            </MenuItem>
            {availableCategories &&
              availableCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          İptal
        </Button>
        <Button onClick={handleSubmit} color="primary">
          Ürün Ekle
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// New CategoryDialog component
const CategoryDialog = ({ open, onClose, onAddCategory }) => {
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (open) {
      setCategoryName("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!categoryName.trim()) return;

    try {
      await onAddCategory(categoryName);
      onClose();
    } catch (error) {
      console.error("Kategori eklenirken hata:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Yeni Kategori Ekle</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Kategori Adı"
          type="text"
          fullWidth
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          disabled={!categoryName.trim()}
        >
          Kategori Ekle
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// POSScreen component
function POSScreen() {
  const {
    getProductByBarcode,
    popularProducts,
    categories,
    getProductsByCategory,
    addProduct,
    refreshPopularProducts,
    addCategory,
  } = useProducts();
  const {
    currentSale,
    addItemToSale,
    updateItemQuantity,
    removeItemFromSale,
    clearSale,
    completeSale,
    getTotalAmount,
  } = useSales();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProductBarcode, setNewProductBarcode] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [settings, setSettings] = useState({
    storeName: "",
    storeAddress: "",
    storePhone: "",
    taxRate: 0,
    receiptFooter: "",
    backupLocation: "",
    backstageMarginPercent: 0,
  });
  const [isBackstage, setIsBackstage] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await window.api.getSettings();
        setSettings(savedSettings || { backstageMarginPercent: 0 });
      } catch (error) {
        console.error("Ayarları yüklerken hata:", error);
      }
    };
    loadSettings();
  }, []);

  // Handle barcode scanning
  const handleProductScanned = async (barcode) => {
    const product = await getProductByBarcode(barcode);

    if (product) {
      const backstagePrice =
        product.price * (1 + settings.backstageMarginPercent / 100);
      addItemToSale({
        ...product,
        price: isBackstage ? backstagePrice : product.price,
      });
    } else {
      // Show dialog to add new product
      setNewProductBarcode(barcode);
      setShowAddDialog(true);
    }
  };

  // Load products when category is selected
  useEffect(() => {
    if (selectedCategory) {
      const loadCategoryProducts = async () => {
        const products = await getProductsByCategory(selectedCategory);
        setCategoryProducts(products);
      };

      loadCategoryProducts();
    } else {
      setCategoryProducts([]);
    }
  }, [selectedCategory, getProductsByCategory]);

  // Handle adding a new product
  const handleAddProduct = async (productData) => {
    try {
      const newProduct = await addProduct(productData);
      setShowAddDialog(false);
      setNewProductBarcode("");
      const backstagePrice =
        newProduct.price * (1 + settings.backstageMarginPercent / 100);
      addItemToSale({
        ...newProduct,
        price: isBackstage ? backstagePrice : newProduct.price,
      });
      await refreshPopularProducts();
      setNotification({
        open: true,
        message: "Ürün başarıyla eklendi",
        severity: "success",
      });
    } catch (error) {
      setNotification({
        open: true,
        message: "Ürün eklenemedi",
        severity: "error",
      });
    }
  };

  // Handle completing a sale
  const handleCompleteSale = async (paymentType) => {
    if (currentSale.length === 0) {
      setNotification({
        open: true,
        message: "Satışta hiç ürün yok",
        severity: "warning",
      });
      return;
    }

    const success = await completeSale(
      paymentType,
      isBackstage,
      settings.backstageMarginPercent
    );

    if (success) {
      setNotification({
        open: true,
        message: `Satış ${
          paymentType === "cash" ? "nakit" : "kart"
        } ile tamamlandı`,
        severity: "success",
      });
      await refreshPopularProducts();
    } else {
      setNotification({
        open: true,
        message: "Satış tamamlanamadı",
        severity: "error",
      });
    }
  };

  // Handle adding a new category
  const handleAddCategory = async (categoryName) => {
    if (!categoryName || categoryName.trim() === "") {
      setNotification({
        open: true,
        message: "Kategori adı boş olamaz",
        severity: "error",
      });
      return;
    }

    try {
      await addCategory(categoryName);
      setNotification({
        open: true,
        message: "Kategori başarıyla eklendi",
        severity: "success",
      });
    } catch (error) {
      console.error("Kategori eklenirken hata:", error);
      setNotification({
        open: true,
        message: "Kategori eklenemedi: " + (error.message || "Bilinmeyen hata"),
        severity: "error",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]:
        name === "taxRate" || name === "backstageMarginPercent"
          ? parseFloat(value)
          : value,
    }));
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Grid
        container
        spacing={2}
        sx={{ flexGrow: 1, height: "calc(100vh - 16px)" }}
      >
        {/* Left panel: POS functionality */}
        <Grid item xs={6} sx={{ height: "100%", p: 2 }}>
          <Box
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Ürün Tara
              </Typography>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const barcodeInput = e.target.elements.barcode;
                  if (barcodeInput && barcodeInput.value) {
                    handleProductScanned(barcodeInput.value);
                    barcodeInput.value = "";
                  }
                }}
              >
                <TextField
                  fullWidth
                  name="barcode"
                  label="Barkod"
                  variant="outlined"
                  autoFocus
                />
              </form>
            </Paper>

            <Paper
              sx={{
                p: 2,
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Mevcut Satış
              </Typography>

              {currentSale.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexGrow: 1,
                  }}
                >
                  <Typography variant="body1" align="center">
                    Henüz ürün eklenmedi. Ürünleri tarayın veya kategorilerden
                    seçin.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ flexGrow: 1, overflow: "auto" }}>
                  {currentSale.map((item) => (
                    <React.Fragment key={item.id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <IconButton
                              edge="end"
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity - 1)
                              }
                            >
                              <RemoveIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity + 1)
                              }
                            >
                              <AddIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              onClick={() => removeItemFromSale(item.id)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={item.name}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                {item.price} ₺ × {item.quantity} ={" "}
                                {(item.price * item.quantity).toFixed(2)} ₺
                              </Typography>
                              <br />
                              <Typography
                                variant="caption"
                                component="span"
                                color="textSecondary"
                              >
                                Barkod: {item.barcode}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}

              {currentSale.length > 0 && (
                <Box sx={{ mb: 20 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackstage}
                          onChange={(e) => setIsBackstage(e.target.checked)}
                        />
                      }
                      label="Backstage Satış"
                    />
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    Toplam: {getTotalAmount().toFixed(2)} ₺
                  </Typography>
                  {isBackstage && (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Backstage Fiyatı:{" "}
                      {(
                        getTotalAmount() *
                        (1 + settings.backstageMarginPercent / 100)
                      ).toFixed(2)}{" "}
                      ₺
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 2,
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={clearSale}
                    >
                      Temizle
                    </Button>
                    <Box sx={{ display: "flex" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        sx={{ mr: 1 }}
                        onClick={() => handleCompleteSale("cash")}
                      >
                        Nakit Ödeme
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleCompleteSale("card")}
                      >
                        Kart Ödeme
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        </Grid>

        {/* Right panel: Categories and products */}
        <Grid item xs={6} sx={{ height: "100%", p: 2 }}>
          <Box
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            {/* Categories at the top */}
            <Paper sx={{ p: 2, mb: 2, width: "800px", height: "120px" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="h6">Kategoriler</Typography>
                <IconButton
                  color="primary"
                  onClick={() => setShowCategoryDialog(true)}
                  size="small"
                  title="Yeni kategori ekle"
                >
                  <AddCircleOutlineIcon />
                </IconButton>
              </Box>
              <Box
                sx={{
                  width: "100%",
                  overflowX: "auto",
                  overflowY: "hidden",
                  display: "flex",
                  pb: 1,
                  "&::-webkit-scrollbar": {
                    height: "8px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderRadius: "4px",
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    flexWrap: "nowrap",
                    minWidth: "min-content",
                  }}
                >
                  <Chip
                    label={"Tümü"}
                    color={selectedCategory === null ? "primary" : "default"}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === null ? null : null
                      )
                    }
                    sx={{ flexShrink: 0 }}
                  />
                  {categories.map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      color={
                        selectedCategory === category.id ? "primary" : "default"
                      }
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === category.id ? null : category.id
                        )
                      }
                      sx={{ flexShrink: 0 }}
                    />
                  ))}

                  {categories.length === 0 && (
                    <Typography
                      variant="body2"
                      align="center"
                      sx={{ width: "100%" }}
                    >
                      Henüz kategori yok. + düğmesini kullanarak ekleyin.
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Paper>

            {/* Products section */}
            <Paper
              sx={{
                p: 2,
                flexGrow: 1,
                width: "100%",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="h6" gutterBottom>
                {selectedCategory
                  ? `${
                      categories.find((c) => c.id === selectedCategory)?.name ||
                      "Kategori"
                    } Ürünleri`
                  : "Popüler Ürünler"}
              </Typography>

              <Box sx={{ flexGrow: 1, overflow: "auto" }}>
                <Grid container spacing={1}>
                  {(selectedCategory ? categoryProducts : popularProducts).map(
                    (product) => (
                      <Grid item xs={4} sm={3} key={product.id}>
                        <Button
                          variant="outlined"
                          fullWidth
                          sx={{
                            height: "100%",
                            justifyContent: "flex-start",
                            textAlign: "left",
                            textTransform: "none",
                            p: 1,
                          }}
                          onClick={() => {
                            const backstagePrice =
                              product.price *
                              (1 + settings.backstageMarginPercent / 100);
                            addItemToSale({
                              ...product,
                              price: isBackstage
                                ? backstagePrice
                                : product.price,
                            });
                          }}
                        >
                          <Box>
                            <Typography variant="body2" noWrap>
                              {product.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {isBackstage
                                ? `${(
                                    product.price *
                                    (1 + settings.backstageMarginPercent / 100)
                                  ).toFixed(2)} ₺`
                                : `${product.price} ₺`}
                            </Typography>
                          </Box>
                        </Button>
                      </Grid>
                    )
                  )}

                  {(selectedCategory ? categoryProducts : popularProducts)
                    .length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body1" align="center" sx={{ p: 4 }}>
                        {selectedCategory
                          ? "Bu kategoride ürün bulunamadı."
                          : "Henüz popüler ürün yok. Satış yapmaya başlayın!"}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Add Product Dialog */}
      <NewProductDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setNewProductBarcode("");
        }}
        onAddProduct={handleAddProduct}
        initialBarcode={newProductBarcode}
        categories={categories}
      />

      {/* Add Category Dialog */}
      <CategoryDialog
        open={showCategoryDialog}
        onClose={() => setShowCategoryDialog(false)}
        onAddCategory={handleAddCategory}
      />

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default POSScreen;
