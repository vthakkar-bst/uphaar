import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CardGiftcard as GiftIcon,
  Favorite as FavoriteIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
import { UserProfile, UserStats } from '../types';

// Use styled components for Grid to fix TypeScript errors
const StyledGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(4),
  gridTemplateColumns: '1fr',
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: '2fr 1fr',
  },
}));

const FormGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
}));

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    location: '',
    bio: '',
    phone: ''
  });

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Fetch profile
        const profileResponse = await usersApi.getProfile();
        setProfile(profileResponse.data);
        
        // Initialize form data
        setFormData({
          displayName: profileResponse.data.displayName || '',
          location: profileResponse.data.location || '',
          bio: profileResponse.data.bio || '',
          phone: profileResponse.data.phone || ''
        });
        
        // Fetch stats
        const statsResponse = await usersApi.getStats();
        setStats(statsResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndStats();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      
      await usersApi.updateProfile({
        displayName: formData.displayName,
        location: formData.location,
        bio: formData.bio,
        phone: formData.phone
      });
      
      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        displayName: formData.displayName,
        location: formData.location,
        bio: formData.bio,
        phone: formData.phone
      } : null);
      
      setEditing(false);
      setSnackbarMessage('Profile updated successfully');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error updating profile:', err);
      setSnackbarMessage('Failed to update profile. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to current profile values
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        location: profile.location || '',
        bio: profile.bio || '',
        phone: profile.phone || ''
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error || 'Profile not found'}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      
      <StyledGrid>
        {/* Left column - Profile info */}
        <Box>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={profile.photoURL || undefined} 
                  alt={profile.displayName || 'User'} 
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {profile.displayName || 'User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              
              {!editing ? (
                <Button 
                  startIcon={<EditIcon />}
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {editing ? (
              <FormGrid>
                <TextField
                  name="displayName"
                  label="Display Name"
                  fullWidth
                  value={formData.displayName}
                  onChange={handleChange}
                />
                <TextField
                  name="location"
                  label="Location"
                  fullWidth
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State"
                />
                <TextField
                  name="bio"
                  label="Bio"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us a little about yourself..."
                />
                <TextField
                  name="phone"
                  label="Phone Number"
                  fullWidth
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </FormGrid>
            ) : (
              <Box>
                {profile.location && (
                  <Typography variant="body1" paragraph>
                    <strong>Location:</strong> {profile.location}
                  </Typography>
                )}
                
                {profile.bio && (
                  <Typography variant="body1" paragraph>
                    <strong>Bio:</strong> {profile.bio}
                  </Typography>
                )}
                
                {profile.phone && (
                  <Typography variant="body1">
                    <strong>Phone:</strong> {profile.phone}
                  </Typography>
                )}
                
                {!profile.location && !profile.bio && !profile.phone && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Your profile is empty. Click "Edit Profile" to add information about yourself.
                  </Typography>
                )}
                
                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>Email:</strong> {profile.email}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
        
        {/* Right column - Stats */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Stats
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <GiftIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Items Shared" 
                    secondary={stats?.itemsShared || 0} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <PeopleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Items Given Away" 
                    secondary={stats?.itemsGivenAway || 0} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <FavoriteIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Items Claimed" 
                    secondary={stats?.itemsClaimed || 0} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </StyledGrid>
      
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

export default ProfilePage;
