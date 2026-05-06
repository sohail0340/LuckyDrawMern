import { Router, type Response } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { requireAuth, requireAdmin, type AuthRequest } from "../lib/auth.js";
import { Upload } from "../lib/db-mongoose/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadsDir))
  fs.mkdirSync(uploadsDir, { recursive: true });

function makeUpload(prefix: string, maxKb: number) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(
          null,
          `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
        );
      },
    }),
    limits: { fileSize: maxKb * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else
        cb(
          new Error(
            "Only image files (JPG, PNG, WebP, GIF) are allowed"
          )
        );
    },
  });
}

function handleSingleUpload(upload: multer.Multer, fileType: string) {
  return (req: AuthRequest, res: Response) => {
    upload.single("image")(req as any, res as any, async (err) => {
      if (
        err instanceof multer.MulterError &&
        err.code === "LIMIT_FILE_SIZE"
      ) {
        res.status(400).json({ error: "File is too large." });
        return;
      }
      if (err) {
        res.status(400).json({ error: err.message || "Upload failed" });
        return;
      }
      if (!(req as any).file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const file = (req as any).file as Express.Multer.File;
      const url = `/api/uploads/${file.filename}`;

      try {
        await Upload.create({
          filename: file.filename,
          url,
          fileSizeBytes: file.size,
          type: fileType,
          uploadedById: req.userId ?? null,
        });
      } catch (dbErr) {
        console.error("[upload] DB tracking failed:", dbErr);
      }

      res.json({ url });
    });
  };
}

const router = Router();

// Regular users: payment screenshot uploads (5 MB limit)
router.post(
  "/screenshot",
  requireAuth as any,
  handleSingleUpload(makeUpload("screenshot", 5120), "screenshot")
);

// Admin only: draw image uploads (5 MB limit)
router.post(
  "/image",
  requireAdmin as any,
  handleSingleUpload(makeUpload("draw", 5120), "draw_image")
);

export default router;
