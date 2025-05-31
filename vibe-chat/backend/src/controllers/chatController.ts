import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { createAppError } from '../middleware/errorHandler';
import { uploadToS3, deleteFromS3 } from '../services/s3Service';

// Get all chats for the current user
export const getChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userChats = await prisma.userChat.findMany({
      where: {
        userId: req.user.id,
        leftAt: null, // Only active chats
      },
      include: {
        chat: {
          include: {
            userChats: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    isOnline: true,
                    lastSeen: true,
                  },
                },
              },
              where: {
                leftAt: null, // Only active users
              },
            },
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        chat: {
          updatedAt: 'desc',
        },
      },
    });

    // Format the response
    const chats = userChats.map((userChat) => {
      const { chat } = userChat;
      const otherUsers = chat.userChats
        .filter((uc: any) => uc.userId !== req.user.id)
        .map((uc: any) => uc.user);

      const lastMessage = chat.messages[0] || null;

      return {
        id: chat.id,
        name: chat.isGroup ? chat.name : otherUsers[0]?.displayName || otherUsers[0]?.username,
        isGroup: chat.isGroup,
        description: chat.description,
        participants: chat.userChats.map((uc: any) => uc.user),
        lastMessage,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });

    res.status(200).json({
      status: 'success',
      results: chats.length,
      data: {
        chats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single chat by ID
export const getChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatId } = req.params;

    // Check if user is a member of the chat
    const userChat = await prisma.userChat.findFirst({
      where: {
        userId: req.user.id,
        chatId,
        leftAt: null,
      },
    });

    if (!userChat) {
      return next(createAppError('Chat not found or you are not a member', 404));
    }

    // Get chat details
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        userChats: {
          where: {
            leftAt: null, // Only active users
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      return next(createAppError('Chat not found', 404));
    }

    // Format the response
    const otherUsers = chat.userChats
      .filter((uc) => uc.userId !== req.user.id)
      .map((uc) => uc.user);

    const formattedChat = {
      id: chat.id,
      name: chat.isGroup ? chat.name : otherUsers[0]?.displayName || otherUsers[0]?.username,
      isGroup: chat.isGroup,
      description: chat.description,
      participants: chat.userChats.map((uc) => uc.user),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };

    res.status(200).json({
      status: 'success',
      data: {
        chat: formattedChat,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a direct chat with another user
export const createDirectChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;

    // Check if user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!otherUser) {
      return next(createAppError('User not found', 404));
    }

    // Check if trying to chat with self
    if (userId === req.user.id) {
      return next(createAppError('Cannot create chat with yourself', 400));
    }

    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        userChats: {
          every: {
            userId: {
              in: [req.user.id, userId],
            },
          },
        },
        AND: [
          {
            userChats: {
              some: {
                userId: req.user.id,
              },
            },
          },
          {
            userChats: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        userChats: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (existingChat) {
      // Format the response
      const formattedChat = {
        id: existingChat.id,
        name: otherUser.displayName || otherUser.username,
        isGroup: false,
        participants: existingChat.userChats.map((uc) => uc.user),
        createdAt: existingChat.createdAt,
        updatedAt: existingChat.updatedAt,
      };

      return res.status(200).json({
        status: 'success',
        data: {
          chat: formattedChat,
        },
      });
    }

    // Create a new chat
    const newChat = await prisma.chat.create({
      data: {
        isGroup: false,
        userChats: {
          create: [
            {
              userId: req.user.id,
            },
            {
              userId,
            },
          ],
        },
      },
      include: {
        userChats: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Format the response
    const formattedChat = {
      id: newChat.id,
      name: otherUser.displayName || otherUser.username,
      isGroup: false,
      participants: newChat.userChats.map((uc) => uc.user),
      createdAt: newChat.createdAt,
      updatedAt: newChat.updatedAt,
    };

    res.status(201).json({
      status: 'success',
      data: {
        chat: formattedChat,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a group chat
export const createGroupChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, participantIds } = req.body;

    if (!name) {
      return next(createAppError('Group name is required', 400));
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return next(createAppError('At least one participant is required', 400));
    }

    // Check if all participants exist
    const participants = await prisma.user.findMany({
      where: {
        id: {
          in: [...participantIds, req.user.id],
        },
      },
    });

    if (participants.length !== participantIds.length + 1) {
      return next(createAppError('One or more participants not found', 404));
    }

    // Create the group chat
    const newChat = await prisma.chat.create({
      data: {
        name,
        description,
        isGroup: true,
        userChats: {
          create: [
            // Add the creator as admin
            {
              userId: req.user.id,
              isAdmin: true,
            },
            // Add other participants
            ...participantIds.map((id: string) => ({
              userId: id,
              isAdmin: false,
            })),
          ],
        },
      },
      include: {
        userChats: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Format the response
    const formattedChat = {
      id: newChat.id,
      name: newChat.name,
      description: newChat.description,
      isGroup: true,
      participants: newChat.userChats.map((uc) => uc.user),
      createdAt: newChat.createdAt,
      updatedAt: newChat.updatedAt,
    };

    res.status(201).json({
      status: 'success',
      data: {
        chat: formattedChat,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get messages for a chat
export const getChatMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Check if user is a member of the chat
    const userChat = await prisma.userChat.findFirst({
      where: {
        userId: req.user.id,
        chatId,
        leftAt: null,
      },
    });

    if (!userChat) {
      return next(createAppError('Chat not found or you are not a member', 404));
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        chatId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: {
        chatId,
      },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        chatId,
        senderId: {
          not: req.user.id,
        },
        NOT: {
          readBy: {
            has: req.user.id,
          },
        },
      },
      data: {
        readBy: {
          push: req.user.id,
        },
      },
    });

    res.status(200).json({
      status: 'success',
      results: messages.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalResults: totalCount,
      },
      data: {
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Send a message
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    
    // Check if user is a member of the chat
    const userChat = await prisma.userChat.findFirst({
      where: {
        userId: req.user.id,
        chatId,
        leftAt: null,
      },
    });

    if (!userChat) {
      return next(createAppError('Chat not found or you are not a member', 404));
    }

    // Handle image upload if any
    let imageUrl;
    if (req.file) {
      imageUrl = await uploadToS3(req.file);
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user.id,
        chatId,
        imageUrl,
        readBy: [req.user.id], // Sender has read their own message
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Update chat's updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Emit the message via socket to all chat members
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('new_message', message);
    }

    res.status(201).json({
      status: 'success',
      data: {
        message,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add reaction to a message
export const addReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return next(createAppError('Emoji is required', 400));
    }

    // Get the message to check access
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            userChats: {
              where: {
                userId: req.user.id,
                leftAt: null,
              },
            },
          },
        },
      },
    });

    if (!message) {
      return next(createAppError('Message not found', 404));
    }

    // Check if user is a member of the chat
    if (message.chat.userChats.length === 0) {
      return next(createAppError('You are not a member of this chat', 403));
    }

    // Check if reaction already exists
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        messageId,
        userId: req.user.id,
        emoji,
      },
    });

    if (existingReaction) {
      // If reaction already exists, remove it (toggle)
      await prisma.reaction.delete({
        where: { id: existingReaction.id },
      });

      return res.status(200).json({
        status: 'success',
        data: {
          removed: true,
          emoji,
        },
      });
    }

    // Create new reaction
    const reaction = await prisma.reaction.create({
      data: {
        emoji,
        userId: req.user.id,
        messageId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        reaction,
      },
    });
  } catch (error) {
    next(error);
  }
}; 