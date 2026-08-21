import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

// Expects a Supabase Storage bucket named "dms-uploads" (public) to already exist.
// Create it once in the Supabase dashboard: Storage -> New bucket -> "dms-uploads" -> Public.
const BUCKET = 'dms-uploads';

router.post(
  '/image',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = req.file.originalname.split('.').pop();
    const path = `${req.user.company_id}/${req.query.folder || 'general'}/${uuidv4()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
    if (uploadErr) {
      return res.status(500).json({
        error:
          uploadErr.message?.includes('Bucket not found')
            ? `Storage bucket "${BUCKET}" doesn't exist yet — create a public bucket named "${BUCKET}" in your Supabase dashboard under Storage.`
            : uploadErr.message,
      });
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    res.status(201).json({ url: publicUrlData.publicUrl, path });
  })
);

export default router;
