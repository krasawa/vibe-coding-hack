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
console.log(`[S3 Service] Initialized. Bucket: ${BUCKET_NAME}, Region: ${s3.config.region}, Endpoint: ${s3.config.endpoint}`);

/**
 * Upload a file to S3
 * @param file The file to upload
 * @returns The URL of the uploaded file
 */
export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  if (!file) {
    console.error('[S3 Service] Upload attempt with no file.');
    throw new Error('File is undefined or null');
  }
  console.log(`[S3 Service] Attempting to upload file: ${file.originalname}, Size: ${file.size}, Mimetype: ${file.mimetype}`);
  const filename = generateFilename(file);
  console.log(`[S3 Service] Generated filename: ${filename}`);
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: `uploads/${filename}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };
  console.log('[S3 Service] Upload params:', params);

  try {
    const result = await s3.upload(params).promise();
    console.log('[S3 Service] Upload successful. Location:', result.Location);
    return result.Location;
  } catch (error) {
    console.error('[S3 Service] Error uploading to S3:', error);
    throw error; // Re-throw the error to be caught by the controller
  }
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