import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage, updateMessageReadStatus, addUserTyping, removeUserTyping, addReactionToMessage, removeReactionFromMessage } from '../store/slices/chatSlice';
import { updateContactStatus } from '../store/slices/contactSlice';

class SocketService {
  private socket: Socket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  init(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, cannot initialize socket connection');
      return;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      this.socket.disconnect();
    }

    // Connect to the server with the JWT for authentication
    this.socket = io(process.env.REACT_APP_WS_URL || window.location.origin, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
      
      // Auto-reconnect on certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        setTimeout(() => this.init(), 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
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
      this.connected = false;
      this.reconnectAttempts = 0;
    }
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