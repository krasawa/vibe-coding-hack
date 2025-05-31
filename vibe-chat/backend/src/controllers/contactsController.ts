import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { createAppError } from '../middleware/errorHandler';

// Get all contacts
export const getContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        contact: {
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
    });

    res.status(200).json({
      status: 'success',
      results: contacts.length,
      data: {
        contacts: contacts.map(c => c.contact),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Send contact request
export const sendContactRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username } = req.body;

    // Check if user exists
    const receiverUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!receiverUser) {
      return next(createAppError('User not found', 404));
    }

    // Check if trying to add self
    if (receiverUser.id === req.user.id) {
      return next(createAppError('You cannot add yourself as a contact', 400));
    }

    // Check if already contacts
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId: req.user.id,
        contactId: receiverUser.id,
      },
    });

    if (existingContact) {
      return next(createAppError('Already in your contacts', 400));
    }

    // Check if request already exists
    const existingRequest = await prisma.contactRequest.findFirst({
      where: {
        OR: [
          {
            senderId: req.user.id,
            receiverId: receiverUser.id,
          },
          {
            senderId: receiverUser.id,
            receiverId: req.user.id,
          },
        ],
      },
    });

    if (existingRequest) {
      return next(createAppError('Contact request already exists', 400));
    }

    // Create contact request
    const contactRequest = await prisma.contactRequest.create({
      data: {
        senderId: req.user.id,
        receiverId: receiverUser.id,
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        contactRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all contact requests
export const getContactRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const receivedRequests = await prisma.contactRequest.findMany({
      where: {
        receiverId: req.user.id,
        status: 'pending',
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
      },
    });

    const sentRequests = await prisma.contactRequest.findMany({
      where: {
        senderId: req.user.id,
        status: 'pending',
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        received: receivedRequests,
        sent: sentRequests,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Accept contact request
export const acceptContactRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestId } = req.params;

    // Find the contact request
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id: requestId },
    });

    if (!contactRequest) {
      return next(createAppError('Contact request not found', 404));
    }

    // Check if user is the receiver
    if (contactRequest.receiverId !== req.user.id) {
      return next(createAppError('Not authorized', 403));
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update contact request status
      const updatedRequest = await tx.contactRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      });

      // Create contact entries for both users
      const contact1 = await tx.contact.create({
        data: {
          userId: contactRequest.senderId,
          contactId: contactRequest.receiverId,
        },
      });

      const contact2 = await tx.contact.create({
        data: {
          userId: contactRequest.receiverId,
          contactId: contactRequest.senderId,
        },
      });

      return { updatedRequest, contact1, contact2 };
    });

    res.status(200).json({
      status: 'success',
      data: {
        contactRequest: result.updatedRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reject contact request
export const rejectContactRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestId } = req.params;

    // Find the contact request
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id: requestId },
    });

    if (!contactRequest) {
      return next(createAppError('Contact request not found', 404));
    }

    // Check if user is the receiver
    if (contactRequest.receiverId !== req.user.id) {
      return next(createAppError('Not authorized', 403));
    }

    // Update contact request status
    const updatedRequest = await prisma.contactRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' },
    });

    res.status(200).json({
      status: 'success',
      data: {
        contactRequest: updatedRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove contact
export const removeContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contactId } = req.params;

    // Check if contact exists
    const contact = await prisma.contact.findFirst({
      where: {
        userId: req.user.id,
        contactId,
      },
    });

    if (!contact) {
      return next(createAppError('Contact not found', 404));
    }

    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // Remove both contact entries
      await tx.contact.deleteMany({
        where: {
          OR: [
            { userId: req.user.id, contactId },
            { userId: contactId, contactId: req.user.id },
          ],
        },
      });
    });

    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
}; 