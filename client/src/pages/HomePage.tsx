import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardMedia,
  Container,
  Paper,
  styled
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import PeopleIcon from '@mui/icons-material/People';
import RecyclingIcon from '@mui/icons-material/Recycling';
import { useAuth } from '../context/AuthContext';

// Styled components for layout
const FeatureContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(4),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(1, 1fr)'
  }
}));

const FeatureItem = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center'
});

const HeroContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing(4),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr'
  }
}));

const TestimonialContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(1, 1fr)'
  }
}));

const CallToActionContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: theme.spacing(4),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr'
  }
}));

const CenteredBox = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  width: '100%'
});

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();

  const features = [
    {
      icon: <CardGiftcardIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Share Your Gifts',
      description: 'Easily share items you no longer need with people in your community who can use them.'
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Build Community',
      description: 'Connect with neighbors and build stronger community bonds through the act of giving.'
    },
    {
      icon: <RecyclingIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Reduce Waste',
      description: 'Help the environment by extending the lifecycle of items instead of discarding them.'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <Paper 
        sx={{ 
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'url(https://source.unsplash.com/random?gift)',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.6)',
          }}
        />
        <HeroContainer>
          <Box
            sx={{
              position: 'relative',
              p: { xs: 3, md: 6 },
              pr: { md: 0 },
              minHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Typography component="h1" variant="h3" color="inherit" gutterBottom>
              Share Gifts, Build Community
            </Typography>
            <Typography variant="h5" color="inherit" paragraph>
              A platform for your community to share items freely or at nominal costs.
              Connect with neighbors, reduce waste, and spread joy.
            </Typography>
            <Box sx={{ mt: 3 }}>
              {currentUser ? (
                <Button 
                  variant="contained" 
                  size="large" 
                  component={RouterLink} 
                  to="/browse"
                >
                  Browse Gifts
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  size="large" 
                  component={RouterLink} 
                  to="/login"
                >
                  Join Now
                </Button>
              )}
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box
              component="img"
              src="/images/gift-illustration.png"
              alt="Gift illustration"
              sx={{ width: '100%', maxHeight: 300, objectFit: 'contain' }}
            />
          </Box>
        </HeroContainer>
      </Paper>

      {/* Features Section */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          How It Works
        </Typography>
        <FeatureContainer sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <FeatureItem key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 3
                }}
              >
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <CardContent>
                  <Typography gutterBottom variant="h5" component="h3">
                    {feature.title}
                  </Typography>
                  <Typography>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </FeatureItem>
          ))}
        </FeatureContainer>
      </Container>

      {/* Call to Action */}
      <Box sx={{ bgcolor: 'primary.light', py: 6, mt: 6 }}>
        <Container>
          <CallToActionContainer alignItems="center">
            <Box>
              <Typography variant="h4" component="h2" align="center" gutterBottom>
                Ready to start sharing?
              </Typography>
              <Typography variant="h6" align="center" paragraph>
                Join our community today and start sharing items you no longer need.
              </Typography>
            </Box>
            <CenteredBox>
              {currentUser ? (
                <Button 
                  variant="contained" 
                  size="large" 
                  component={RouterLink} 
                  to="/items/new"
                >
                  Share an Item
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  size="large" 
                  component={RouterLink} 
                  to="/login"
                >
                  Sign Up Now
                </Button>
              )}
            </CenteredBox>
          </CallToActionContainer>
        </Container>
      </Box>
    </>
  );
};

export default HomePage;
