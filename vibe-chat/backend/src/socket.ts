import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

interface User {
  id: string;
  username: string;
}

interface SocketWithUser extends Socket {
  user?: User;
}

export const initSocketHandlers = (io: Server, prisma: PrismaClient) => {
  // Map to track users' online status
  const onlineUsers = new Map<string, string[]>(); // userId -> socketIds[]

  // Socket authentication middleware
  io.use(async (socket: SocketWithUser, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default_jwt_secret_change_this'
      ) as JwtPayload;

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true },
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket: SocketWithUser) => {
    const userId = socket.user?.id;
    
    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);

    // Add socket to user's active connections
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId)?.push(socket.id);
    } else {
      onlineUsers.set(userId, [socket.id]);
      
      // Update user online status in database
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeen: new Date() },
      });

      // Notify contacts that user is online
      notifyContactsOfStatusChange(userId, true);
    }

    // Join user to their chat rooms
    const userChats = await prisma.userChat.findMany({
      where: { userId, leftAt: null },
      select: { chatId: true },
    });

    userChats.forEach((chat) => {
      socket.join(chat.chatId);
      console.log(`User ${userId} joined chat room: ${chat.chatId}`);
    });

    // Event handlers
    
    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, messageId, imageUrl } = data;
        
        // Check if user is member of the chat
        const userChat = await prisma.userChat.findFirst({
          where: { userId, chatId, leftAt: null },
        });

        if (!userChat) {
          socket.emit('error', 'Not authorized to send message to this chat');
          return;
        }

        // Create message in database (already done in HTTP endpoint)
        // Here we just broadcast the message to all chat members
        io.to(chatId).emit('new_message', {
          id: messageId,
          content,
          senderId: userId,
          chatId,
          imageUrl,
          readBy: [userId],
          createdAt: new Date(),
          sender: {
            id: userId,
            username: socket.user?.username,
          },
        });
        
        // Notify offline users (could be implemented with push notifications)
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Message read status
    socket.on('mark_as_read', async (data) => {
      try {
        const { messageId } = data;
        
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          include: {
            chat: {
              include: {
                userChats: {
                  where: { userId },
                },
              },
            },
          },
        });

        if (!message || message.chat.userChats.length === 0) {
          socket.emit('error', 'Message not found or not authorized');
          return;
        }

        // Update read status if not already read
        if (!message.readBy.includes(userId)) {
          await prisma.message.update({
            where: { id: messageId },
            data: {
              readBy: {
                push: userId,
              },
            },
          });

          // Broadcast read status to all chat members
          io.to(message.chatId).emit('message_read', {
            messageId,
            userId,
            chatId: message.chatId,
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
        socket.emit('error', 'Failed to mark message as read');
      }
    });

    // User typing status
    socket.on('typing', (data) => {
      const { chatId } = data;
      
      // Broadcast to all users in the chat except sender
      socket.to(chatId).emit('user_typing', {
        userId,
        username: socket.user?.username,
        chatId,
      });
    });

    // User stopped typing
    socket.on('stop_typing', (data) => {
      const { chatId } = data;
      
      // Broadcast to all users in the chat except sender
      socket.to(chatId).emit('user_stop_typing', {
        userId,
        chatId,
      });
    });

    // Join chat
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;
        
        // Check if user is member of the chat
        const userChat = await prisma.userChat.findFirst({
          where: { userId, chatId, leftAt: null },
        });

        if (!userChat) {
          socket.emit('error', 'Not authorized to join this chat');
          return;
        }

        socket.join(chatId);
        console.log(`User ${userId} joined chat room: ${chatId}`);
      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', 'Failed to join chat');
      }
    });

    // Leave chat
    socket.on('leave_chat', async (data) => {
      try {
        const { chatId } = data;
        
        socket.leave(chatId);
        console.log(`User ${userId} left chat room: ${chatId}`);
      } catch (error) {
        console.error('Error leaving chat:', error);
        socket.emit('error', 'Failed to leave chat');
      }
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}, Socket ID: ${socket.id}`);
      
      // Remove socket from active connections
      const userSockets = onlineUsers.get(userId) || [];
      const remainingSockets = userSockets.filter(id => id !== socket.id);
      
      if (remainingSockets.length === 0) {
        // Last connection for this user - mark offline
        onlineUsers.delete(userId);
        
        // Update user status in database
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false, lastSeen: new Date() },
        });

        // Notify contacts that user is offline
        notifyContactsOfStatusChange(userId, false);
      } else {
        // User still has other active connections
        onlineUsers.set(userId, remainingSockets);
      }
    });
  });

  // Helper function to notify contacts about status change
  async function notifyContactsOfStatusChange(userId: string, isOnline: boolean) {
    try {
      // Get all contacts of the user
      const contacts = await prisma.contact.findMany({
        where: { userId },
        select: { contactId: true },
      });

      const contactIds = contacts.map(contact => contact.contactId);
      
      // Emit status change to all online contacts
      contactIds.forEach(contactId => {
        if (onlineUsers.has(contactId)) {
          const socketIds = onlineUsers.get(contactId) || [];
          socketIds.forEach(socketId => {
            io.to(socketId).emit('contact_status_change', {
              userId,
              isOnline,
              lastSeen: isOnline ? null : new Date(),
            });
          });
        }
      });
    } catch (error) {
      console.error('Error notifying contacts of status change:', error);
    }
  }
}; 