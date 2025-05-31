import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage, updateMessageReadStatus, addUserTyping, removeUserTyping } from '../store/slices/chatSlice';
import { updateContactStatus } from '../store/slices/contactSlice';

class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  init(): void {
    if (this.connected) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to the server with the JWT for authentication
    this.socket = io(process.env.REACT_APP_WS_URL || window.location.origin, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupListeners();
    this.connected = true;
  }

  private setupListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Chat events
    this.socket.on('new_message', (message) => {
      store.dispatch(addMessage(message));
    });

    this.socket.on('message_read', ({ messageId, userId }) => {
      store.dispatch(updateMessageReadStatus({ messageId, userId }));
    });

    this.socket.on('user_typing', ({ chatId, userId }) => {
      store.dispatch(addUserTyping({ chatId, userId }));
    });

    this.socket.on('user_stop_typing', ({ chatId, userId }) => {
      store.dispatch(removeUserTyping({ chatId, userId }));
    });

    // Status events
    this.socket.on('contact_status_change', ({ userId, isOnline, lastSeen }) => {
      store.dispatch(updateContactStatus({ userId, isOnline, lastSeen }));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Send typing indicator
  sendTyping(chatId: string, isTyping: boolean): void {
    if (!this.socket || !this.connected) return;

    if (isTyping) {
      this.socket.emit('typing', { chatId });
    } else {
      this.socket.emit('stop_typing', { chatId });
    }
  }

  // Mark message as read
  markMessageAsRead(messageId: string): void {
    if (!this.socket || !this.connected) return;

    this.socket.emit('mark_as_read', { messageId });
  }

  // Join a chat room
  joinChat(chatId: string): void {
    if (!this.socket || !this.connected) return;

    this.socket.emit('join_chat', { chatId });
  }

  // Leave a chat room
  leaveChat(chatId: string): void {
    if (!this.socket || !this.connected) return;

    this.socket.emit('leave_chat', { chatId });
  }

  // Send a message
  sendMessage(chatId: string, content: string, messageId: string, imageUrl?: string): void {
    if (!this.socket || !this.connected) return;

    this.socket.emit('send_message', { 
      chatId, 
      content, 
      messageId,
      imageUrl 
    });
  }
}

export const socketService = new SocketService();
export default socketService; 