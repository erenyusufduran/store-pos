import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';

// Import screens
import POSScreen from './screens/POSScreen.js';
import InventoryScreen from './screens/InventoryScreen.js';
import ReportScreen from './screens/ReportScreen.js';
import DatabaseScreen from './screens/DatabaseScreen.js';

// Import contexts
import { ProductProvider } from './contexts/ProductContext.js';
import { SalesProvider } from './contexts/SalesContext.js';

function App() {
  return (
    <ProductProvider>
      <SalesProvider>
        <Router>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                POS System
              </Typography>
              <Button color="inherit" component={Link} to="/">POS</Button>
              <Button color="inherit" component={Link} to="/inventory">Inventory</Button>
              <Button color="inherit" component={Link} to="/reports">Reports</Button>
              <Button color="inherit" component={Link} to="/database">Database</Button>
            </Toolbar>
          </AppBar>
          
          <Container maxWidth="xl" sx={{ mt: 2, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
            <Routes>
              <Route path="/" element={<POSScreen />} />
              <Route path="/inventory" element={<InventoryScreen />} />
              <Route path="/reports" element={<ReportScreen />} />
              <Route path="/database" element={<DatabaseScreen />} />
            </Routes>
          </Container>
        </Router>
      </SalesProvider>
    </ProductProvider>
  );
}

export default App; 