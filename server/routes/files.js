const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileService = require('../services/fileService');
const searchService = require('../services/searchService');
const sortService = require('../services/sortService');

const auth = require('../middleware/auth');
const router = express.Router();

// Protect all file routes with authentication for the demo
router.use(auth);

// files.js
// Routes for listing, uploading, renaming, deleting and downloading files.
// These endpoints are intentionally simple for the beginner demo.

const uploadTempDir = path.resolve(__dirname, '../storage/tmp');
if (!fs.existsSync(uploadTempDir)) {
  fs.mkdirSync(uploadTempDir, { recursive: true });
}

// File upload limits: 10 MB per file. You can adjust `MAX_FILE_SIZE_BYTES` via env.
const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_BYTES) || 10 * 1024 * 1024;

const upload = multer({ dest: uploadTempDir, limits: { fileSize: MAX_FILE_SIZE_BYTES } });

/**
 * GET /api/files
 * List files and folders for a given path, with optional search and sort.
 *
 * Query params: `path`, `search`, `sortBy`, `order`.
 */
router.get('/', (req, res) => {
  const relativePath = req.query.path || '';
  const searchQuery = req.query.search || '';
  const sortKey = req.query.sortBy || 'name';
  const sortOrder = req.query.order || 'asc';

  try {
    let items = fileService.listItems(relativePath);
    items = searchService.searchItems(items, searchQuery);
    items = sortService.sortItems(items, sortKey, sortOrder);

    res.json({ success: true, items });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/files/upload
 * Handle multipart file uploads (field name `files`). Optional body
 * field `path` indicates the target folder inside storage.
 */
router.post('/upload', upload.array('files'), (req, res) => {
  const relativePath = req.body.path || '';
  const files = req.files || [];

  if (files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files were uploaded.' });
  }

  try {
    const savedFiles = files.map((file) => fileService.saveUploadedFile(relativePath, file));
    res.json({ success: true, files: savedFiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/files/rename
 * Rename an item inside a folder. Body: { path, oldName, newName }
 */
router.post('/rename', (req, res) => {
  const relativePath = req.body.path || '';
  const oldName = req.body.oldName || '';
  const newName = req.body.newName || '';

  if (!oldName || !newName) {
    return res.status(400).json({
      success: false,
      message: 'Old name and new name are required.'
    });
  }

  try {
    fileService.renameItem(relativePath, oldName, newName);
    res.json({ success: true, message: 'Item renamed successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/files/delete
 * Delete an item. Query params: `path`, `name`.
 */
router.delete('/delete', (req, res) => {
  const relativePath = req.query.path || '';
  const itemName = req.query.name || '';

  if (!itemName) {
    return res.status(400).json({
      success: false,
      message: 'Item name is required for deletion.'
    });
  }

  try {
    fileService.deleteItem(relativePath, itemName);
    res.json({ success: true, message: 'Item deleted successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Download a file. Query params: ?path=<relative folder>&name=<file name>
/**
 * GET /api/files/download
 * Stream a file to the client as an attachment. Query params: `path`, `name`.
 */
router.get('/download', (req, res) => {
  const relativePath = req.query.path || '';
  const name = req.query.name || '';

  if (!name) {
    return res.status(400).json({ success: false, message: 'File name is required.' });
  }

  try {
    // Use fileService to resolve the absolute safe path
    const absolutePath = fileService.getSafePath(path.join(relativePath, name));

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // Stream file to client as an attachment
    res.download(absolutePath, name);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
