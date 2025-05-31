import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createAppError } from './errorHandler';

// Storage configuration for multer
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(createAppError('Not an image! Please upload only images.', 400) as unknown as null);
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Generate a unique filename for the uploaded image
export const generateFilename = (file: Express.Multer.File): string => {
  const extension = path.extname(file.originalname).toLowerCase();
  const filename = `${uuidv4()}${extension}`;
  return filename;
}; 