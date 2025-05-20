import React, { createContext, useContext, useState } from 'react';

const SalesContext = createContext();

export function useSales() {
  return useContext(SalesContext);
}

export function SalesProvider({ children }) {
  const [todaySales, setTodaySales] = useState([]);
  const [currentSale, setCurrentSale] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  
  // Add item to current sale
  const addItemToSale = (product, quantity = 1) => {
    setCurrentSale(prevItems => {
      // Check if item already exists in the current sale
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, {
          ...product,
          quantity
        }];
      }
    });
  };
  
  // Update item quantity
  const updateItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is zero or negative
      removeItemFromSale(productId);
      return;
    }
    
    setCurrentSale(prevItems => {
      return prevItems.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };
  
  // Remove item from sale
  const removeItemFromSale = (productId) => {
    setCurrentSale(prevItems => prevItems.filter(item => item.id !== productId));
  };
  
  // Clear current sale
  const clearSale = () => {
    setCurrentSale([]);
  };
  
  // Complete sale
  const completeSale = async (paymentType) => {
    try {
      if (currentSale.length === 0) return false;
      
      const totalAmount = currentSale.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
      
      const items = currentSale.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      
      await window.api.createSale({
        totalAmount,
        paymentType,
        items
      });
      
      clearSale();
      await loadTodaySales();
      return true;
    } catch (error) {
      console.error('Error completing sale:', error);
      return false;
    }
  };
  
  // Load today's sales
  const loadTodaySales = async () => {
    try {
      const sales = await window.api.getTodaySales();
      setTodaySales(sales || []);
      return sales;
    } catch (error) {
      console.error('Error loading today\'s sales:', error);
      return [];
    }
  };
  
  // Get sales by date
  const getSalesByDate = async (date) => {
    try {
      return await window.api.getSalesByDate(date);
    } catch (error) {
      console.error('Error loading sales by date:', error);
      return [];
    }
  };
  
  // Get sales by date range
  const getSalesByDateRange = async (startDate, endDate) => {
    try {
      return await window.api.getSalesByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error loading sales by date range:', error);
      return [];
    }
  };
  
  // Get sale details
  const getSaleDetails = async (saleId) => {
    try {
      const details = await window.api.getSaleDetails(saleId);
      setSelectedSale(details);
      return details;
    } catch (error) {
      console.error('Error loading sale details:', error);
      return null;
    }
  };
  
  // Clear selected sale
  const clearSelectedSale = () => {
    setSelectedSale(null);
  };
  
  // Delete sale
  const deleteSale = async (saleId) => {
    try {
      const result = await window.api.deleteSale(saleId);
      if (result) {
        // If we're viewing today's sales, refresh the list
        await loadTodaySales();
      }
      return result;
    } catch (error) {
      console.error('Error deleting sale:', error);
      return false;
    }
  };
  
  const value = {
    currentSale,
    todaySales,
    selectedSale,
    addItemToSale,
    updateItemQuantity,
    removeItemFromSale,
    clearSale,
    completeSale,
    loadTodaySales,
    getSalesByDate,
    getSalesByDateRange,
    getSaleDetails,
    clearSelectedSale,
    deleteSale,
    getTotalAmount: () => currentSale.reduce((total, item) => total + (item.price * item.quantity), 0)
  };
  
  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
} 