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
      creator: req.user._id,
      venue,
      event,
      audioFile: {
        url: ipfsResult.url,
        ipfsHash: ipfsResult.cid,
        size: fileSize,
        format: mimeType,
        duration: duration || 0,
      },
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
      creator: req.user._id,
      venue,
      event,
      audioFile: {
        url: localUrl,
        size: fileSize,
        format: mimeType,
        duration: duration || 0,
      },
    });

    res.status(201).json(snippet);
  }
});

// @desc    Get all audio snippets
// @route   GET /api/audio
// @access  Public
const getSnippets = asyncHandler(async (req, res) => {
  const snippets = await AudioSnippet.find()
    .populate("creator venue event artist")
    .sort({ createdAt: -1 });
  res.status(200).json(snippets);
});

// @desc    Get a single audio snippet by ID
// @route   GET /api/audio/:id
// @access  Public
const getSnippetById = asyncHandler(async (req, res) => {
  const snippet = await AudioSnippet.findById(req.params.id).populate(
    "creator venue event artist",
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
  const snippets = await AudioSnippet.find({ creator: req.params.userId })
    .populate("creator venue event artist")
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
      snippet.creator.toString() !== req.user._id.toString() &&
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
      r.reactionType === reactionType,
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
  await updatedSnippet.populate("creator venue event artist");

  res.status(200).json(updatedSnippet);
});

// @desc    Create sample data for testing
// @route   POST /api/audio/create-sample
// @access  Public (for development only)
const createSampleData = asyncHandler(async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    res.status(403);
    throw new Error("Sample data creation not allowed in production");
  }

  try {
    // Create a sample user if none exists
    const User = require("../models/userModel.cjs");
    let sampleUser = await User.findOne({ username: "SampleUser" });

    if (!sampleUser) {
      sampleUser = await User.create({
        username: "SampleUser",
        email: "sample@example.com",
        password: "password123",
      });
    }

    // Create sample audio snippets
    const sampleSnippets = [
      {
        title: "Live Jazz Performance",
        creator: sampleUser._id,
        audioFile: {
          url: "https://example.com/audio/jazz.mp3",
          duration: 180,
          format: "audio/mp3",
          size: 2048000,
        },
        stats: {
          likes: 15,
          plays: 50,
          shares: 3,
        },
        tags: ["jazz", "live", "performance"],
        type: "performance",
        privacy: "public",
      },
      {
        title: "Acoustic Guitar Solo",
        creator: sampleUser._id,
        audioFile: {
          url: "https://example.com/audio/acoustic.mp3",
          duration: 240,
          format: "audio/mp3",
          size: 3072000,
        },
        stats: {
          likes: 25,
          plays: 80,
          shares: 5,
        },
        tags: ["acoustic", "guitar", "solo"],
        type: "performance",
        privacy: "public",
      },
      {
        title: "Electronic Beat",
        creator: sampleUser._id,
        audioFile: {
          url: "https://example.com/audio/electronic.mp3",
          duration: 195,
          format: "audio/mp3",
          size: 2560000,
        },
        stats: {
          likes: 42,
          plays: 120,
          shares: 8,
        },
        tags: ["electronic", "beat", "live"],
        type: "performance",
        privacy: "public",
      },
    ];

    // Clear existing snippets and create new ones
    await AudioSnippet.deleteMany({});
    const createdSnippets = await AudioSnippet.insertMany(sampleSnippets);

    res.status(201).json({
      message: `Created ${createdSnippets.length} sample audio snippets`,
      snippets: createdSnippets,
    });
  } catch (error) {
    console.error("Error creating sample data:", error);
    res.status(500);
    throw new Error("Failed to create sample data");
  }
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
  createSampleData,
};
