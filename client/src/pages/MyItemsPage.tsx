import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  styled,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { itemsApi } from '../services/api';
import { Item } from '../types';

// Styled components to replace Grid
const ItemsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)'
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: 'repeat(1, 1fr)'
  }
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const MyItemsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [markGivenDialogOpen, setMarkGivenDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Check for message in location state (from redirect)
  useEffect(() => {
    if (location.state && (location.state as any).message) {
      setSnackbarMessage((location.state as any).message);
      setSnackbarOpen(true);
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const fetchUserItems = async () => {
      if (!currentUser) {
        navigate('/login', { state: { from: { pathname: '/my-items' } } });
        return;
      }
      
      try {
        setLoading(true);
        const response = await itemsApi.getUserItems();
        setItems(response.data.items || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching user items:', err);
        setError('Failed to load your items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserItems();
  }, [currentUser, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeleteClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setDeleteDialogOpen(true);
  };

  const handleMarkGivenClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setMarkGivenDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItemId) return;
    
    try {
      await itemsApi.deleteItem(selectedItemId);
      setItems(prevItems => prevItems.filter(item => item.id !== selectedItemId));
      setSnackbarMessage('Item deleted successfully');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error deleting item:', err);
      setSnackbarMessage('Failed to delete item. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedItemId(null);
    }
  };

  const handleMarkGivenConfirm = async () => {
    if (!selectedItemId) return;
    
    try {
      await itemsApi.markItemAsGiven(selectedItemId);
      
      // Update the item status in the local state
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === selectedItemId 
            ? { ...item, isGivenAway: true } 
            : item
        )
      );
      
      setSnackbarMessage('Item marked as given away successfully');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error marking item as given:', err);
      setSnackbarMessage('Failed to update item status. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setMarkGivenDialogOpen(false);
      setSelectedItemId(null);
    }
  };

  // Filter items based on tab
  const availableItems = items.filter(item => !item.isGivenAway);
  const givenAwayItems = items.filter(item => item.isGivenAway);

  const renderItemGrid = (itemsToRender: Item[]) => {
    if (itemsToRender.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {tabValue === 0 
              ? "You don't have any available items. Share something with your community!" 
              : "You haven't given away any items yet."}
          </Typography>
          {tabValue === 0 && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              sx={{ mt: 2 }}
              onClick={() => navigate('/items/new')}
            >
              Share an Item
            </Button>
          )}
        </Box>
      );
    }

    return (
      <ItemsGrid>
        {itemsToRender.map((item) => (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={item.imageUrls[0] || 'https://via.placeholder.com/300x200?text=No+Image'}
                alt={item.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2" noWrap>
                  {item.title}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip 
                    label={item.isFree ? 'Free' : `$${item.price}`} 
                    size="small" 
                    color={item.isFree ? 'success' : 'default'} 
                  />
                  <Chip 
                    label={item.category} 
                    size="small" 
                    variant="outlined" 
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {item.claimCount} {item.claimCount === 1 ? 'person has' : 'people have'} expressed interest
                </Typography>
                
                {item.isGivenAway && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} fontSize="small" />
                    <Typography variant="body2" color="success.main">
                      Given Away
                    </Typography>
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate(`/items/${item.id}`)}
                >
                  View
                </Button>
                
                {!item.isGivenAway && (
                  <>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/items/edit/${item.id}`)}
                    >
                      Edit
                    </Button>
                    
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteClick(item.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    
                    {item.claimCount > 0 && (
                      <Button 
                        size="small" 
                        color="success"
                        onClick={() => handleMarkGivenClick(item.id)}
                        sx={{ ml: 'auto' }}
                      >
                        Mark as Given
                      </Button>
                    )}
                  </>
                )}
              </CardActions>
            </Card>
        ))}
      </ItemsGrid>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Items
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/items/new')}
        >
          Share New Item
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="item tabs">
              <Tab 
                label={`Available (${availableItems.length})`} 
                id="tab-0" 
                aria-controls="tabpanel-0" 
              />
              <Tab 
                label={`Given Away (${givenAwayItems.length})`} 
                id="tab-1" 
                aria-controls="tabpanel-1" 
              />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {renderItemGrid(availableItems)}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {renderItemGrid(givenAwayItems)}
          </TabPanel>
        </>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Item?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Mark as given dialog */}
      <Dialog
        open={markGivenDialogOpen}
        onClose={() => setMarkGivenDialogOpen(false)}
      >
        <DialogTitle>Mark as Given Away?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark this item as given away? 
            This will move it to your "Given Away" list and it will no longer appear in search results.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkGivenDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMarkGivenConfirm} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default MyItemsPage;
