import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Convert buffer to stream
const bufferToStream = (buffer: Buffer): Readable => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

// Upload image to Cloudinary
export const uploadImage = async (buffer: Buffer, folder: string = 'electron'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );

    bufferToStream(buffer).pipe(uploadStream);
  });
};

// Delete image from Cloudinary
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Failed to delete image from Cloudinary: ${result.result}`);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (url: string): string => {
  if (!url || !url.includes('cloudinary.com')) return '';

  try {
    // Remove query parameters if any
    const urlWithoutParams = url.split('?')[0];

    // Split by '/' and find the 'upload' part
    const parts = urlWithoutParams.split('/');
    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex === -1 || uploadIndex >= parts.length - 1) {
      return '';
    }

    // Get all parts after 'upload'
    const afterUpload = parts.slice(uploadIndex + 1);

    // Join them back and remove file extension
    const fullPath = afterUpload.join('/');
    const publicId = fullPath.replace(/\.[^/.]+$/, ''); // Remove extension

    return publicId;
  } catch (error) {
    console.error('Error extracting public ID from Cloudinary URL:', error);
    return '';
  }
};

// Test the extractPublicId function
// const testUrl = 'https://res.cloudinary.com/dbfscdd0s/image/upload/v1730123456/electron/courses/sample_image.jpg';
// console.log('Extracted public ID:', extractPublicId(testUrl));
