/**
 * Audio Controller
 * Handles audio file uploads, streaming, and management for audio snippets in the MegaVibe platform.
 */

const AudioSnippet = require("../models/snippetModel.cjs");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const { uploadToIPFS } = require("../services/ipfsService.cjs");

// Define upload directory for local storage (fallback if IPFS fails)
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "snippets");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// @desc    Upload an audio snippet
// @route   POST /api/audio/snippets
// @access  Private (Authenticated Users)
const uploadSnippet = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No audio file uploaded");
  }

  const { title, description, venue, event } = req.body;
  const filePath = req.file.path;
  const fileName = req.file.filename;
  const fileSize = req.file.size;
  const mimeType = req.file.mimetype;

  // Validate file type (only allow audio files)
  if (!mimeType.startsWith("audio/")) {
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    res.status(400);
    throw new Error("Invalid file type. Only audio files are allowed");
  }

  // Validate file size (limit to 10MB for snippets)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  if (fileSize > MAX_SIZE) {
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    res.status(400);
    throw new Error("File too large. Maximum size is 10MB");
  }

  try {
    // Attempt to upload to IPFS
    const fileBuffer = fs.readFileSync(filePath);
    const ipfsResult = await uploadToIPFS(fileBuffer, fileName);

    // Create audio snippet record in database
    const snippet = await AudioSnippet.create({
      title: title || fileName,
      description,
      fileUrl: ipfsResult.url,
      fileCid: ipfsResult.cid,
      fileSize,
      mimeType,
      venue,
      event,
      uploadedBy: req.user._id,
      storageType: "ipfs",
    });

    // Clean up local file after successful IPFS upload
    fs.unlinkSync(filePath);

    res.status(201).json(snippet);
  } catch (error) {
    // Fallback to local storage if IPFS upload fails
    console.error("IPFS upload failed, falling back to local storage:", error);

    const localUrl = `/uploads/snippets/${fileName}`;
    const snippet = await AudioSnippet.create({
      title: title || fileName,
      description,
      fileUrl: localUrl,
      fileSize,
      mimeType,
      venue,
      event,
      uploadedBy: req.user._id,
      storageType: "local",
    });

    res.status(201).json(snippet);
  }
});

// @desc    Get all audio snippets
// @route   GET /api/audio/snippets
// @access  Public
const getSnippets = asyncHandler(async (req, res) => {
  const snippets = await AudioSnippet.find()
    .populate("uploadedBy venue event")
    .sort({ createdAt: -1 });
  res.status(200).json(snippets);
});

// @desc    Get a single audio snippet by ID
// @route   GET /api/audio/snippets/:id
// @access  Public
const getSnippetById = asyncHandler(async (req, res) => {
  const snippet = await AudioSnippet.findById(req.params.id).populate(
    "uploadedBy venue event"
  );

  if (snippet) {
    res.status(200).json(snippet);
  } else {
    res.status(404);
    throw new Error("Audio snippet not found");
  }
});

// @desc    Get audio snippets by user
// @route   GET /api/users/:userId/snippets
// @access  Public
const getSnippetsByUser = asyncHandler(async (req, res) => {
  const snippets = await AudioSnippet.find({ uploadedBy: req.params.userId })
    .populate("uploadedBy venue event")
    .sort({ createdAt: -1 });
  res.status(200).json(snippets);
});

// @desc    Get audio snippets by venue
// @route   GET /api/venues/:venueId/snippets
// @access  Public
const getSnippetsByVenue = asyncHandler(async (req, res) => {
  const snippets = await AudioSnippet.find({ venue: req.params.venueId })
    .populate("uploadedBy venue event")
    .sort({ createdAt: -1 });
  res.status(200).json(snippets);
});

// @desc    Get audio snippets by event
// @route   GET /api/events/:eventId/snippets
// @access  Public
const getSnippetsByEvent = asyncHandler(async (req, res) => {
  const snippets = await AudioSnippet.find({ event: req.params.eventId })
    .populate("uploadedBy venue event")
    .sort({ createdAt: -1 });
  res.status(200).json(snippets);
});

// @desc    Stream an audio snippet
// @route   GET /api/audio/snippets/:id/stream
// @access  Public
const streamSnippet = asyncHandler(async (req, res) => {
  const snippet = await AudioSnippet.findById(req.params.id);

  if (!snippet) {
    res.status(404);
    throw new Error("Audio snippet not found");
  }

  // Set appropriate headers for audio streaming
  res.setHeader("Content-Type", snippet.mimeType);
  res.setHeader("Content-Length", snippet.fileSize);
  res.setHeader("Accept-Ranges", "bytes");

  if (snippet.storageType === "ipfs") {
    // For IPFS, redirect to the IPFS gateway URL
    res.redirect(snippet.fileUrl);
  } else {
    // For local storage, stream the file
    const filePath = path.join(UPLOAD_DIR, path.basename(snippet.fileUrl));

    if (fs.existsSync(filePath)) {
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } else {
      res.status(404);
      throw new Error("Audio file not found on server");
    }
  }
});

// @desc    Delete an audio snippet
// @route   DELETE /api/audio/snippets/:id
// @access  Private (Uploader or Admin)
const deleteSnippet = asyncHandler(async (req, res) => {
  const snippet = await AudioSnippet.findById(req.params.id);

  if (snippet) {
    // Check if user has permission to delete this snippet
    if (
      snippet.uploadedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to delete this audio snippet");
    }

    // If stored locally, delete the file
    if (snippet.storageType === "local") {
      const filePath = path.join(UPLOAD_DIR, path.basename(snippet.fileUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    // Note: For IPFS, we can't delete the file, but we remove the database record

    await AudioSnippet.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Audio snippet deleted successfully" });
  } else {
    res.status(404);
    throw new Error("Audio snippet not found");
  }
});

// @desc    Add reaction to audio snippet
// @route   POST /api/audio/snippets/:id/reactions
// @access  Private (Authenticated Users)
const addReaction = asyncHandler(async (req, res) => {
  const { reactionType } = req.body;
  const snippet = await AudioSnippet.findById(req.params.id);

  if (!snippet) {
    res.status(404);
    throw new Error("Audio snippet not found");
  }

  // Validate reaction type
  const validReactions = ["like", "love", "fire", "clap"];
  if (!validReactions.includes(reactionType)) {
    res.status(400);
    throw new Error("Invalid reaction type");
  }

  // Check if user already reacted with this type
  const existingReactionIndex = snippet.reactions.findIndex(
    (r) =>
      r.user.toString() === req.user._id.toString() &&
      r.reactionType === reactionType
  );

  if (existingReactionIndex !== -1) {
    // User already reacted with this type, remove the reaction
    snippet.reactions.splice(existingReactionIndex, 1);
  } else {
    // Add new reaction
    snippet.reactions.push({
      user: req.user._id,
      reactionType,
    });
  }

  const updatedSnippet = await snippet.save();
  await updatedSnippet.populate("uploadedBy venue event");

  res.status(200).json(updatedSnippet);
});

module.exports = {
  uploadSnippet,
  getSnippets,
  getSnippetById,
  getSnippetsByUser,
  getSnippetsByVenue,
  getSnippetsByEvent,
  streamSnippet,
  deleteSnippet,
  addReaction,
};
