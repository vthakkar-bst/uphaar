import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[200]
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Uphaar - Gift Sharing Platform
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            mt: { xs: 2, sm: 0 }
          }}>
            <Link component={RouterLink} to="/about" color="inherit">
              About
            </Link>
            <Link component={RouterLink} to="/privacy" color="inherit">
              Privacy
            </Link>
            <Link component={RouterLink} to="/terms" color="inherit">
              Terms
            </Link>
            <Link component={RouterLink} to="/contact" color="inherit">
              Contact
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
