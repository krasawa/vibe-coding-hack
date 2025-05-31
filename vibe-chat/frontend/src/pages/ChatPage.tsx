import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Send, AttachFile, Close } from '@mui/icons-material';
import { format } from 'date-fns';
import { RootState, AppDispatch } from '../store';
import { getChat, getChatMessages, sendMessage } from '../store/slices/chatSlice';
import socketService from '../services/socketService';
import MessageReactions from '../components/MessageReactions';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeoutId, setTypingTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { currentChat, messages, loading, error, typingUsers } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (chatId) {
      dispatch(getChat(chatId));
      dispatch(getChatMessages({ chatId }));
      
      // Join the chat room via socket
      socketService.joinChat(chatId);
      
      // Mark messages as read
      messages.forEach((msg: any) => {
        if (msg.senderId !== user?.id && !msg.readBy.includes(user?.id || '')) {
          socketService.markMessageAsRead(msg.id);
        }
      });
      
      // Leave the chat room when component unmounts
      return () => {
        if (chatId) {
          socketService.leaveChat(chatId);
        }
      };
    }
  }, [dispatch, chatId, user?.id]);

  // Mark new messages as read
  useEffect(() => {
    if (user?.id && messages.length > 0) {
      messages.forEach((msg: any) => {
        if (msg.senderId !== user.id && !msg.readBy.includes(user.id)) {
          socketService.markMessageAsRead(msg.id);
        }
      });
    }
  }, [messages, user?.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatId && (message.trim() || image)) {
      await dispatch(sendMessage({ chatId, content: message, image: image || undefined }));
      setMessage('');
      setImage(null);
      
      // Clear typing indicator
      if (isTyping) {
        setIsTyping(false);
        socketService.sendTyping(chatId, false);
      }
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Handle typing indicator
    if (chatId) {
      if (!isTyping) {
        setIsTyping(true);
        socketService.sendTyping(chatId, true);
      }
      
      // Clear previous timeout
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }
      
      // Set new timeout to stop typing indicator after 2 seconds of inactivity
      const newTimeoutId = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          socketService.sendTyping(chatId, false);
        }
      }, 2000);
      
      setTypingTimeoutId(newTimeoutId);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  const handleClickAttach = () => {
    fileInputRef.current?.click();
  };

  if (!chatId || !currentChat) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Typography variant="body1" color="text.secondary">
            Select a chat to start messaging
          </Typography>
        )}
      </Box>
    );
  }

  // Get typing users excluding current user
  const currentTypingUsers = chatId && typingUsers[chatId] 
    ? typingUsers[chatId].filter((id: string) => id !== user?.id)
    : [];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={
              currentChat.isGroup
                ? undefined
                : currentChat.participants.find((p: any) => p.id !== user?.id)?.avatarUrl
            }
          >
            {(currentChat.name ||
              currentChat.participants.find((p: any) => p.id !== user?.id)?.displayName ||
              '?')[0].toUpperCase()}
          </Avatar>
          <Box sx={{ ml: 2 }}>
            <Typography variant="h6">
              {currentChat.name ||
                currentChat.participants.find((p: any) => p.id !== user?.id)?.displayName ||
                currentChat.participants.find((p: any) => p.id !== user?.id)?.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentChat.isGroup
                ? `${currentChat.participants.length} participants`
                : currentChat.participants.find((p: any) => p.id !== user?.id)?.isOnline
                ? 'Online'
                : 'Offline'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Error Message */}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Messages Area */}
      <Box
        sx={{
          p: 2,
          flexGrow: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.senderId === user?.id ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: msg.senderId === user?.id ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                }}
              >
                {msg.senderId !== user?.id && (
                  <Avatar
                    src={msg.sender.avatarUrl}
                    sx={{ width: 30, height: 30, mr: 1 }}
                  >
                    {(msg.sender.displayName || msg.sender.username)[0].toUpperCase()}
                  </Avatar>
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    maxWidth: '70%',
                    backgroundColor: msg.senderId === user?.id ? 'primary.light' : 'background.paper',
                    color: msg.senderId === user?.id ? 'white' : 'inherit',
                  }}
                >
                  {msg.imageUrl && (
                    <Box sx={{ mb: 1 }}>
                      <img
                        src={msg.imageUrl}
                        alt="Shared"
                        style={{ maxWidth: '100%', borderRadius: 4 }}
                      />
                    </Box>
                  )}
                  <Typography variant="body1">{msg.content}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="caption" color={msg.senderId === user?.id ? 'white' : 'text.secondary'}>
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </Typography>
                    {msg.senderId === user?.id && (
                      <Typography variant="caption" color={msg.senderId === user?.id ? 'white' : 'text.secondary'}>
                        {msg.readBy.length > 0 ? 'Read' : 'Sent'}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Add message reactions */}
                  {user?.id && (
                    <MessageReactions
                      messageId={msg.id}
                      reactions={msg.reactions || []}
                      currentUserId={user.id}
                    />
                  )}
                </Paper>
              </Box>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
        
        {/* Typing indicator */}
        {currentTypingUsers.length > 0 && (
          <Box sx={{ p: 1, pl: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {currentTypingUsers.length === 1
                ? 'Someone is typing...'
                : 'Several people are typing...'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        {image && (
          <Box sx={{ mb: 1, p: 1, border: '1px dashed grey', borderRadius: 1 }}>
            <Typography variant="body2">File: {image.name}</Typography>
            <IconButton size="small" onClick={() => setImage(null)}>
              <Typography variant="caption" color="error">
                Remove
              </Typography>
            </IconButton>
          </Box>
        )}
        <form onSubmit={handleSendMessage}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleClickAttach}>
              <AttachFile />
            </IconButton>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              accept="image/*"
            />
            <TextField
              fullWidth
              placeholder="Type a message..."
              variant="outlined"
              size="small"
              value={message}
              onChange={handleMessageChange}
              sx={{ ml: 1 }}
            />
            <IconButton color="primary" type="submit" disabled={!message.trim() && !image} sx={{ ml: 1 }}>
              <Send />
            </IconButton>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default ChatPage; 