const express = require('express');
const fileService = require('../services/fileService');
const auth = require('../middleware/auth');
const router = express.Router();

// Protect folder routes with authentication
router.use(auth);

// folders.js
// Simple folder-related routes (list and create). Uses `fileService`
// to perform filesystem-safe operations under the storage root.

/**
 * GET /api/folders
 * List items inside a folder. Query param: `path`.
 */
router.get('/', (req, res) => {
  const relativePath = req.query.path || '';

  try {
    const items = fileService.listItems(relativePath);
    res.json({ success: true, items });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/folders/create
 * Create a new folder. Body: { path, name }
 */
router.post('/create', (req, res) => {
  const relativePath = req.body.path || '';
  const folderName = (req.body.name || '').trim();

  if (!folderName) {
    return res.status(400).json({
      success: false,
      message: 'Folder name is required.'
    });
  }

  try {
    fileService.createFolder(relativePath, folderName);
    res.json({ success: true, message: 'Folder created successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
