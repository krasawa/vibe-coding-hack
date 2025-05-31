import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Tooltip,
} from '@mui/material';
import { Add, PersonAdd, Check, Close, Group } from '@mui/icons-material';
import ChatIcon from '@mui/icons-material/Chat';
import { RootState, AppDispatch } from '../store';
import {
  getContacts,
  getContactRequests,
  sendContactRequest,
  acceptContactRequest,
  rejectContactRequest,
} from '../store/slices/contactSlice';
import { createOrGetPrivateChat } from '../store/slices/chatSlice';
import { useNavigate } from 'react-router-dom';
import CreateGroupChat from '../components/CreateGroupChat';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contact-tabpanel-${index}`}
      aria-labelledby={`contact-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [openAddContact, setOpenAddContact] = useState(false);
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [username, setUsername] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const { contacts, contactRequests, loading, error } = useSelector((state: RootState) => state.contact);
  const { loading: chatLoading } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getContacts());
    dispatch(getContactRequests());
  }, [dispatch]);

  const handleAddContactOpen = () => {
    setOpenAddContact(true);
  };

  const handleAddContactClose = () => {
    setOpenAddContact(false);
    setUsername('');
  };

  const handleCreateGroupOpen = () => {
    setOpenCreateGroup(true);
  };

  const handleCreateGroupClose = () => {
    setOpenCreateGroup(false);
  };

  const handleSendRequest = async () => {
    if (username.trim()) {
      await dispatch(sendContactRequest(username.trim()));
      handleAddContactClose();
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    await dispatch(acceptContactRequest(requestId));
  };

  const handleRejectRequest = async (requestId: string) => {
    await dispatch(rejectContactRequest(requestId));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGroupCreated = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleStartChat = async (contactId: string) => {
    try {
      const result = await dispatch(createOrGetPrivateChat(contactId)).unwrap();
      const chatId = result.data.chat.id;
      
      // Navigate to the chat
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  return (
    <Box sx={{ height: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Dashboard</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={handleAddContactOpen}
            sx={{ mr: 1 }}
          >
            Add Contact
          </Button>
          <Button
            variant="outlined"
            startIcon={<Group />}
            onClick={handleCreateGroupOpen}
          >
            Create Group
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="contact tabs">
          <Tab label="Contacts" id="contact-tab-0" aria-controls="contact-tabpanel-0" />
          <Tab 
            label={
              <Badge badgeContent={contactRequests.received.length} color="primary">
                Contact Requests
              </Badge>
            } 
            id="contact-tab-1" 
            aria-controls="contact-tabpanel-1" 
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : contacts.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No contacts yet. Add some contacts to start chatting!
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PersonAdd />}
              onClick={handleAddContactOpen}
              sx={{ mt: 2 }}
            >
              Add Contact
            </Button>
          </Box>
        ) : (
          <List>
            {contacts.map((contact) => (
              <React.Fragment key={contact.id}>
                <ListItem
                  secondaryAction={
                    <Tooltip title="Start chat">
                      <IconButton
                        edge="end"
                        aria-label="start chat"
                        onClick={() => handleStartChat(contact.id)}
                        disabled={chatLoading}
                        color="primary"
                      >
                        <ChatIcon />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={contact?.avatarUrl || ''}>
                      {((contact?.displayName || contact?.username) || '?')[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={contact?.displayName || contact?.username}
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color={contact?.isOnline ? 'success.main' : 'text.secondary'}
                        >
                          {contact?.isOnline ? 'Online' : 'Offline'}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : contactRequests.received.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No pending contact requests.
            </Typography>
          </Box>
        ) : (
          <List>
            {contactRequests.received.map((request) => (
              <React.Fragment key={request.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" aria-label="accept" onClick={() => handleAcceptRequest(request.id)}>
                        <Check color="success" />
                      </IconButton>
                      <IconButton edge="end" aria-label="reject" onClick={() => handleRejectRequest(request.id)}>
                        <Close color="error" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={request.sender?.avatarUrl || ''}>
                      {((request.sender?.displayName || request.sender?.username) || '?')[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={request.sender?.displayName || request.sender?.username}
                    secondary="Wants to connect with you"
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </TabPanel>

      {/* Add Contact Dialog */}
      <Dialog open={openAddContact} onClose={handleAddContactClose}>
        <DialogTitle>Add Contact</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the username of the person you want to add as a contact.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="username"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddContactClose}>Cancel</Button>
          <Button onClick={handleSendRequest} variant="contained">
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Group Chat */}
      <CreateGroupChat
        open={openCreateGroup}
        onClose={handleCreateGroupClose}
        onSuccess={handleGroupCreated}
      />
    </Box>
  );
};

export default Dashboard; 