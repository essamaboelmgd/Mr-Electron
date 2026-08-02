import multer from 'multer';

// Keep uploads in memory and send them through our Cloudinary service after
// Multer has validated the file. This avoids the unmaintained
// multer-storage-cloudinary adapter and keeps the upload path compatible with
// Cloudinary SDK v2.
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create multer instances for different folders
const uploadCourseImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const uploadNoteImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const uploadQuestionImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export { uploadCourseImage, uploadNoteImage, uploadQuestionImage };
