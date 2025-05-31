import AWS from 'aws-sdk';
import { generateFilename } from '../middleware/upload';

// Initialize S3 client
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.NODE_ENV === 'development' 
    ? 'http://localstack:4566'  // LocalStack endpoint for development
    : undefined,                // Use AWS endpoints in production
  s3ForcePathStyle: process.env.NODE_ENV === 'development', // Required for LocalStack
  accessKeyId: process.env.NODE_ENV === 'development' ? 'test' : undefined,
  secretAccessKey: process.env.NODE_ENV === 'development' ? 'test' : undefined,
});

// S3 bucket name
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'vibe-chat-local';

/**
 * Upload a file to S3
 * @param file The file to upload
 * @returns The URL of the uploaded file
 */
export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  const filename = generateFilename(file);
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: `uploads/${filename}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  const result = await s3.upload(params).promise();
  
  // Return the URL of the uploaded file
  return result.Location;
};

/**
 * Delete a file from S3
 * @param url The URL of the file to delete
 */
export const deleteFromS3 = async (url: string): Promise<void> => {
  // Extract the key from the URL
  const key = url.split(`/${BUCKET_NAME}/`)[1];
  
  if (!key) {
    throw new Error('Invalid S3 URL');
  }
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };
  
  await s3.deleteObject(params).promise();
}; 