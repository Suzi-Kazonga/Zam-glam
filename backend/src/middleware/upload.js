// Receiving uploaded files — product photographs, and a shop's registration documents.
//
// Files are written to disk under backend/uploads/ and only their path is stored in the
// database. app.js serves that folder, so a saved path like "/uploads/1737-dress.png" is
// also the URL the browser loads the picture from.

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Where each uploaded file goes, and what it is called.
//
// The name is prefixed with the current timestamp, so two shops both uploading "dress.jpg"
// do not overwrite each other.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// What may be uploaded at all.
//
// Only pictures and PDFs. This is checked on the file's declared type rather than its
// extension, so renaming something to .png is not enough to get it through.
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// The finished uploader, used by the product and document routes. The size cap stops one
// upload filling the disk; a 5MB photograph is already larger than any listing needs.
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;
