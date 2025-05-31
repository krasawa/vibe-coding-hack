import React, { useState, useEffect, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Avatar,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { RootState, AppDispatch } from '../store';
import { getContacts } from '../store/slices/contactSlice';
import axios from 'axios';

interface CreateGroupChatProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (chatId: string) => void;
}

const CreateGroupChat: React.FC<CreateGroupChatProps> = ({ open, onClose, onSuccess }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { contacts } = useSelector((state: RootState) => state.contact);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(getContacts());
  }, [dispatch]);

  const handleToggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedContacts.length < 2) {
      setError('Please select at least 2 contacts for a group chat');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/chats',
        {
          name: groupName,
          description,
          isGroup: true,
          participants: selectedContacts,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLoading(false);
      onSuccess(response.data.data.chat.id);
      handleClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to create group chat');
    }
  };

  const handleClose = () => {
    setGroupName('');
    setDescription('');
    setSelectedContacts([]);
    setError(null);
    onClose();
  };

  const handleGroupNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value);
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Group Chat</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TextField
          autoFocus
          margin="dense"
          label="Group Name"
          fullWidth
          value={groupName}
          onChange={handleGroupNameChange}
          disabled={loading}
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="dense"
          label="Description (optional)"
          fullWidth
          multiline
          rows={2}
          value={description}
          onChange={handleDescriptionChange}
          disabled={loading}
          sx={{ mb: 3 }}
        />
        
        <Typography variant="subtitle1">Select Participants:</Typography>
        
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {contacts.map((contact: any) => (
            <ListItem
              key={contact.id}
              button
              onClick={() => handleToggleContact(contact.id)}
              disabled={loading}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={selectedContacts.includes(contact.id)}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemIcon>
                <Avatar src={contact.avatarUrl}>
                  {(contact.displayName || contact.username)[0].toUpperCase()}
                </Avatar>
              </ListItemIcon>
              <ListItemText 
                primary={contact.displayName || contact.username}
                secondary={contact.isOnline ? 'Online' : 'Offline'} 
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateGroup}
          variant="contained"
          disabled={loading || !groupName.trim() || selectedContacts.length < 2}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGroupChat; 