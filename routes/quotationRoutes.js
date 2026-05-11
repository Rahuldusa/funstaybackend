const express = require("express");
const multer = require("multer");
const router = express.Router();
const quotationController = require("../controllers/quotationController");

// Multer Config for File Uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// API Route to Upload and Send Email
router.post("/upload", upload.single("quotation"), quotationController.uploadQuotation);

// GET Email Chat History by Lead ID
router.get("/email-chat/:leadId", quotationController.getEmailChatByLeadId);

module.exports = router;
