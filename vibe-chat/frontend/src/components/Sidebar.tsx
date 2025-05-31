import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  Button,
} from '@mui/material';
import Stack from '@mui/material/Stack';
import ListItemButton from '@mui/material/ListItemButton';
import { Search, Group } from '@mui/icons-material';
import ChatIcon from '@mui/icons-material/Chat';
import { RootState, AppDispatch } from '../store';
import { getChats, setCurrentChat } from '../store/slices/chatSlice';
import StartChatDialog from './StartChatDialog';
import CreateGroupChat from './CreateGroupChat';

interface SidebarProps {
  onItemClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startChatOpen, setStartChatOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const { chats } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    dispatch(getChats());
  }, [dispatch]);
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleChatClick = (chat: any) => {
    dispatch(setCurrentChat(chat));
    navigate(`/chat/${chat.id}`);
    if (onItemClick) onItemClick();
  };

  const handleGroupCreated = (chatId: string) => {
    dispatch(getChats()); // Refresh the chat list
    navigate(`/chat/${chatId}`);
    if (onItemClick) onItemClick();
  };
  
  // Filter chats based on search term
  const filteredChats = chats.filter(chat => {
    const chatName = chat.name || '';
    const participantNames = chat.participants
      .map((p: any) => p.displayName || p.username)
      .join(' ');
    return (
      chatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participantNames.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Vibe Chat
        </Typography>
        
        {/* Action Buttons */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ChatIcon />}
            onClick={() => setStartChatOpen(true)}
            sx={{ flex: 1 }}
          >
            New Chat
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Group />}
            onClick={() => setCreateGroupOpen(true)}
            sx={{ flex: 1 }}
          >
            New Group
          </Button>
        </Stack>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search chats..."
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Divider />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {filteredChats.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary={searchTerm ? "No chats match your search" : "No chats yet"} 
                secondary={!searchTerm ? "Start a new chat or create a group to begin messaging" : undefined}
              />
            </ListItem>
          ) : (
            filteredChats.map((chat: any) => (
              <ListItem key={chat.id} disablePadding>
                <ListItemButton 
                  onClick={() => handleChatClick(chat)}
                  selected={location.pathname === `/chat/${chat.id}`}
                >
                  <Avatar 
                    src={chat.isGroup ? chat.avatarUrl : chat.participants.find((p: any) => p.id !== chat.currentUserId)?.avatarUrl} 
                    alt={chat.name || chat.participants.find((p: any) => p.id !== chat.currentUserId)?.username}
                    sx={{ mr: 2 }}
                  >
                    {chat.isGroup 
                      ? (chat.name?.[0] || 'G').toUpperCase()
                      : (chat.participants.find((p: any) => p.id !== chat.currentUserId)?.displayName?.[0] || 
                         chat.participants.find((p: any) => p.id !== chat.currentUserId)?.username?.[0] || 'U').toUpperCase()}
                  </Avatar>
                  <ListItemText 
                    primary={
                      chat.isGroup 
                        ? chat.name 
                        : chat.participants.find((p: any) => p.id !== chat.currentUserId)?.displayName || 
                          chat.participants.find((p: any) => p.id !== chat.currentUserId)?.username
                    }
                    secondary={chat.lastMessage?.content || 'No messages yet'}
                    primaryTypographyProps={{
                      noWrap: true,
                    }}
                    secondaryTypographyProps={{
                      noWrap: true,
                    }}
                  />
                  {chat.unreadCount > 0 && (
                    <Box
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        borderRadius: '50%',
                        minWidth: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        ml: 1,
                      }}
                    >
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Box>

      {/* Dialogs */}
      <StartChatDialog
        open={startChatOpen}
        onClose={() => setStartChatOpen(false)}
      />
      
      <CreateGroupChat
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onSuccess={handleGroupCreated}
      />
    </Box>
  );
};

export default Sidebar; 