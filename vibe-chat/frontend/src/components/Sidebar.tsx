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
} from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import { Search } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { getChats, setCurrentChat } from '../store/slices/chatSlice';

interface SidebarProps {
  onItemClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

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
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search..."
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
              <ListItemText primary="No chats found" />
            </ListItem>
          ) : (
            filteredChats.map((chat: any) => (
              <ListItem key={chat.id} disablePadding>
                <ListItemButton 
                  onClick={() => handleChatClick(chat)}
                  selected={location.pathname === `/chat/${chat.id}`}
                >
                  <Avatar 
                    src={chat.isGroup ? undefined : chat.participants[0]?.avatarUrl} 
                    alt={chat.name || chat.participants[0]?.username}
                    sx={{ mr: 2 }}
                  >
                    {(chat.name || chat.participants[0]?.username || '?')[0].toUpperCase()}
                  </Avatar>
                  <ListItemText 
                    primary={chat.name || chat.participants[0]?.displayName || chat.participants[0]?.username}
                    secondary={chat.lastMessage?.content || 'No messages yet'}
                    primaryTypographyProps={{
                      noWrap: true,
                    }}
                    secondaryTypographyProps={{
                      noWrap: true,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar; 