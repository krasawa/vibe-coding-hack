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
  Box,
  Tab,
  Tabs,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { RootState, AppDispatch } from '../store';
import { getContacts } from '../store/slices/contactSlice';
import axios from 'axios';

interface EditGroupChatProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
  currentName: string;
  currentDescription: string;
  currentParticipants: any[];
  isOwner: boolean;
  onSuccess: () => void;
  onDelete?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`group-tabpanel-${index}`}
      aria-labelledby={`group-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EditGroupChat: React.FC<EditGroupChatProps> = ({ 
  open, 
  onClose, 
  chatId,
  currentName,
  currentDescription,
  currentParticipants,
  isOwner,
  onSuccess,
  onDelete 
}) => {
  const [groupName, setGroupName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || '');
  const [participantsToAdd, setParticipantsToAdd] = useState<string[]>([]);
  const [participantsToRemove, setParticipantsToRemove] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { contacts } = useSelector((state: RootState) => state.contact);
  const dispatch = useDispatch<AppDispatch>();

  // Filter out contacts who are already participants
  const availableContacts = contacts.filter(
    (contact) => !currentParticipants.some((p) => p.id === contact.id)
  );

  useEffect(() => {
    dispatch(getContacts());
  }, [dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleToggleAddContact = (contactId: string) => {
    setParticipantsToAdd((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleToggleRemoveContact = (contactId: string) => {
    setParticipantsToRemove((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleUpdateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/chats/${chatId}`,
        {
          name: groupName,
          description,
          addParticipants: participantsToAdd,
          removeParticipants: participantsToRemove,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLoading(false);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to update group chat');
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLoading(false);
      if (onDelete) onDelete();
      handleClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to delete group chat');
    }
  };

  const handleLeaveGroup = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/chats/${chatId}/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLoading(false);
      if (onDelete) onDelete();
      handleClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to leave group chat');
    }
  };

  const handleClose = () => {
    setGroupName(currentName);
    setDescription(currentDescription || '');
    setParticipantsToAdd([]);
    setParticipantsToRemove([]);
    setError(null);
    setTabValue(0);
    setDeleteConfirm(false);
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
      <DialogTitle>
        {isOwner ? 'Edit Group Chat' : 'Group Settings'}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="group chat tabs"
          >
            <Tab label="Info" id="group-tab-0" />
            {isOwner && <Tab label="Add Members" id="group-tab-1" />}
            {isOwner && <Tab label="Remove Members" id="group-tab-2" />}
            <Tab label="Leave / Delete" id="group-tab-3" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={groupName}
            onChange={handleGroupNameChange}
            disabled={loading || !isOwner}
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
            disabled={loading || !isOwner}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle1" gutterBottom>
            Current Participants: {currentParticipants.length}
          </Typography>
          
          <List sx={{ maxHeight: 200, overflow: 'auto' }}>
            {currentParticipants.map((participant) => (
              <ListItem key={participant.id}>
                <ListItemIcon>
                  <Avatar src={participant.avatarUrl}>
                    {(participant.displayName || participant.username)[0].toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText 
                  primary={participant.displayName || participant.username}
                  secondary={participant.isOwner ? 'Owner' : ''}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
        
        {isOwner && (
          <TabPanel value={tabValue} index={1}>
            <Typography variant="subtitle1" gutterBottom>
              Add Participants:
            </Typography>
            
            {availableContacts.length === 0 ? (
              <Alert severity="info">No more contacts to add</Alert>
            ) : (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {availableContacts.map((contact) => (
                  <ListItem
                    key={contact.id}
                    button
                    onClick={() => handleToggleAddContact(contact.id)}
                    disabled={loading}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={participantsToAdd.includes(contact.id)}
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
            )}
          </TabPanel>
        )}
        
        {isOwner && (
          <TabPanel value={tabValue} index={2}>
            <Typography variant="subtitle1" gutterBottom>
              Remove Participants:
            </Typography>
            
            {currentParticipants.length <= 1 ? (
              <Alert severity="info">You cannot remove all participants</Alert>
            ) : (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {currentParticipants.filter(p => !p.isOwner).map((participant) => (
                  <ListItem
                    key={participant.id}
                    button
                    onClick={() => handleToggleRemoveContact(participant.id)}
                    disabled={loading}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="remove"
                        onClick={() => handleToggleRemoveContact(participant.id)}
                      >
                        <PersonRemoveIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={participantsToRemove.includes(participant.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemIcon>
                      <Avatar src={participant.avatarUrl}>
                        {(participant.displayName || participant.username)[0].toUpperCase()}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={participant.displayName || participant.username}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>
        )}
        
        <TabPanel value={tabValue} index={isOwner ? 3 : 1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!isOwner && (
              <>
                <Typography variant="body1" color="error" gutterBottom>
                  If you leave this group, you'll need to be added back by an admin to rejoin.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleLeaveGroup}
                  disabled={loading}
                  startIcon={<PersonRemoveIcon />}
                >
                  Leave Group
                </Button>
              </>
            )}
            
            {isOwner && (
              <>
                <Typography variant="body1" color="error" gutterBottom>
                  Deleting this group will permanently remove all messages and cannot be undone.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteGroup}
                  disabled={loading}
                  startIcon={<DeleteIcon />}
                >
                  {deleteConfirm ? 'Confirm Delete' : 'Delete Group'}
                </Button>
              </>
            )}
          </Box>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {(isOwner && tabValue !== 3) && (
          <Button
            onClick={handleUpdateGroup}
            variant="contained"
            disabled={loading || !groupName.trim() || 
              (participantsToAdd.length === 0 && participantsToRemove.length === 0 && 
              groupName === currentName && description === currentDescription)}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Group'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EditGroupChat; 