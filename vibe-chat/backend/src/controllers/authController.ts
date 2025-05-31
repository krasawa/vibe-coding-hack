import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { createAppError } from '../middleware/errorHandler';

// Generate JWT token
const signToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'default_jwt_secret_change_this',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    }
  );
};

// Create and send token response
const createSendToken = (user: any, statusCode: number, res: Response) => {
  const token = signToken(user.id);

  // Remove password from output
  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userWithoutPassword,
    },
  });
};

// Register a new user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
      },
    });

    if (existingUser) {
      return next(
        createAppError('Username already in use', 400)
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user - use username as email and displayName
    const newUser = await prisma.user.create({
      data: {
        username,
        email: `${username}@example.com`, // Generate a placeholder email
        password: hashedPassword,
        displayName: username,
      },
    });

    // Send token to client
    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    // Check if username and password exist
    if (!username || !password) {
      return next(createAppError('Please provide username and password', 400));
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    // Check if user exists & password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(createAppError('Incorrect username or password', 401));
    }

    // Update last seen and online status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    // Send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Logout user
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Update user's online status
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          isOnline: false,
          lastSeen: new Date(),
        },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
}; 