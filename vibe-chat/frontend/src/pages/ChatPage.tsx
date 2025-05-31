import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tooltip,
} from '@mui/material';
import { Send as SendIcon, AttachFile as AttachFileIcon, Close as CloseIcon } from '@mui/icons-material';
import SettingsIcon from '@mui/icons-material/Settings';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { format } from 'date-fns';
import { RootState, AppDispatch } from '../store';
import { getChat, getChatMessages, sendMessage, markChatAsRead } from '../store/slices/chatSlice';
import socketService from '../services/socketService';
import MessageReactions from '../components/MessageReactions';
import EditGroupChat from '../components/EditGroupChat';

// Function to format message content with HTML tags
const formatMessage = (content: string) => {
  if (!content) return '';
  
  // Replace **text** with <strong>text</strong> for bold
  let formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace *text* or _text_ with <em>text</em> for italic
  formattedContent = formattedContent.replace(/(\*|_)(.*?)(\*|_)/g, '<em>$2</em>');
  
  return formattedContent;
};

// Function to parse HTML content safely
const parseHTML = (html: string) => {
  return { __html: html };
};

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeoutId, setTypingTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const navigate = useNavigate();

  const { currentChat, messages, loading, error, typingUsers } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  // Filter typing users to exclude current user
  const currentTypingUsers = chatId && typingUsers[chatId] 
    ? typingUsers[chatId].filter(id => id !== user?.id)
    : [];

  // Get typing user names from chat participants
  const typingUserNames = currentTypingUsers
    .map(userId => {
      const participant = currentChat?.participants.find((p: any) => p.id === userId);
      return participant?.displayName || participant?.username || 'Someone';
    })
    .filter(name => name !== 'Someone'); // Filter out any unresolved names

  useEffect(() => {
    if (chatId) {
      // Ensure socket is connected
      if (!socketService.isConnected()) {
        socketService.init();
      }
      
      dispatch(getChat(chatId));
      dispatch(getChatMessages({ chatId }));
      dispatch(markChatAsRead(chatId));
      
      // Join the chat room via socket
      socketService.joinChat(chatId);
      
      // Leave the chat room when component unmounts
      return () => {
        if (chatId) {
          socketService.leaveChat(chatId);
        }
      };
    }
  }, [dispatch, chatId]);

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

  // Add format text functions
  const insertFormat = (format: string) => {
    if (!messageInputRef.current) return;
    
    const input = messageInputRef.current;
    const { selectionStart, selectionEnd } = input;
    const selectedText = message.substring(selectionStart, selectionEnd);
    
    let formattedText = '';
    if (format === 'bold') {
      formattedText = `**${selectedText || 'bold text'}**`;
    } else if (format === 'italic') {
      formattedText = `_${selectedText || 'italic text'}_`;
    }
    
    const newMessage = 
      message.substring(0, selectionStart) + 
      formattedText + 
      message.substring(selectionEnd);
    
    setMessage(newMessage);
    
    // Focus back on input after inserting format
    setTimeout(() => {
      input.focus();
      // Place cursor after the inserted formatted text
      const newCursorPosition = selectionStart + formattedText.length;
      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // Check if the current user is the group owner
  const isGroupOwner = () => {
    if (!currentChat || !currentChat.isGroup || !user) return false;
    
    // Find the current user in participants and check if they're the owner
    // Use explicit casting to avoid type errors
    const currentUserParticipant = currentChat.participants.find(
      (p: any) => p.id === user.id
    );
    
    // The isOwner field might be added by the backend but not in the TypeScript interface
    return Boolean(currentUserParticipant && currentUserParticipant.isOwner);
  };

  // Handle group chat deleted or left
  const handleGroupExited = () => {
    navigate('/');
  };

  // Handle back button click
  const handleBackToDashboard = () => {
    navigate('/');
  };

  if (!chatId || !currentChat) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Back to Dashboard">
            <IconButton
              onClick={handleBackToDashboard}
              sx={{ mr: 1 }}
              color="primary"
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Avatar
            src={currentChat.isGroup ? 
              (currentChat as any).avatarUrl : 
              currentChat.participants.find((p: any) => p.id !== user?.id)?.avatarUrl}
            sx={{ mr: 2 }}
          >
            {(currentChat.name ||
              currentChat.participants.find((p: any) => p.id !== user?.id)?.displayName ||
              '?')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" noWrap>
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
        
        {currentChat.isGroup && (
          <IconButton
            color="primary"
            aria-label="group settings"
            onClick={() => setEditGroupOpen(true)}
          >
            <SettingsIcon />
          </IconButton>
        )}
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.map((msg: any) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: msg.senderId === user?.id ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: msg.senderId === user?.id ? 'primary.light' : 'background.paper',
                color: msg.senderId === user?.id ? 'primary.contrastText' : 'text.primary',
              }}
            >
              {!currentChat.isGroup || msg.senderId === user?.id ? null : (
                <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                  {msg.sender?.displayName || msg.sender?.username}
                </Typography>
              )}
              
              {msg.imageUrl && (
                <Box sx={{ mb: 1 }}>
                  <img
                    src={msg.imageUrl}
                    alt="Message attachment"
                    style={{ maxWidth: '100%', borderRadius: 4 }}
                  />
                </Box>
              )}
              
              <Typography
                variant="body1"
                dangerouslySetInnerHTML={parseHTML(formatMessage(msg.content))}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" color="inherit" sx={{ opacity: 0.7 }}>
                  {format(new Date(msg.createdAt), 'HH:mm')}
                </Typography>
                
                {msg.readBy && msg.readBy.length > 0 && msg.senderId === user?.id && (
                  <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                    Read
                  </Typography>
                )}
              </Box>
            </Paper>
            
            <MessageReactions
              message={msg}
              currentUserId={user?.id || ''}
            />
          </Box>
        ))}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Typing Indicator */}
      {currentTypingUsers.length > 0 && (
        <Box sx={{ 
          px: 2, 
          py: 1,
          mx: 2,
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          <Box sx={{
            display: 'flex',
            gap: 0.5,
          }}>
            {/* Animated typing dots */}
            {[0, 1, 2].map((dot) => (
              <Box
                key={dot}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: 'text.secondary',
                  animation: 'typing 1.4s infinite ease-in-out',
                  animationDelay: `${dot * 0.2}s`,
                  '@keyframes typing': {
                    '0%, 80%, 100%': {
                      opacity: 0.3,
                      transform: 'scale(0.8)',
                    },
                    '40%': {
                      opacity: 1,
                      transform: 'scale(1)',
                    },
                  },
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {typingUserNames.length === 1 
              ? `${typingUserNames[0]} is typing...`
              : typingUserNames.length === 2
              ? `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`
              : typingUserNames.length > 2
              ? `${typingUserNames[0]}, ${typingUserNames[1]} and ${typingUserNames.length - 2} others are typing...`
              : 'Someone is typing...'
            }
          </Typography>
        </Box>
      )}

      {/* Message Input */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: 'background.paper',
        }}
      >
        {image && (
          <Box
            sx={{
              mb: 2,
              p: 1,
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
              {image.name}
            </Typography>
            <IconButton size="small" onClick={() => setImage(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            value={message}
            onChange={handleMessageChange}
            inputRef={messageInputRef}
            InputProps={{
              startAdornment: (
                <Box sx={{ display: 'flex', mr: 1 }}>
                  <Tooltip title="Bold">
                    <IconButton size="small" onClick={() => insertFormat('bold')}>
                      <FormatBoldIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Italic">
                    <IconButton size="small" onClick={() => insertFormat('italic')}>
                      <FormatItalicIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            }}
          />
          
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          
          <IconButton onClick={handleClickAttach}>
            <AttachFileIcon />
          </IconButton>
          
          <IconButton type="submit" color="primary" disabled={!message.trim() && !image}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Edit Group Chat Dialog */}
      {currentChat && currentChat.isGroup && (
        <EditGroupChat
          open={editGroupOpen}
          onClose={() => setEditGroupOpen(false)}
          chatId={currentChat.id}
          currentName={currentChat.name || ''}
          currentDescription={currentChat.description || ''}
          currentParticipants={currentChat.participants}
          isOwner={isGroupOwner()}
          onSuccess={() => dispatch(getChat(chatId))}
          onDelete={handleGroupExited}
        />
      )}
    </Box>
  );
};

export default ChatPage; 