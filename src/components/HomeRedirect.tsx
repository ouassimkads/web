import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (user) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return <Navigate to="/login" replace />;
}
