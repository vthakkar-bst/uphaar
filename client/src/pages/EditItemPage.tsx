import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardMedia,
  Container
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { itemsApi } from '../services/api';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { CreateItemFormData, Item } from '../types';

// Styled components
const FormContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(3),
  width: '100%',
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: '1fr 1fr',
  },
}));

const FormItem = styled(Box)<{ xs?: number; sm?: number; md?: number }>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
}));

const ImageGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(4, 1fr)',
  },
}));

const categories = [
  'Furniture',
  'Electronics',
  'Clothing',
  'Books',
  'Toys',
  'Kitchen',
  'Sports',
  'Other'
];

const conditions = [
  'new',
  'like-new',
  'good',
  'fair',
  'poor'
];

const EditItemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [item, setItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<CreateItemFormData>({
    title: '',
    description: '',
    imageUrls: [],
    location: '',
    contactPhone: '',
    contactEmail: '',
    category: '',
    condition: 'good',
    isFree: true,
    price: 0
  });
  
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!id) {
      setError('Item ID is required');
      setLoading(false);
      return;
    }

    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await itemsApi.getItem(id!);
      const itemData = response.data.item;
      
      // Check if current user owns this item
      if (itemData.userId !== currentUser?.uid) {
        setError('You can only edit your own items');
        return;
      }

      setItem(itemData);
      setFormData({
        title: itemData.title,
        description: itemData.description,
        imageUrls: itemData.imageUrls || [],
        location: itemData.location,
        contactPhone: itemData.contactPhone || '',
        contactEmail: itemData.contactEmail || '',
        category: itemData.category,
        condition: itemData.condition,
        isFree: itemData.isFree,
        price: itemData.price || 0
      });
      setExistingImages(itemData.imageUrls || []);
    } catch (err: any) {
      console.error('Error fetching item:', err);
      setError(err.response?.data?.error || 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(url => url !== imageUrl));
    setImagesToDelete(prev => [...prev, imageUrl]);
  };

  const uploadNewImages = async () => {
    if (newImages.length === 0) return [];
    
    setUploading(true);
    const imageUrls: string[] = [];
    
    try {
      for (let i = 0; i < newImages.length; i++) {
        const image = newImages[i];
        const fileName = `items/${currentUser?.uid}/${Date.now()}_${image.name}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, image);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / newImages.length) * 100));
      }
      
      return imageUrls;
    } catch (err) {
      console.error('Error uploading images:', err);
      throw new Error('Failed to upload images');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteImages = async (imageUrls: string[]) => {
    for (const imageUrl of imageUrls) {
      try {
        // Extract the path from the URL
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0];
        const path = `items/${currentUser?.uid}/${fileName}`;
        const storageRef = ref(storage, path);
        
        await deleteObject(storageRef);
      } catch (err) {
        console.warn('Failed to delete image:', imageUrl, err);
        // Continue with other deletions even if one fails
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !item) {
      navigate('/login');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Validate form
      if (!formData.title || !formData.description || !formData.location || !formData.category) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }
      
      // Upload new images if any
      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        newImageUrls = await uploadNewImages();
      }
      
      // Combine existing images (not deleted) with new images
      const allImageUrls = [...existingImages, ...newImageUrls];
      
      // Update item
      const itemData = {
        ...formData,
        imageUrls: allImageUrls
      };
      
      await itemsApi.updateItem(item.id, itemData);
      
      // Delete removed images from storage
      if (imagesToDelete.length > 0) {
        await deleteImages(imagesToDelete);
      }
      
      // Redirect to item detail page
      navigate(`/items/${item.id}`, { 
        state: { message: 'Item updated successfully!' }
      });
    } catch (err: any) {
      console.error('Error updating item:', err);
      setError(err.response?.data?.error || 'Failed to update item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading item details...
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
          Edit Item
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Update your item details
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <FormContainer>
            {/* Basic Information */}
            <FormItem xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </FormItem>
            
            <FormItem xs={12}>
              <TextField
                name="title"
                label="Title *"
                fullWidth
                value={formData.title}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </FormItem>
            
            <FormItem xs={12}>
              <TextField
                name="description"
                label="Description *"
                multiline
                rows={4}
                fullWidth
                value={formData.description}
                onChange={handleChange}
                required
                disabled={submitting}
                helperText="Provide details about the item, its condition, and any relevant information"
              />
            </FormItem>
            
            <FormItem xs={12} sm={6}>
              <FormControl fullWidth required disabled={submitting}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleSelectChange}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </FormItem>
            
            <FormItem xs={12} sm={6}>
              <FormControl fullWidth disabled={submitting}>
                <InputLabel>Condition</InputLabel>
                <Select
                  name="condition"
                  value={formData.condition}
                  onChange={handleSelectChange}
                  label="Condition"
                >
                  {conditions.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </FormItem>

            {/* Pricing */}
            <FormItem xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Pricing
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </FormItem>
            
            <FormItem xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleSwitchChange}
                    disabled={submitting}
                  />
                }
                label="This item is free"
              />
            </FormItem>
            
            {!formData.isFree && (
              <FormItem xs={12} sm={6}>
                <TextField
                  name="price"
                  label="Price"
                  type="number"
                  fullWidth
                  value={formData.price}
                  onChange={handleChange}
                  disabled={submitting}
                  InputProps={{
                    startAdornment: <span>₹</span>,
                  }}
                />
              </FormItem>
            )}

            {/* Contact Information */}
            <FormItem xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </FormItem>
            
            <FormItem xs={12}>
              <TextField
                name="location"
                label="Location *"
                fullWidth
                value={formData.location}
                onChange={handleChange}
                required
                disabled={submitting}
                helperText="Provide a general location (neighborhood, city, etc.)"
              />
            </FormItem>
            
            <FormItem xs={12} sm={6}>
              <TextField
                name="contactPhone"
                label="Contact Phone"
                fullWidth
                value={formData.contactPhone}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormItem>
            
            <FormItem xs={12} sm={6}>
              <TextField
                name="contactEmail"
                label="Contact Email"
                type="email"
                fullWidth
                value={formData.contactEmail}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormItem>
            
            {/* Images */}
            <FormItem xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Images
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </FormItem>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <FormItem xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Images
                </Typography>
                <ImageGrid>
                  {existingImages.map((imageUrl, index) => (
                    <Box key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="140"
                          image={imageUrl}
                          alt={`Existing ${index + 1}`}
                        />
                        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" noWrap>
                            Image {index + 1}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveExistingImage(imageUrl)}
                            disabled={uploading || submitting}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Card>
                    </Box>
                  ))}
                </ImageGrid>
              </FormItem>
            )}
            
            {/* Add New Images */}
            <FormItem xs={12}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                multiple
                type="file"
                onChange={handleImageChange}
                disabled={uploading || submitting}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={uploading || submitting}
                >
                  Add New Images
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                You can upload additional images.
              </Typography>
            </FormItem>
            
            {/* New Images Preview */}
            {newImages.length > 0 && (
              <FormItem xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  New Images to Upload
                </Typography>
                <ImageGrid>
                  {newImages.map((image, index) => (
                    <Box key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="140"
                          image={URL.createObjectURL(image)}
                          alt={`New ${index + 1}`}
                        />
                        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" noWrap>
                            {image.name}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveNewImage(index)}
                            disabled={uploading || submitting}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Card>
                    </Box>
                  ))}
                </ImageGrid>
              </FormItem>
            )}
            
            {/* Submit Button */}
            <FormItem xs={12} sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={uploading || submitting}
                startIcon={submitting ? <CircularProgress size={24} /> : <SaveIcon />}
              >
                {submitting ? 'Updating Item...' : 'Update Item'}
              </Button>
            </FormItem>
          </FormContainer>
        </form>
      </Paper>
    </Container>
  );
};

export default EditItemPage;
