const express = require("express");
const {
  uploadFile,
  getUserFiles,
  deleteFile,
} = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router
  .route("/")
  .post(protect, upload.single("file"), uploadFile)
  .get(protect, getUserFiles);

router.route("/:id").delete(protect, deleteFile);

module.exports = router;
