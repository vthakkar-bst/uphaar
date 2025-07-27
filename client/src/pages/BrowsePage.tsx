import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Button,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Pagination,
  styled
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { itemsApi } from '../services/api';
import { Item } from '../types';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';

// Styled components to replace Grid
const ItemsContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: theme.spacing(3),
  [theme.breakpoints.down('lg')]: {
    gridTemplateColumns: 'repeat(3, 1fr)'
  },
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)'
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: 'repeat(1, 1fr)'
  }
}));

const categories = [
  'All Categories',
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
  'All Conditions',
  'new',
  'like-new',
  'good',
  'fair',
  'poor'
];

const BrowsePage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [condition, setCondition] = useState('All Conditions');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await itemsApi.getItems();
        setItems(response.data.items || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError('Failed to load items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Filter items based on search term, category, and condition
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      category === 'All Categories' || 
      item.category === category;
    
    const matchesCondition = 
      condition === 'All Conditions' || 
      item.condition === condition;
    
    return matchesSearch && matchesCategory && matchesCondition;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const displayedItems = filteredItems.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Browse Available Gifts
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          sx={{ flexGrow: 1 }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            value={category}
            label="Category"
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="condition-label">Condition</InputLabel>
          <Select
            labelId="condition-label"
            value={condition}
            label="Condition"
            onChange={(e) => {
              setCondition(e.target.value);
              setPage(1);
            }}
          >
            {conditions.map((cond) => (
              <MenuItem key={cond} value={cond}>
                {cond}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Results count */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" color="text.secondary">
              {filteredItems.length === 0
                ? 'No items found'
                : `Showing ${Math.min(filteredItems.length, itemsPerPage)} of ${filteredItems.length} items`}
            </Typography>
          </Box>

          {/* Items grid */}
          <ItemsContainer>
            {displayedItems.map((item) => (
                <Card key={item.id}
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    }
                  }}
                >
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
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {item.location}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CategoryIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {item.category}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Chip 
                        label={item.condition} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={item.isFree ? 'Free' : `$${item.price}`} 
                        size="small" 
                        color={item.isFree ? 'success' : 'default'} 
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      component={RouterLink} 
                      to={`/items/${item.id}`}
                      fullWidth
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
            ))}
          </ItemsContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}

          {/* No results */}
          {filteredItems.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', my: 8 }}>
              <Typography variant="h6" gutterBottom>
                No items found matching your criteria
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default BrowsePage;
