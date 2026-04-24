import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import {
  createDoc,
  getDoc,
  saveDoc,
  deleteDoc,
  addCollaborators,
  exportDoc,
  getVersionHistory,
  addFavourites,
  getHistory,
  getLink,
  sharedDoc,
  publicAccess,
  getDocument,
  profilePicture,
} from "../controllers/documentController.js";
import { protect } from "../middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

router.post("/create", protect, createDoc);
router.get("/all", protect, getDocument);
router.get("/shared/:id", sharedDoc);

router.get("/:id", protect, getDoc);
router.put("/:id", protect, saveDoc);
router.delete("/:id", protect, deleteDoc);
router.post("/:id/share", protect, addCollaborators);
router.get("/:id/export", protect, exportDoc);
router.get("/:id/versions", protect, getVersionHistory);
router.patch("/:id/star", protect, addFavourites);
router.get("/:id/history", protect, getHistory);
router.get("/:id/share-link", protect, getLink);
router.patch("/:id/public-access", protect, publicAccess);
router.post(
  "/upload-profile",
  protect,
  upload.single("profilePic"),
  profilePicture,
);

export default router;
