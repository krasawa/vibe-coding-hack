import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  Divider,
  Alert,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Save from '@mui/icons-material/Save';
import Lock from '@mui/icons-material/Lock';
import { RootState, AppDispatch } from '../store';
import { updateUserProfile, changePassword } from '../store/slices/authSlice';

const Profile: React.FC = () => {
  const { user, loading, error } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setAvatar(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    const profileData: { displayName?: string; avatar?: File } = {};
    
    if (displayName !== user?.displayName) {
      profileData.displayName = displayName;
    }
    
    if (avatar) {
      profileData.avatar = avatar;
    }
    
    if (Object.keys(profileData).length > 0) {
      try {
        await dispatch(updateUserProfile(profileData)).unwrap();
        setSuccessMessage('Profile updated successfully');
      } catch (err) {
        // Error is handled by the reducer
      }
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      await dispatch(changePassword({ 
        currentPassword, 
        newPassword 
      })).unwrap();
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setSuccessMessage('Password changed successfully');
    } catch (err) {
      // Error is handled by the reducer
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Your Profile
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <form onSubmit={handleProfileSubmit}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={avatarPreview || user?.avatarUrl}
                  sx={{ width: 120, height: 120, mb: 1 }}
                >
                  {user?.displayName?.[0] || user?.username?.[0]}
                </Avatar>
                <input
                  accept="image/*"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="avatar-input"
                />
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'white',
                  }}
                >
                  <PhotoCamera />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click the camera icon to change your avatar
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Username"
                value={user?.username || ''}
                margin="normal"
                disabled
                helperText="Username cannot be changed"
              />
              
              <TextField
                fullWidth
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                margin="normal"
              />
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<Save />}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                Save Changes
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Security</Typography>
          {!showPasswordForm && (
            <Button
              variant="outlined"
              startIcon={<Lock />}
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </Button>
          )}
        </Box>
        
        {showPasswordForm && (
          <>
            {passwordError && <Alert severity="error" sx={{ mb: 3 }}>{passwordError}</Alert>}
            
            <form onSubmit={handlePasswordSubmit}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
              />
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  Update Password
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordError(null);
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </form>
          </>
        )}
      </Paper>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={successMessage}
      />
    </Box>
  );
};

export default Profile; 