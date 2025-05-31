import React, { useState } from 'react';
import { Box, IconButton, Menu, MenuItem, Typography, Tooltip, Badge } from '@mui/material';
import { EmojiEmotions } from '@mui/icons-material';
import axios from 'axios';

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
  };
}

interface Message {
  id: string;
  reactions: Reaction[];
  senderId: string;
  [key: string]: any; // Allow additional properties
}

interface MessageReactionsProps {
  messageId?: string;
  reactions?: Reaction[];
  message?: Message;
  currentUserId: string;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageReactions: React.FC<MessageReactionsProps> = ({ messageId, reactions, message, currentUserId }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Use either direct props or extract from message object
  const actualMessageId = messageId || (message?.id || '');
  const actualReactions = reactions || (message?.reactions || []);

  const handleOpenEmojiMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseEmojiMenu = () => {
    setAnchorEl(null);
  };

  const handleAddReaction = async (emoji: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/messages/${actualMessageId}/reactions`,
        { emoji },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      handleCloseEmojiMenu();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Count reactions by emoji
  const reactionCounts: { [emoji: string]: { count: number; users: string[] } } = {};
  actualReactions.forEach((reaction) => {
    if (!reactionCounts[reaction.emoji]) {
      reactionCounts[reaction.emoji] = { count: 0, users: [] };
    }
    reactionCounts[reaction.emoji].count++;
    reactionCounts[reaction.emoji].users.push(reaction.user.displayName || reaction.user.username);
  });

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
      {/* Display reaction counts */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mr: 1 }}>
        {Object.entries(reactionCounts).map(([emoji, { count, users }]) => (
          <Tooltip
            key={emoji}
            title={users.join(', ')}
            arrow
          >
            <Badge
              badgeContent={count}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.6rem',
                  height: '16px',
                  minWidth: '16px',
                },
              }}
            >
              <Box
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  px: 0.8,
                  py: 0.2,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
                onClick={() => handleAddReaction(emoji)}
              >
                <Typography variant="body2">{emoji}</Typography>
              </Box>
            </Badge>
          </Tooltip>
        ))}
      </Box>

      {/* Add reaction button */}
      <IconButton
        size="small"
        onClick={handleOpenEmojiMenu}
        sx={{ p: 0.5 }}
      >
        <EmojiEmotions fontSize="small" />
      </IconButton>

      {/* Emoji menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseEmojiMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Box sx={{ display: 'flex', p: 1 }}>
          {EMOJI_LIST.map((emoji) => (
            <IconButton
              key={emoji}
              onClick={() => handleAddReaction(emoji)}
              sx={{ p: 0.5 }}
            >
              <Typography variant="body1">{emoji}</Typography>
            </IconButton>
          ))}
        </Box>
      </Menu>
    </Box>
  );
};

export default MessageReactions; 