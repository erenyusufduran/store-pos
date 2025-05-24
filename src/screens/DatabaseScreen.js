import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import BackupIcon from '@mui/icons-material/Backup';
import StorageIcon from '@mui/icons-material/Storage';

function DatabaseScreen() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupPath, setBackupPath] = useState('');

  useEffect(() => {
    // Fetch database structure on component mount
    fetchDatabaseStructure();
  }, []);

  useEffect(() => {
    // Fetch table data when a table is selected
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const fetchDatabaseStructure = async () => {
    try {
      const dbExport = await window.api.exportDatabase();
      if (dbExport.error) {
        showSnackbar(`Error: ${dbExport.error}`, 'error');
        return;
      }
      
      // Get table names
      const tableNames = Object.keys(dbExport).filter(name => name !== 'error');
      setTables(tableNames);
      
      // Select first table by default if available
      if (tableNames.length > 0 && !selectedTable) {
        setSelectedTable(tableNames[0]);
      }
    } catch (error) {
      showSnackbar(`Failed to fetch database structure: ${error.message}`, 'error');
    }
  };

  const fetchTableData = async (tableName) => {
    try {
      const data = await window.api.getTableData(tableName);
      if (data.error) {
        showSnackbar(`Error: ${data.error}`, 'error');
        return;
      }
      
      setTableData(data);
      
      // Extract column names from the first row
      if (data.length > 0) {
        setColumns(Object.keys(data[0]));
      } else {
        setColumns([]);
      }
    } catch (error) {
      showSnackbar(`Failed to fetch table data: ${error.message}`, 'error');
    }
  };

  const handleTableChange = (event, newValue) => {
    setSelectedTable(newValue);
  };

  const handleExportDatabase = async () => {
    try {
      const dbExport = await window.api.exportDatabase();
      if (dbExport.error) {
        showSnackbar(`Error: ${dbExport.error}`, 'error');
        return;
      }
      
      // Convert to JSON and create download link
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbExport, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "database_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      showSnackbar('Database exported successfully!', 'success');
    } catch (error) {
      showSnackbar(`Failed to export database: ${error.message}`, 'error');
    }
  };

  const handleBackupDatabase = async () => {
    setBackupDialogOpen(true);
  };

  const confirmBackup = async () => {
    try {
      const result = await window.api.backupDatabase(backupPath || undefined);
      setBackupDialogOpen(false);
      
      if (result.success) {
        showSnackbar(`Database backed up to: ${result.path}`, 'success');
      } else {
        showSnackbar(`Backup failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showSnackbar(`Backup failed: ${error.message}`, 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Veritabanı Yönetimi
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<DownloadIcon />}
          onClick={handleExportDatabase}
        >
          Veritabanını JSON olarak dışa aktar
        </Button>
        <Button 
          variant="contained" 
          color="secondary"
          startIcon={<BackupIcon />}
          onClick={handleBackupDatabase}
        >
          Veritabanını yedekle
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedTable} 
            onChange={handleTableChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tables.map(table => (
              <Tab key={table} label={table} value={table} icon={<StorageIcon />} iconPosition="start" />
            ))}
          </Tabs>
        </Box>
        
        {selectedTable && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedTable} Table Data
            </Typography>
            
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {columns.map(column => (
                      <TableCell key={column}>{column}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow key={index} hover>
                      {columns.map(column => (
                        <TableCell key={`${index}-${column}`}>
                          {typeof row[column] === 'object' ? JSON.stringify(row[column]) : row[column]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {tableData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        No data found in this table
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
      
      {/* Backup Dialog */}
      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)}>
        <DialogTitle>Backup Database</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Enter a custom path for the backup file or leave empty to use the default location.
          </Typography>
          <TextField
            fullWidth
            label="Backup Path (Optional)"
            value={backupPath}
            onChange={(e) => setBackupPath(e.target.value)}
            placeholder="C:/backups/my_database_backup.db"
            margin="normal"
            helperText="If left empty, the backup will be saved in the app's data directory"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmBackup} variant="contained" color="primary">
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DatabaseScreen; 