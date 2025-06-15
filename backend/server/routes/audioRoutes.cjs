const express = require("express");
const router = express.Router();
const audioController = require("../controllers/audioController.cjs");

/**
 * @route POST /api/audio/upload
 * @desc Upload audio snippet
 * @access Private
 */
router.post("/upload", audioController.uploadSnippet);

/**
 * @route GET /api/audio/:id
 * @desc Get audio snippet by ID
 * @access Public
 */
router.get("/:id", audioController.getSnippetById);

/**
 * @route GET /api/audio
 * @desc Get all audio snippets with pagination
 * @access Public
 */
router.get("/", audioController.getSnippets);

/**
 * @route DELETE /api/audio/:id
 * @desc Delete audio snippet
 * @access Private
 */
router.delete("/:id", audioController.deleteSnippet);

/**
 * @route POST /api/audio/create-sample
 * @desc Create sample data for testing
 * @access Public (development only)
 */
router.post("/create-sample", audioController.createSampleData);

module.exports = router;
