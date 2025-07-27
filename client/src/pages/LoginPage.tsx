import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Paper, 
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the redirect path from location state or default to home
  const from = (location.state as any)?.from?.pathname || '/';

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          mt: 8
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Welcome to Uphaar
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to start sharing gifts with your community
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ width: '100%', mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </Box>
        
        <Divider sx={{ width: '100%', my: 4 }} />
        
        <Typography variant="body2" color="text.secondary" align="center">
          By signing in, you agree to our{' '}
          <Typography component="a" href="/terms" color="primary" variant="body2">
            Terms of Service
          </Typography>{' '}
          and{' '}
          <Typography component="a" href="/privacy" color="primary" variant="body2">
            Privacy Policy
          </Typography>
        </Typography>
      </Paper>
    </Container>
  );
};

export default LoginPage;
