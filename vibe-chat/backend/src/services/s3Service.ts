import AWS from 'aws-sdk';
import { generateFilename } from '../middleware/upload';
import * as crypto from 'crypto';

// Check if we're in development mode
const isDevMode = process.env.NODE_ENV === 'development';
const useMockS3 = isDevMode && process.env.USE_MOCK_S3 === 'true';

// In-memory store for mock S3 (for development without LocalStack)
const mockS3Storage: Record<string, {
  key: string;
  data: Buffer;
  contentType: string;
  url: string;
}> = {};

// Initialize S3 client (only if not using mock)
const s3 = !useMockS3 ? new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: isDevMode ? 'http://localstack:4566' : undefined,
  s3ForcePathStyle: isDevMode,
  accessKeyId: isDevMode ? 'test' : undefined,
  secretAccessKey: isDevMode ? 'test' : undefined,
}) : null;

// S3 bucket name
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'vibe-chat-local';
console.log(`[S3 Service] Initialized. ${useMockS3 ? 'Using mock S3 storage' : `Bucket: ${BUCKET_NAME}, Region: ${s3?.config.region}, Endpoint: ${s3?.config.endpoint}`}`);

/**
 * Upload a file to S3 or mock storage
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

  // If using mock S3 in development
  if (useMockS3) {
    try {
      const key = `uploads/${filename}`;
      const url = `http://mock-s3/${BUCKET_NAME}/${key}`;
      
      // Store in our mock storage
      mockS3Storage[key] = {
        key,
        data: file.buffer,
        contentType: file.mimetype,
        url
      };
      
      console.log('[S3 Service] Mock upload successful:', url);
      
      // In development, return a data URI instead of a URL
      // Convert buffer to base64 data URI
      const base64 = file.buffer.toString('base64');
      const dataUri = `data:${file.mimetype};base64,${base64}`;
      
      return dataUri;
    } catch (error) {
      console.error('[S3 Service] Error in mock upload:', error);
      
      // For development, return a fallback data URI on error
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AgSEh0nVzMdJAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAANRSURBVDjLfZNLaBNRFIabyftJJpkknzQ2SaVNpugglcc0qAhBEJC0SuwLXYqCG8EIQRAEQXRRF1J3cdFFu9CiC0GlBUSxNFaiKAYSCG2svJVkkswrM5mZq4ubgjV+sODcc+/57zn/Oee0Y+MU5OXl6VJSkpgQQqHX6xHgybKszk6n03eEkKNut9sJw3DL0dHRu1PRIIYQ0AcHB7UrV65kGAwGSCAQWFZVdYrjuBVBEBxDQ0PQZDKpkUgkPDY2djAwMNDs8XiOVFVxrwz6+vrqLl26VK9pmg1BEGvNZnNYURRZUZT5sbGxY4PBgC/zTU5OzpjN5kNBEGxdXV1TMKJ5DVgikaiamJiY0+v15x0Ox23btv2GYVhVFAUwDEMXFxeDk5OT9z0eT7nD4YDBYBAODQ3FRkdHG0Oh0OVXCrq7u89MTEy0GwyGY5qmXZ2cnLxSV1dndblckGVZQBQFgKIonE6nqzg7O5uNRCJFLpdLtdvtYGZmZs/v99dCqqqgpqYmBMMwQRRFaTweP37mzJn2wsJCrLCwkM/Ozob29vY+TExMfDBNy7JarfLIyEgjz/NGQRDKcnJyYtlsVpiamnoKq6qqUL1er6mqKk9OTu5pb29fsdlsjNVqzSJJshy2bVCWnZ0N6XQ6oCgKUlJSwmazmc1kMg232+2XZVldW1v7vASqqqry+/2J4eHh17W1tV/tdjuAIAiEYVjA87zfZrPFOI4DCNLzPM8nEon25ubmd5OTk3f9fn85pGnawLKsDcMwwPO8BUEQIEmSDcMwFgzDgM1mQ1iWlQRBYERRfDA3N9cSCASWTSYTYbPZShRFySEIwiFJEpzJZGxZWZn2yvB4PPfPnj07UlJS4iBI8uHy8vLHhYWFT3Nzc58zmQxSUFAAnj9/niwoKPiZSCSOh8Phh7m5uaeqq6tL6+vrvxBIdXX1JYvFQpMk+aem67cikUi0v7+/HoZhiKKozeXlZaCqKiivrHTW1dUJg4ODdxKJxB+r1ZrU6/UbMMTzPKwoyrdoNNrodruzhYWFaFlZmbyysgIymQwkSRIaj8elQCCQpGlaCgaDqXA4PE/TtEbTtELTtJpKpb7B/xeCxWIJlJeXe2ma1lRV/ZFMJj+kUqn5dDr9G4bhVadT5Cl6AAAAAElFTkSuQmCC';
    }
  }
  
  // Use real S3 (AWS or LocalStack)
  const params = {
    Bucket: BUCKET_NAME,
    Key: `uploads/${filename}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };
  
  try {
    if (!s3) {
      throw new Error("S3 client not initialized");
    }
    
    const result = await s3.upload(params).promise();
    console.log('[S3 Service] Upload successful. Location:', result.Location);
    return result.Location;
  } catch (error) {
    console.error('[S3 Service] Error uploading to S3:', error);
    
    if (isDevMode) {
      // In development, return a fallback data URI
      console.log('[S3 Service] Returning fallback image in development mode');
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AgSEh0nVzMdJAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAANRSURBVDjLfZNLaBNRFIabyftJJpkknzQ2SaVNpugglcc0qAhBEJC0SuwLXYqCG8EIQRAEQXRRF1J3cdFFu9CiC0GlBUSxNFaiKAYSCG2svJVkkswrM5mZq4ubgjV+sODcc+/57zn/Oee0Y+MU5OXl6VJSkpgQQqHX6xHgybKszk6n03eEkKNut9sJw3DL0dHRu1PRIIYQ0AcHB7UrV65kGAwGSCAQWFZVdYrjuBVBEBxDQ0PQZDKpkUgkPDY2djAwMNDs8XiOVFVxrwz6+vrqLl26VK9pmg1BEGvNZnNYURRZUZT5sbGxY4PBgC/zTU5OzpjN5kNBEGxdXV1TMKJ5DVgikaiamJiY0+v15x0Ox23btv2GYVhVFAUwDEMXFxeDk5OT9z0eT7nD4YDBYBAODQ3FRkdHG0Oh0OVXCrq7u89MTEy0GwyGY5qmXZ2cnLxSV1dndblckGVZQBQFgKIonE6nqzg7O5uNRCJFLpdLtdvtYGZmZs/v99dCqqqgpqYmBMMwQRRFaTweP37mzJn2wsJCrLCwkM/Ozob29vY+TExMfDBNy7JarfLIyEgjz/NGQRDKcnJyYtlsVpiamnoKq6qqUL1er6mqKk9OTu5pb29fsdlsjNVqzSJJshy2bVCWnZ0N6XQ6oCgKUlJSwmazmc1kMg232+2XZVldW1v7vASqqqry+/2J4eHh17W1tV/tdjuAIAiEYVjA87zfZrPFOI4DCNLzPM8nEon25ubmd5OTk3f9fn85pGnawLKsDcMwwPO8BUEQIEmSDcMwFgzDgM1mQ1iWlQRBYERRfDA3N9cSCASWTSYTYbPZShRFySEIwiFJEpzJZGxZWZn2yvB4PPfPnj07UlJS4iBI8uHy8vLHhYWFT3Nzc58zmQxSUFAAnj9/niwoKPiZSCSOh8Phh7m5uaeqq6tL6+vrvxBIdXX1JYvFQpMk+aem67cikUi0v7+/HoZhiKKozeXlZaCqKiivrHTW1dUJg4ODdxKJxB+r1ZrU6/UbMMTzPKwoyrdoNNrodruzhYWFaFlZmbyysgIymQwkSRIaj8elQCCQpGlaCgaDqXA4PE/TtEbTtELTtJpKpb7B/xeCxWIJlJeXe2ma1lRV/ZFMJj+kUqn5dDr9G4bhVadT5Cl6AAAAAElFTkSuQmCC';
    }
    
    // Re-throw in production
    throw error;
  }
};

/**
 * Delete a file from S3 or mock storage
 * @param url The URL of the file to delete
 */
export const deleteFromS3 = async (url: string): Promise<void> => {
  // If using mock S3 in development
  if (useMockS3) {
    // For data URIs, there's nothing to delete
    if (url.startsWith('data:')) {
      console.log('[S3 Service] Mock delete for data URI');
      return;
    }
    
    // Extract the key
    const parts = url.split('/');
    const key = parts.slice(3).join('/');
    
    if (mockS3Storage[key]) {
      delete mockS3Storage[key];
      console.log(`[S3 Service] Mock deleted: ${key}`);
    }
    
    return;
  }
  
  // Real S3 delete
  try {
    // Extract the key from the URL
    const key = url.split(`/${BUCKET_NAME}/`)[1];
    
    if (!key) {
      throw new Error('Invalid S3 URL');
    }
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };
    
    if (!s3) {
      throw new Error("S3 client not initialized");
    }
    
    await s3.deleteObject(params).promise();
    console.log(`[S3 Service] Deleted: ${key}`);
  } catch (error) {
    console.error('[S3 Service] Error deleting from S3:', error);
    
    // In development, don't throw the error
    if (!isDevMode) {
      throw error;
    }
  }
}; 