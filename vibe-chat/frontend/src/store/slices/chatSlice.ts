import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: Date;
  isOwner?: boolean;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  chatId: string;
  imageUrl?: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  reactions: Reaction[];
}

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
  };
}

interface Chat {
  id: string;
  name?: string;
  description?: string;
  isGroup: boolean;
  participants: User[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  avatarUrl?: string;
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  currentUserId: string | null;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
  loading: boolean;
  error: string | null;
  typingUsers: { [key: string]: string[] }; // chatId -> userIds[]
}

const initialState: ChatState = {
  chats: [],
  currentChat: null,
  messages: [],
  currentUserId: null,
  pagination: {
    page: 1,
    limit: 50,
    totalPages: 0,
    totalResults: 0,
  },
  loading: false,
  error: null,
  typingUsers: {},
};

// Get all chats
export const getChats = createAsyncThunk('chat/getChats', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('No token found');
    }

    const response = await axios.get('/api/chats', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch chats');
  }
});

// Get a single chat
export const getChat = createAsyncThunk('chat/getChat', async (chatId: string, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('No token found');
    }

    const response = await axios.get(`/api/chats/${chatId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch chat');
  }
});

// Get messages for a chat
export const getChatMessages = createAsyncThunk(
  'chat/getChatMessages',
  async ({ chatId, page = 1, limit = 50 }: { chatId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await axios.get(`/api/chats/${chatId}/messages?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

// Send a message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { chatId, content, image }: { chatId: string; content: string; image?: File },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const formData = new FormData();
      formData.append('content', content);
      if (image) {
        formData.append('image', image);
      }

      const response = await axios.post(`/api/messages/${chatId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

// Add reaction to a message
export const addReaction = createAsyncThunk(
  'chat/addReaction',
  async ({ messageId, emoji }: { messageId: string; emoji: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await axios.post(
        `/api/messages/${messageId}/reactions`,
        { emoji },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add reaction');
    }
  }
);

// Create or get private chat
export const createOrGetPrivateChat = createAsyncThunk(
  'chat/createOrGetPrivateChat',
  async (participantId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await axios.post(
        '/api/chats/direct',
        { userId: participantId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create or get private chat');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentChat: (state, action: PayloadAction<Chat | null>) => {
      state.currentChat = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      
      // Add to messages list if it's for the current chat
      if (state.currentChat && message.chatId === state.currentChat.id) {
        // Avoid duplicates
        if (!state.messages.some(m => m.id === message.id)) {
          state.messages.push(message);
        }
      }
      
      // Update last message in chats list
      const chatIndex = state.chats.findIndex(c => c.id === message.chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        
        // Move this chat to the top of the list
        const chat = state.chats[chatIndex];
        state.chats.splice(chatIndex, 1);
        state.chats.unshift(chat);
      }
    },
    updateMessageReadStatus: (state, action: PayloadAction<{ messageId: string; userId: string }>) => {
      const { messageId, userId } = action.payload;
      
      // Update in messages list
      const messageIndex = state.messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1 && !state.messages[messageIndex].readBy.includes(userId)) {
        state.messages[messageIndex].readBy.push(userId);
      }
      
      // Update in last message of chats
      for (const chat of state.chats) {
        if (chat.lastMessage && chat.lastMessage.id === messageId) {
          if (!chat.lastMessage.readBy.includes(userId)) {
            chat.lastMessage.readBy.push(userId);
          }
        }
      }
    },
    addUserTyping: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      
      if (!state.typingUsers[chatId].includes(userId)) {
        state.typingUsers[chatId].push(userId);
      }
    },
    removeUserTyping: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      
      if (state.typingUsers[chatId]) {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(id => id !== userId);
        
        if (state.typingUsers[chatId].length === 0) {
          delete state.typingUsers[chatId];
        }
      }
    },
    setCurrentUser: (state, action: PayloadAction<{ id: string }>) => {
      // This will be used to track the current user's ID in the chat state
      // It's useful for determining if a message is from the current user
      state.currentUserId = action.payload.id;
    },
    markChatAsRead: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      const chatIndex = state.chats.findIndex(c => c.id === chatId);
      
      if (chatIndex !== -1) {
        state.chats[chatIndex].unreadCount = 0;
      }
    },
    addReactionToMessage: (state, action: PayloadAction<{ messageId: string; reaction: Reaction }>) => {
      const { messageId, reaction } = action.payload;
      
      // Update in messages list
      const messageIndex = state.messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        // Check if reaction already exists (shouldn't happen, but safety check)
        const existingReactionIndex = state.messages[messageIndex].reactions.findIndex(
          r => r.userId === reaction.userId && r.emoji === reaction.emoji
        );
        
        if (existingReactionIndex === -1) {
          state.messages[messageIndex].reactions.push(reaction);
        }
      }
    },
    removeReactionFromMessage: (state, action: PayloadAction<{ messageId: string; reactionId: string; userId: string; emoji: string }>) => {
      const { messageId, reactionId, userId, emoji } = action.payload;
      
      // Update in messages list
      const messageIndex = state.messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        state.messages[messageIndex].reactions = state.messages[messageIndex].reactions.filter(
          r => !(r.id === reactionId || (r.userId === userId && r.emoji === emoji))
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all chats
      .addCase(getChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChats.fulfilled, (state, action: PayloadAction<{ data: { chats: Chat[] } }>) => {
        state.loading = false;
        state.chats = action.payload.data.chats;
      })
      .addCase(getChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get a single chat
      .addCase(getChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChat.fulfilled, (state, action: PayloadAction<{ data: { chat: Chat } }>) => {
        state.loading = false;
        state.currentChat = action.payload.data.chat;
      })
      .addCase(getChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get chat messages
      .addCase(getChatMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getChatMessages.fulfilled,
        (state, action: PayloadAction<{ data: { messages: Message[] }; pagination: any }>) => {
          state.loading = false;
          state.messages = action.payload.data.messages.reverse();
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(getChatMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<{ data: { message: Message } }>) => {
        state.loading = false;
        const message = action.payload.data.message;
        
        // Add to messages list if it's for the current chat
        if (state.currentChat && message.chatId === state.currentChat.id) {
          // Avoid duplicates
          if (!state.messages.some(m => m.id === message.id)) {
            state.messages.push(message);
          }
        }
        
        // Update last message in chats list
        const chatIndex = state.chats.findIndex(c => c.id === message.chatId);
        if (chatIndex !== -1) {
          state.chats[chatIndex].lastMessage = message;
          
          // Move this chat to the top of the list
          const chat = state.chats[chatIndex];
          state.chats.splice(chatIndex, 1);
          state.chats.unshift(chat);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add reaction
      .addCase(addReaction.pending, (state) => {
        state.error = null;
      })
      .addCase(
        addReaction.fulfilled,
        (state, action) => {
          const { reaction, removed, emoji } = action.payload.data;
          const { messageId, userId } = (action as any).meta?.arg || {};
          
          if (removed && emoji) {
            // Remove reaction
            state.messages = state.messages.map(message => {
              if (message.id === messageId) {
                return {
                  ...message,
                  reactions: message.reactions.filter(
                    r => !(r.userId === userId && r.emoji === emoji)
                  ),
                };
              }
              return message;
            });
          } else if (reaction) {
            // Add reaction
            state.messages = state.messages.map(message => {
              if (message.id === reaction.messageId) {
                return {
                  ...message,
                  reactions: [...message.reactions, reaction],
                };
              }
              return message;
            });
          }
        }
      )
      .addCase(addReaction.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Create or get private chat
      .addCase(createOrGetPrivateChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrGetPrivateChat.fulfilled, (state, action: PayloadAction<{ data: { chat: Chat } }>) => {
        state.loading = false;
        const chat = action.payload.data.chat;
        
        // Add to chats list if not already present
        const existingChatIndex = state.chats.findIndex(c => c.id === chat.id);
        if (existingChatIndex === -1) {
          state.chats.unshift(chat);
        }
        
        state.currentChat = chat;
      })
      .addCase(createOrGetPrivateChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setCurrentChat,
  addMessage,
  updateMessageReadStatus,
  addUserTyping,
  removeUserTyping,
  setCurrentUser,
  markChatAsRead,
  addReactionToMessage,
  removeReactionFromMessage,
} = chatSlice.actions;
export default chatSlice.reducer; 