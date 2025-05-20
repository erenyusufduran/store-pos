import React, { createContext, useState, useEffect, useContext } from 'react';

const ProductContext = createContext();

export function useProducts() {
  return useContext(ProductContext);
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load categories on initial render
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await window.api.getCategories();
        setCategories(categories || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    const loadPopularProducts = async () => {
      try {
        const popular = await window.api.getPopularProducts(50);
        const filteredPopular = popular.filter((product) => product.stock > 0 && product.name);
        // Sort products by stock in descending order
        filteredPopular.sort((a, b) => b.stock - a.stock);
        setPopularProducts(filteredPopular || []);
      } catch (error) {
        console.error('Failed to load popular products:', error);
      }
    };

    Promise.all([loadCategories(), loadPopularProducts()]).then(() => {
      setLoading(false);
    });
  }, []);

  // Get a product by barcode
  const getProductByBarcode = async (barcode) => {
    try {
      return await window.api.getProductByBarcode(barcode);
    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      return null;
    }
  };

  // Get products by category
  const getProductsByCategory = async (categoryId) => {
    try {
      const products = await window.api.getProductsByCategory(categoryId);
      // Sort products by stock in descending order
      return products ? products.sort((a, b) => b.stock - a.stock) : [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  };

  // Add a new product
  const addProduct = async (product) => {
    try {
      const newProduct = await window.api.addProduct(product);
      if (newProduct === 'Bu barkod numarasına sahip bir ürün zaten mevcut.') {
        return 'Bu barkod numarasına sahip bir ürün zaten mevcut.';
      }
      return newProduct;
    } catch (error) {
      throw error;
    }
  };

  // Update product stock
  const updateProductStock = async (productId, newStock) => {
    try {
      await window.api.updateProductStock({ productId, newStock });
      return true;
    } catch (error) {
      console.error('Error updating product stock:', error);
      return false;
    }
  };

  // Refresh popular products
  const refreshPopularProducts = async () => {
    try {
      const popular = await window.api.getPopularProducts(50);
      const filteredPopular = popular.filter((product) => product.stock > 0 && product.name);
      // Sort products by stock in descending order
      filteredPopular.sort((a, b) => b.stock - a.stock);
      setPopularProducts(filteredPopular || []);
    } catch (error) {
      console.error('Failed to refresh popular products:', error);
    }
  };

  const getProducts = async () => {
    try {
      const products = await window.api.getProducts();
      // Sort products by stock in descending order
      return products ? products.sort((a, b) => b.stock - a.stock) : [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const addCategory = async (categoryName) => {
    try {
      const newCategory = await window.api.addCategory(categoryName);
      setCategories((prevCategories) => [...prevCategories, newCategory]);
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateProduct = async (product) => {
    try {
      const updatedProduct = await window.api.updateProduct(product);
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  // Delete a product
  const deleteProduct = async (productId) => {
    try {
      const { success, message, stock } = await window.api.deleteProduct(productId);
      if (success) {
        return { success, message, stock };
      } else {
        throw new Error(message);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const value = {
    products,
    categories,
    popularProducts,
    loading,
    getProductByBarcode,
    getProductsByCategory,
    addProduct,
    updateProductStock,
    refreshPopularProducts,
    getProducts,
    addCategory,
    updateProduct,
    deleteProduct
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}
