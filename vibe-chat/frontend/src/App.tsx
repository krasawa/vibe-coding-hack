import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Services
import socketService from './services/socketService';

// Store
import { RootState, AppDispatch } from './store';
import { getCurrentUser } from './store/slices/authSlice';
import { setCurrentUser } from './store/slices/chatSlice';

const App: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Check if user is authenticated with token but user data is not loaded
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser());
    }
    
    // Set current user ID in chat slice
    if (user) {
      dispatch(setCurrentUser({ id: user.id }));
    }
  }, [isAuthenticated, user, dispatch]);

  useEffect(() => {
    // Initialize socket connection when authenticated
    if (isAuthenticated) {
      socketService.init();
    } else {
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        
        {/* Redirect and 404 */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
};

export default App; 