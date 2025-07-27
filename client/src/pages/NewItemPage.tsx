import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { itemsApi } from '../services/api';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CreateItemFormData } from '../types';

// Styled components to replace Grid
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

const NewItemPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CreateItemFormData>({
    title: '',
    description: '',
    imageUrls: [],
    location: '',
    contactPhone: '',
    contactEmail: currentUser?.email || '',
    category: '',
    condition: 'good',
    isFree: true,
    price: 0
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      setImages(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (images.length === 0) return [];
    
    setUploading(true);
    const imageUrls: string[] = [];
    
    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const fileName = `items/${currentUser?.uid}/${Date.now()}_${image.name}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, image);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / images.length) * 100));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: '/items/new' } } });
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
      
      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }
      
      // Create item
      const itemData = {
        ...formData,
        imageUrls
      };
      
      await itemsApi.createItem(itemData);
      
      // Redirect to my items page
      navigate('/my-items', { state: { message: 'Item created successfully!' } });
    } catch (err) {
      console.error('Error creating item:', err);
      setError('Failed to create item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Share a New Item
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <FormContainer sx={{ gap: 3 }}>
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
                label="Item Title *"
                fullWidth
                value={formData.title}
                onChange={handleChange}
                required
              />
            </FormItem>
            
            <FormItem xs={12}>
              <TextField
                name="description"
                label="Description *"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
                required
                helperText="Provide details about the item, its features, and any relevant information"
              />
            </FormItem>
            
            <FormItem xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={formData.category}
                  label="Category"
                  onChange={handleSelectChange}
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
              <FormControl fullWidth required>
                <InputLabel id="condition-label">Condition</InputLabel>
                <Select
                  labelId="condition-label"
                  name="condition"
                  value={formData.condition}
                  label="Condition"
                  onChange={handleSelectChange}
                >
                  {conditions.map((cond) => (
                    <MenuItem key={cond} value={cond}>
                      {cond}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </FormItem>
            
            {/* Price Information */}
            <FormItem xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Price Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </FormItem>
            
            <FormItem xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={formData.isFree} 
                    onChange={handleSwitchChange} 
                    name="isFree" 
                    color="primary"
                  />
                }
                label="This item is free"
              />
            </FormItem>
            
            {!formData.isFree && (
              <FormItem xs={12} sm={6}>
                <TextField
                  name="price"
                  label="Price ($)"
                  type="number"
                  fullWidth
                  value={formData.price}
                  onChange={handleChange}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 }
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
              />
            </FormItem>
            
            {/* Images */}
            <FormItem xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Images
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </FormItem>
            
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
                  Add Images
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                You can upload multiple images. The first image will be the main image.
              </Typography>
            </FormItem>
            
            {images.length > 0 && (
              <FormItem xs={12}>
                <ImageGrid>
                  {images.map((image, index) => (
                    <Box key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="140"
                          image={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                        />
                        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" noWrap>
                            {image.name}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveImage(index)}
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
                startIcon={submitting ? <CircularProgress size={24} /> : <AddIcon />}
              >
                {submitting ? 'Creating Item...' : 'Create Item'}
              </Button>
            </FormItem>
          </FormContainer>
        </form>
      </Paper>
    </Box>
  );
};

export default NewItemPage;
