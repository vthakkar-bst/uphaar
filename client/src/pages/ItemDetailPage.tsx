import React, { useState, useEffect, ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Chip, 
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { itemsApi, usersApi } from '../services/api';
import { Item, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';

// Styled components to replace Grid
const DetailContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: '1fr 1fr'
  }
}));

const ImageGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(2)
}));

const ActionGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing(2)
}));

const ItemDetailPage = (): ReactElement => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [item, setItem] = useState<Item | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await itemsApi.getItem(id);
        const itemData = response.data.item;
        setItem(itemData);
        
        // Fetch owner details
        if (itemData?.userId) {
          const ownerResponse = await usersApi.getUserById(itemData.userId);
          setOwner(ownerResponse.data);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching item details:', err);
        setError('Failed to load item details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [id]);

  const handleClaimItem = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: `/items/${id}` } } });
      return;
    }

    if (!id) return;
    
    try {
      setClaiming(true);
      await itemsApi.claimItem(id);
      setSnackbarMessage('Item claimed successfully! The owner will be notified.');
      setSnackbarOpen(true);
      
      // Refresh item data to update claim count
      const response = await itemsApi.getItem(id);
      setItem(response.data.item);
    } catch (err) {
      console.error('Error claiming item:', err);
      setSnackbarMessage('Failed to claim item. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setClaiming(false);
      setOpenDialog(false);
    }
  };

  const handleOpenImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'Unknown';
    
    // Handle Firebase timestamp
    let date: Date;
    
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      // Firebase Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      // string or number
      date = new Date(timestamp as string | number);
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !item) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error || 'Item not found'}
      </Alert>
    );
  }

  const isOwner = currentUser && currentUser.uid === item.userId;

  return (
    <Box>
      <DetailContainer>
        {/* Left column - Images */}
        <Box sx={{ gridColumn: 1 }}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={item.imageUrls[0] || 'https://via.placeholder.com/600x400?text=No+Image'}
              alt={item.title}
              sx={{ objectFit: 'contain', bgcolor: 'grey.100', cursor: 'pointer' }}
              onClick={() => handleOpenImage(item.imageUrls[0])}
            />
          </Card>
          
          {/* Thumbnail images */}
          {item.imageUrls.length > 1 && (
            <ImageGrid sx={{ mt: 1 }}>
              {item.imageUrls.slice(1).map((url, index) => (
                <Box key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.8 }
                    }}
                    onClick={() => handleOpenImage(url)}
                  >
                    <CardMedia
                      component="img"
                      height="80"
                      image={url}
                      alt={`${item.title} - image ${index + 2}`}
                      sx={{ objectFit: 'cover' }}
                    />
                  </Card>
                </Box>
              ))}
            </ImageGrid>
          )}
        </Box>
        
        {/* Right column - Item details */}
        <Box>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {item.title}
              </Typography>
              
              <Chip 
                label={item.isFree ? 'Free' : `$${item.price}`} 
                color={item.isFree ? 'success' : 'primary'} 
                size="medium"
                sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={item.category} variant="outlined" />
              <Chip label={`Condition: ${item.condition}`} variant="outlined" />
            </Box>
            
            <Typography variant="body1" paragraph>
              {item.description}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Location and contact info */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {item.location}
                </Typography>
              </Box>
              
              {item.contactPhone && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {item.contactPhone}
                  </Typography>
                </Box>
              )}
              
              {item.contactEmail && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {item.contactEmail}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Item metadata */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimeIcon color="action" sx={{ mr: 1 }} fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Posted on {formatDate(item.createdAt)}
                </Typography>
              </Box>
              
              {owner && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon color="action" sx={{ mr: 1 }} fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Posted by {owner.displayName}
                  </Typography>
                </Box>
              )}
              
              <Typography variant="body2" color="text.secondary">
                {item.claimCount} {item.claimCount === 1 ? 'person has' : 'people have'} expressed interest
              </Typography>
            </Box>
            
            {/* Action buttons */}
            <Box sx={{ mt: 3 }}>
              {isOwner ? (
                <ActionGrid>
                  <Box>
                    <Button 
                      variant="outlined" 
                      fullWidth
                      onClick={() => navigate(`/items/edit/${item.id}`)}
                    >
                      Edit Item
                    </Button>
                  </Box>
                  <Box>
                    <Button 
                      variant="contained" 
                      color="secondary"
                      fullWidth
                      onClick={() => navigate(`/items/manage/${item.id}`)}
                    >
                      Manage Claims
                    </Button>
                  </Box>
                </ActionGrid>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  fullWidth
                  disabled={claiming}
                  onClick={() => setOpenDialog(true)}
                >
                  {claiming ? <CircularProgress size={24} /> : 'Claim This Item'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </DetailContainer>

      {/* Claim confirmation dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Claim this item?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            By claiming this item, you're expressing interest in receiving it. 
            The owner will be able to see that you're interested, and you may be contacted 
            using the information in your profile.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleClaimItem} variant="contained" disabled={claiming}>
            {claiming ? <CircularProgress size={24} /> : 'Confirm Claim'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt={item.title} 
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Close</Button>
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

export default ItemDetailPage;
