import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage, updateMessageReadStatus, addUserTyping, removeUserTyping, addReactionToMessage, removeReactionFromMessage } from '../store/slices/chatSlice';
import { updateContactStatus } from '../store/slices/contactSlice';

class SocketService {
  private socket: Socket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isInitializing = false;

  init(): void {
    // Prevent multiple simultaneous initialization attempts
    if (this.isInitializing) {
      console.log('Socket initialization already in progress');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, cannot initialize socket connection');
      return;
    }

    // If already connected, don't reconnect
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return;
    }

    this.isInitializing = true;

    // Disconnect existing connection if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const socketUrl = process.env.REACT_APP_WS_URL || window.location.origin;
    console.log('Attempting to connect to WebSocket at:', socketUrl);

    // Connect to the server with the JWT for authentication
    try {
      this.socket = io(socketUrl, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });
      
      console.log('Socket.IO instance created, connecting...');
      this.setupListeners();
    } catch (error) {
      console.error('Error creating Socket.IO instance:', error);
      this.isInitializing = false;
    }
  }

  private setupListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.isInitializing = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
      
      // Only auto-reconnect on certain disconnect reasons and if not manually disconnected
      if (reason === 'io server disconnect' || reason === 'transport close') {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
          setTimeout(() => {
            if (!this.connected && !this.isInitializing) {
              this.init();
            }
          }, 2000 * (this.reconnectAttempts + 1)); // Exponential backoff
        } else {
          console.error('Max reconnection attempts reached');
        }
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connected = false;
      this.isInitializing = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      } else {
        // Retry connection with exponential backoff
        setTimeout(() => {
          if (!this.connected && !this.isInitializing) {
            this.init();
          }
        }, 3000 * this.reconnectAttempts);
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Chat events
    this.socket.on('new_message', (message) => {
      console.log('Received new message:', message);
      store.dispatch(addMessage(message));
    });

    this.socket.on('message_read', ({ messageId, userId }) => {
      console.log('Message read:', { messageId, userId });
      store.dispatch(updateMessageReadStatus({ messageId, userId }));
    });

    this.socket.on('user_typing', ({ chatId, userId }) => {
      store.dispatch(addUserTyping({ chatId, userId }));
    });

    this.socket.on('user_stop_typing', ({ chatId, userId }) => {
      store.dispatch(removeUserTyping({ chatId, userId }));
    });

    // Reaction events
    this.socket.on('reaction_added', ({ messageId, reaction }) => {
      console.log('Reaction added:', { messageId, reaction });
      store.dispatch(addReactionToMessage({ messageId, reaction }));
    });

    this.socket.on('reaction_removed', ({ messageId, reactionId, userId, emoji }) => {
      console.log('Reaction removed:', { messageId, reactionId, userId, emoji });
      store.dispatch(removeReactionFromMessage({ messageId, reactionId, userId, emoji }));
    });

    // Status events
    this.socket.on('contact_status_change', ({ userId, isOnline, lastSeen }) => {
      console.log('Contact status change:', { userId, isOnline, lastSeen });
      store.dispatch(updateContactStatus({ userId, isOnline, lastSeen }));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.reconnectAttempts = 0;
    this.isInitializing = false;
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  // Send typing indicator
  sendTyping(chatId: string, isTyping: boolean): void {
    if (!this.isConnected()) {
      console.warn('Socket not connected, cannot send typing indicator');
      return;
    }

    if (isTyping) {
      this.socket!.emit('typing', { chatId });
    } else {
      this.socket!.emit('stop_typing', { chatId });
    }
  }

  // Mark message as read
  markMessageAsRead(messageId: string): void {
    if (!this.isConnected()) {
      console.warn('Socket not connected, cannot mark message as read');
      return;
    }

    this.socket!.emit('mark_as_read', { messageId });
  }

  // Join a chat room
  joinChat(chatId: string): void {
    if (!this.isConnected()) {
      console.warn('Socket not connected, cannot join chat');
      return;
    }

    this.socket!.emit('join_chat', { chatId });
    console.log('Joining chat:', chatId);
  }

  // Leave a chat room
  leaveChat(chatId: string): void {
    if (!this.isConnected()) {
      console.warn('Socket not connected, cannot leave chat');
      return;
    }

    this.socket!.emit('leave_chat', { chatId });
    console.log('Leaving chat:', chatId);
  }

  // Force reconnection
  reconnect(): void {
    this.init();
  }
}

export const socketService = new SocketService();
export default socketService; 