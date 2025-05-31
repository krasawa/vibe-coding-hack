import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { RootState, AppDispatch } from '../store';
import { getContacts } from '../store/slices/contactSlice';
import { createOrGetPrivateChat } from '../store/slices/chatSlice';

interface StartChatDialogProps {
  open: boolean;
  onClose: () => void;
}

const StartChatDialog: React.FC<StartChatDialogProps> = ({ open, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { contacts } = useSelector((state: RootState) => state.contact);
  const { loading, error } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      dispatch(getContacts());
    }
  }, [dispatch, open]);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact) =>
    (contact.displayName || contact.username)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleStartChat = async (contactId: string) => {
    try {
      const result = await dispatch(createOrGetPrivateChat(contactId)).unwrap();
      const chatId = result.data.chat.id;
      onClose();
      
      // Navigate to the chat
      navigate(`/chat/${chatId}`);
    } catch (err) {
      // Error is handled by the reducer
      console.error('Failed to start chat:', err);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Start New Chat</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TextField
          fullWidth
          placeholder="Search contacts..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        {contacts.length === 0 ? (
          <Alert severity="info">
            No contacts found. Add some contacts first to start chatting!
          </Alert>
        ) : filteredContacts.length === 0 ? (
          <Alert severity="info">
            No contacts match your search.
          </Alert>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredContacts.map((contact) => (
              <ListItem
                key={contact.id}
                button
                onClick={() => handleStartChat(contact.id)}
                disabled={loading}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon>
                  <Avatar src={contact.avatarUrl}>
                    {(contact.displayName || contact.username)[0].toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText 
                  primary={contact.displayName || contact.username}
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {contact.isOnline ? (
                        <span style={{ color: 'green' }}>● Online</span>
                      ) : (
                        'Offline'
                      )}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StartChatDialog; 