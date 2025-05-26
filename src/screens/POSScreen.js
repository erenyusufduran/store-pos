import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
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
import { FixedSizeGrid as GridVirtualized } from "react-window";
import { FixedSizeList as ListVirtualized } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

// Product Filter Modal Component
const ProductFilterModal = React.memo(
  ({
    open,
    onClose,
    products,
    searchTerm,
    onAddToSale,
    isBackstage,
    backstagePriceMultiplier,
  }) => {
    const filteredProducts = products
      ? products.filter((product) =>
          product.name.toUpperCase().includes(searchTerm.toUpperCase())
        )
      : [];

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: "80vh",
            maxHeight: "80vh",
          },
        }}
      >
        <DialogTitle>"{searchTerm}" için Ürünler</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ height: "100%", overflow: "hidden" }}>
            {filteredProducts.length === 0 ? (
              <Typography variant="body1" align="center" sx={{ p: 4 }}>
                "{searchTerm}" için ürün bulunamadı
              </Typography>
            ) : (
              <AutoSizer>
                {({ height, width }) => (
                  <ListVirtualized
                    height={height}
                    itemCount={filteredProducts.length}
                    itemSize={72}
                    width={width}
                  >
                    {({ index, style }) => {
                      const product = filteredProducts[index];
                      return (
                        <div style={style}>
                          <ListItem
                            button
                            onClick={() => {
                              const backstagePrice =
                                product.price * backstagePriceMultiplier;
                              onAddToSale({
                                ...product,
                                price: isBackstage
                                  ? backstagePrice
                                  : product.price,
                              });
                              onClose();
                            }}
                          >
                            <ListItemText
                              primary={product.name}
                              secondary={
                                <>
                                  <Typography variant="body2" component="span">
                                    {isBackstage
                                      ? `${(
                                          product.price *
                                          (1 + backstagePriceMultiplier - 1)
                                        ).toFixed(2)} ₺`
                                      : `${product.price} ₺`}
                                  </Typography>
                                  <br />
                                  <Typography
                                    variant="caption"
                                    component="span"
                                    color="textSecondary"
                                  >
                                    Barkod: {product.barcode}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </div>
                      );
                    }}
                  </ListVirtualized>
                )}
              </AutoSizer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

// Image Gallery Component
const ImageGallery = React.memo(({ onImageClick, images }) => {
  const [imageUrls, setImageUrls] = useState({});

  // Remove duplicate images by using a Set
  const uniqueImages = useMemo(() => {
    const seen = new Set();
    return images.filter(image => {
      const duplicate = seen.has(image.title);
      seen.add(image.title);
      return !duplicate;
    });
  }, [images]);

  // Function to fetch product image from web
  const fetchProductImage = async (title) => {
    try {
      // Create search terms for better results
      const searchTerms = [
        `${title} product`,
        `${title} bottle`,
        `${title} drink`,
        `${title} alcohol`,
        `${title} beverage`
      ];

      // Try each search term until we find an image
      for (const term of searchTerms) {
        try {
          // Use a proxy service to avoid CORS issues
          const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.google.com/search?q=${term}&tbm=isch`)}`);
          
          if (response.ok) {
            const html = await response.text();
            // Extract image URL from the response
            const imgMatch = html.match(/https:\/\/[^"]+\.(?:jpg|jpeg|png|gif)/i);
            console.log(imgMatch)
            if (imgMatch) {
              return imgMatch[0];
            }
          }
        } catch (error) {
          console.error(`Error fetching image for term ${term}:`, error);
          continue;
        }
      }
      return null;
    } catch (error) {
      console.error('Error in fetchProductImage:', error);
      return null;
    }
  };

  // Load images when component mounts or images change
  useEffect(() => {
    const loadImages = async () => {
      const newImageUrls = {};
      
      for (const image of uniqueImages) {
        try {
          const productImage = await fetchProductImage(image.title);
          if (productImage) {
            // Verify the image URL is accessible
            const imgResponse = await fetch(productImage, { method: 'HEAD' });
            if (imgResponse.ok) {
              newImageUrls[image.title] = productImage;
            } else {
              newImageUrls[image.title] = image.url;
            }
          } else {
            newImageUrls[image.title] = image.url;
          }
        } catch (error) {
          console.error(`Error loading image for ${image.title}:`, error);
          newImageUrls[image.title] = image.url;
        }
      }
      
      setImageUrls(newImageUrls);
    };

    loadImages();
  }, [uniqueImages]);

  return (
    <Paper sx={{ p: 2, mb: 2, height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Hızlı Ürünler
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 2,
          height: "calc(100% - 40px)",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgba(0,0,0,0.05)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.3)",
            },
          },
        }}
      >
        {uniqueImages.map((image) => (
          <Box
            key={`${image.id}-${image.title}`}
            onClick={() => onImageClick(image.title)}
            sx={{
              position: "relative",
              paddingTop: "120%",
              cursor: "pointer",
              "&:hover": {
                transform: "scale(1.05)",
                transition: "transform 0.2s ease-in-out",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              },
            }}
          >
            <img
              src={imageUrls[image.title] || image.url}
              alt={image.title}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "12px",
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = image.url;
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "12px",
                borderRadius: "0 0 12px 12px",
                textAlign: "center",
                backdropFilter: "blur(4px)",
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {image.title}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
});

// Main BarcodeScanner component
const BarcodeScanner = React.memo(({ onProductScanned }) => {
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
});

// New Product Dialog
const NewProductDialog = React.memo(
  ({
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
  }
);

// New CategoryDialog component
const CategoryDialog = React.memo(({ open, onClose, onAddCategory }) => {
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
});

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
    getProducts,
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
  const [products, setProducts] = useState([]);
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
  const [filterModal, setFilterModal] = useState({
    open: false,
    searchTerm: "",
  });
  const [images, setImages] = useState([
    // Alcoholic Beverages
    { id: 1, url: "https://picsum.photos/200/200?random=1", title: "Red Label" },
    { id: 2, url: "https://picsum.photos/200/200?random=2", title: "CHIVAS" },
    { id: 3, url: "https://picsum.photos/200/200?random=3", title: "Jack Daniels" },
    { id: 4, url: "https://picsum.photos/200/200?random=4", title: "Bourbon" },
    // Beers
    { id: 5, url: "https://picsum.photos/200/200?random=5", title: "Efes" },
    { id: 6, url: "https://picsum.photos/200/200?random=6", title: "Tuborg" },
    { id: 7, url: "https://picsum.photos/200/200?random=7", title: "Miller" },
    { id: 8, url: "https://picsum.photos/200/200?random=8", title: "Corona" },
    // Spirits
    { id: 9, url: "https://picsum.photos/200/200?random=9", title: "Votka" },
    { id: 10, url: "https://picsum.photos/200/200?random=10", title: "Tekila" },
    { id: 11, url: "https://picsum.photos/200/200?random=11", title: "Rom" },
    { id: 12, url: "https://picsum.photos/200/200?random=12", title: "Gin" },
    // Wine & Others
    { id: 13, url: "https://picsum.photos/200/200?random=13", title: "Şarap" },
    { id: 14, url: "https://picsum.photos/200/200?random=14", title: "Rakı" },
    { id: 15, url: "https://picsum.photos/200/200?random=15", title: "Konyak" },
  ]);
  const barcodeInputRef = useRef(null);

  // Load settings and initial products
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const savedSettings = await window.api.getSettings();
        setSettings(savedSettings || { backstageMarginPercent: 0 });

        // Load initial products
        const { products: initialProducts } = await getProducts({
          page: 1,
          limit: 50,
          filters: { name: images.map((image) => image.title) },
        });
        setProducts(initialProducts || []);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array since we only want to load once on mount

  // Update products when filter modal opens
  useEffect(() => {
    const loadFilteredProducts = async () => {
      if (filterModal.open) {
        try {
          const { products: filteredProducts } = await getProducts({
            page: 1,
            limit: 50,
            filters: { name: filterModal.searchTerm },
          });
          setProducts(filteredProducts || []);
        } catch (error) {
          console.error("Error loading filtered products:", error);
        }
      }
    };

    loadFilteredProducts();
  }, [filterModal.open, filterModal.searchTerm, getProducts]);

  // Memoize expensive calculations
  const backstagePriceMultiplier = useMemo(
    () => 1 + settings.backstageMarginPercent / 100,
    [settings.backstageMarginPercent]
  );

  // Memoize handlers
  const handleProductScanned = useCallback(
    async (barcode) => {
      const product = await getProductByBarcode(barcode);

      if (product) {
        const backstagePrice = product.price * backstagePriceMultiplier;
        addItemToSale({
          ...product,
          price: isBackstage ? backstagePrice : product.price,
        });
      } else {
        setNewProductBarcode(barcode);
        setShowAddDialog(true);
      }
    },
    [getProductByBarcode, addItemToSale, isBackstage, backstagePriceMultiplier]
  );

  const handleAddProduct = useCallback(
    async (productData) => {
      try {
        const newProduct = await addProduct(productData);
        setShowAddDialog(false);
        setNewProductBarcode("");
        const backstagePrice = newProduct.price * backstagePriceMultiplier;
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
    },
    [
      addProduct,
      addItemToSale,
      isBackstage,
      backstagePriceMultiplier,
      refreshPopularProducts,
    ]
  );

  const handleCompleteSale = useCallback(
    async (paymentType) => {
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
    },
    [
      currentSale.length,
      completeSale,
      isBackstage,
      settings.backstageMarginPercent,
      refreshPopularProducts,
    ]
  );

  // Memoize filtered products
  const displayedProducts = useMemo(
    () => (selectedCategory ? categoryProducts : popularProducts),
    [selectedCategory, categoryProducts, popularProducts]
  );

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

  // Add focus effect
  useEffect(() => {
    const focusInput = () => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    };

    focusInput();
    window.addEventListener('click', focusInput);

    return () => {
      window.removeEventListener('click', focusInput);
    };
  }, []);

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
        <Grid item xs={4} sx={{ height: "100%", pt: 2 }}>
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
                  inputRef={barcodeInputRef}
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
                <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                  <AutoSizer>
                    {({ height, width }) => (
                      <ListVirtualized
                        height={height}
                        itemCount={currentSale.length}
                        itemSize={72} // Adjust based on your needs
                        width={width}
                      >
                        {({ index, style }) => {
                          const item = currentSale[index];
                          return (
                            <div style={style}>
                              <ListItem
                                secondaryAction={
                                  <Box>
                                    <IconButton
                                      edge="end"
                                      onClick={() =>
                                        updateItemQuantity(
                                          item.id,
                                          item.quantity - 1
                                        )
                                      }
                                    >
                                      <RemoveIcon />
                                    </IconButton>
                                    <IconButton
                                      edge="end"
                                      onClick={() =>
                                        updateItemQuantity(
                                          item.id,
                                          item.quantity + 1
                                        )
                                      }
                                    >
                                      <AddIcon />
                                    </IconButton>
                                    <IconButton
                                      edge="end"
                                      onClick={() =>
                                        removeItemFromSale(item.id)
                                      }
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
                                      <Typography
                                        variant="body2"
                                        component="span"
                                      >
                                        {item.price} ₺ × {item.quantity} ={" "}
                                        {(item.price * item.quantity).toFixed(
                                          2
                                        )}{" "}
                                        ₺
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
                            </div>
                          );
                        }}
                      </ListVirtualized>
                    )}
                  </AutoSizer>
                </Box>
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

        {/* Middle panel: Categories and products */}
        <Grid item xs={4} sx={{ height: "100%", pt: 2 }}>
          <Box
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            {/* Categories at the top */}
            <Paper
              sx={{
                p: 2,
                mb: 2,
                width: "100%",
                height: "120px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                  flexShrink: 0,
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
                  flexGrow: 1,
                  overflowX: "auto",
                  overflowY: "hidden",
                  "&::-webkit-scrollbar": {
                    height: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "rgba(0,0,0,0.05)",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderRadius: "4px",
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.3)",
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 1,
                    px: 1,
                    py: 0.5,
                    minWidth: "min-content",
                  }}
                >
                  <Chip
                    label={"Tümü"}
                    color={selectedCategory === null ? "primary" : "default"}
                    onClick={() => setSelectedCategory(null)}
                    sx={{
                      height: "32px",
                      width: "100%",
                    }}
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
                      sx={{
                        height: "32px",
                        width: "100%",
                      }}
                    />
                  ))}
                  {categories.length === 0 && (
                    <Typography
                      variant="body2"
                      align="center"
                      sx={{
                        gridColumn: "1 / -1",
                        py: 1,
                      }}
                    >
                      Henüz kategori yok. + düğmesini kullanarak ekleyin.
                    </Typography>
                  )}
                </Box>
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

              <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                {displayedProducts.length === 0 ? (
                  <Typography variant="body1" align="center" sx={{ p: 4 }}>
                    {selectedCategory
                      ? "Bu kategoride ürün bulunamadı."
                      : "Henüz popüler ürün yok. Satış yapmaya başlayın!"}
                  </Typography>
                ) : (
                  <AutoSizer>
                    {({ height, width }) => {
                      const columnCount = Math.floor(width / 200); // Adjust based on your needs
                      const rowCount = Math.ceil(
                        displayedProducts.length / columnCount
                      );
                      const columnWidth = width / columnCount;
                      const rowHeight = 80; // Adjust based on your needs

                      return (
                        <GridVirtualized
                          columnCount={columnCount}
                          columnWidth={columnWidth}
                          height={height}
                          rowCount={rowCount}
                          rowHeight={rowHeight}
                          width={width}
                        >
                          {({ columnIndex, rowIndex, style }) => {
                            const index = rowIndex * columnCount + columnIndex;
                            const product = displayedProducts[index];

                            if (!product) return null;

                            return (
                              <div style={style}>
                                <Button
                                  variant="outlined"
                                  fullWidth
                                  sx={{
                                    height: "100%",
                                    justifyContent: "flex-start",
                                    textAlign: "left",
                                    textTransform: "none",
                                    p: 1,
                                    m: 0.5,
                                  }}
                                  onClick={() => {
                                    const backstagePrice =
                                      product.price * backstagePriceMultiplier;
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
                                    <Typography
                                      variant="caption"
                                      color="textSecondary"
                                    >
                                      {isBackstage
                                        ? `${(
                                            product.price *
                                            (1 +
                                              settings.backstageMarginPercent /
                                                100)
                                          ).toFixed(2)} ₺`
                                        : `${product.price} ₺`}
                                    </Typography>
                                  </Box>
                                </Button>
                              </div>
                            );
                          }}
                        </GridVirtualized>
                      );
                    }}
                  </AutoSizer>
                )}
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Right panel: Image Gallery */}
        <Grid item xs={4} sx={{ height: "100%", pt: 2 }}>
          <ImageGallery
            images={images}
            onImageClick={(productName) => {
              setFilterModal({
                open: true,
                searchTerm: productName,
              });
            }}
          />
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

      {/* Product Filter Modal */}
      <ProductFilterModal
        open={filterModal.open}
        onClose={() => setFilterModal({ ...filterModal, open: false })}
        products={products}
        searchTerm={filterModal.searchTerm}
        onAddToSale={addItemToSale}
        isBackstage={isBackstage}
        backstagePriceMultiplier={backstagePriceMultiplier}
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

export default React.memo(POSScreen);
