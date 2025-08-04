import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import { useAuth } from '../context/AuthContext';
import { itemsApi, usersApi } from '../services/api';
import { Item, UserProfile } from '../types';

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  borderRadius: 12,
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  '& svg': {
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
}));

const ManageClaimsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [item, setItem] = useState<Item | null>(null);
  const [claimedUser, setClaimedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Item ID is required');
      setLoading(false);
      return;
    }

    fetchItemAndClaimedUser();
  }, [id]);

  const fetchItemAndClaimedUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch item details
      const itemResponse = await itemsApi.getItem(id!);
      const itemData = itemResponse.data.item;
      setItem(itemData);

      // Check if current user owns this item
      if (itemData.userId !== currentUser?.uid) {
        setError('You can only manage claims for your own items');
        return;
      }

      // If item is claimed, fetch the user who claimed it
      if (itemData.claimedBy) {
        try {
          const userResponse = await usersApi.getUserById(itemData.claimedBy);
          setClaimedUser(userResponse.data.profile);
        } catch (userError) {
          console.error('Error fetching claimed user:', userError);
          // Don't set error here, just log it
        }
      }
    } catch (err: any) {
      console.error('Error fetching item:', err);
      setError(err.response?.data?.error || 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!item || !item.claimedBy) return;

    try {
      setLoading(true);
      await itemsApi.completeItem(item.id, item.claimedBy);
      
      // Refresh item data
      await fetchItemAndClaimedUser();
      
      // Show success message or navigate back
      navigate(`/items/${item.id}`, { 
        state: { message: 'Item marked as completed successfully!' }
      });
    } catch (err: any) {
      console.error('Error completing item:', err);
      setError(err.response?.data?.error || 'Failed to complete item');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading claim details...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Item not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/items/${item.id}`)}
          sx={{ mb: 2 }}
        >
          Back to Item
        </Button>
        <Typography variant="h4" gutterBottom>
          Manage Claims
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {item.title}
        </Typography>
      </Box>

      {/* Item Status */}
      <StyledCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Item Status
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <InfoRow>
                <CalendarTodayIcon />
                <Typography variant="body2">
                  Posted: {formatDate(item.createdAt)}
                </Typography>
              </InfoRow>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={item.isAvailable ? 'Available' : 'Claimed'}
                  color={item.isAvailable ? 'success' : 'warning'}
                  size="small"
                />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Claims: {item.claimCount || 0}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </StyledCard>

      {/* Claim Details */}
      {!item.isAvailable && item.claimedBy ? (
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Claimed By
            </Typography>
            
            {claimedUser ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={claimedUser.photoURL}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  >
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {claimedUser.displayName || 'Anonymous User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Claimed on: {formatDate(item.claimedAt)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Contact Information
                </Typography>
                
                {claimedUser.email && (
                  <InfoRow>
                    <EmailIcon />
                    <Typography variant="body2">
                      {claimedUser.email}
                    </Typography>
                  </InfoRow>
                )}
                
                {claimedUser.phone && (
                  <InfoRow>
                    <PhoneIcon />
                    <Typography variant="body2">
                      {claimedUser.phone}
                    </Typography>
                  </InfoRow>
                )}
                
                {claimedUser.location && (
                  <InfoRow>
                    <LocationOnIcon />
                    <Typography variant="body2">
                      {claimedUser.location}
                    </Typography>
                  </InfoRow>
                )}

                {claimedUser.bio && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      About
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {claimedUser.bio}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Alert severity="info">
                Unable to load user details for the person who claimed this item.
              </Alert>
            )}
          </CardContent>
        </StyledCard>
      ) : (
        <StyledCard>
          <CardContent>
            <Alert severity="info">
              This item hasn't been claimed yet. Once someone claims it, their contact information will appear here.
            </Alert>
          </CardContent>
        </StyledCard>
      )}

      {/* Actions */}
      {!item.isAvailable && item.claimedBy && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Actions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Once you've completed the handover, mark this item as completed.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleMarkAsCompleted}
            disabled={loading}
          >
            Mark as Completed
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default ManageClaimsPage;
