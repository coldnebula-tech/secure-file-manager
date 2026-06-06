const fs = require('fs');
const path = require('path');

// fileService.js
// Beginner-friendly filesystem helpers for the demo application.
// All operations are rooted under `server/storage/files` to avoid accidental
// access to other parts of the filesystem. `getSafePath` enforces that.

const storageRoot = path.resolve(__dirname, '../storage/files');
if (!fs.existsSync(storageRoot)) {
  fs.mkdirSync(storageRoot, { recursive: true });
}

/**
 * Resolve a relative storage path to an absolute safe path inside the
 * storage root. This removes simple path-traversal attempts and validates
 * that the resulting path is under the storage root.
 *
 * @param {string} relativePath - The relative path provided by callers (may be empty).
 * @returns {string} Absolute filesystem path inside the storage root.
 * @throws {Error} If the resolved path is outside the storage root.
 */
function getSafePath(relativePath) {
  // Remove path-traversal attempts and resolve against storageRoot
  const cleanPath = relativePath ? relativePath.replace(/\.\.+/g, '') : '';
  const fullPath = path.resolve(storageRoot, cleanPath);

  if (!fullPath.startsWith(storageRoot)) {
    throw new Error('Invalid path provided.');
  }

  return fullPath;
}

/**
 * Format a millisecond timestamp as YYYY-MM-DD.
 *
 * @param {number} timestamp - Milliseconds since epoch.
 * @returns {string} Formatted date string.
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a number of bytes into a human-friendly size string.
 * Examples: `512 B`, `2 KB`, `1.2 MB`.
 *
 * @param {number} bytes - Size in bytes.
 * @returns {string} Human readable size.
 */
function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * List files and folders inside a given relative path under the storage root.
 *
 * @param {string} [relativePath=''] - Relative folder path inside storage.
 * @returns {Array<Object>} Array of item descriptors: { id, name, type, size, modified }.
 * @throws {Error} If the path does not exist or is invalid.
 */
function listItems(relativePath = '') {
  const directoryPath = getSafePath(relativePath);

  if (!fs.existsSync(directoryPath)) {
    throw new Error('Path does not exist.');
  }

  const itemNames = fs.readdirSync(directoryPath);
  return itemNames.map((name) => {
    const itemPath = path.join(directoryPath, name);
    const stats = fs.statSync(itemPath);
    const isFolder = stats.isDirectory();

    return {
      id: path.join(relativePath, name),
      name,
      type: isFolder ? 'folder' : 'file',
      size: isFolder ? 'Folder' : formatSize(stats.size),
      modified: formatDate(stats.mtimeMs)
    };
  });
}

/**
 * Create a new folder under `relativePath` with the given `folderName`.
 *
 * @param {string} relativePath - Parent folder relative path.
 * @param {string} folderName - Name of the folder to create.
 * @throws {Error} If an item with the same name already exists.
 */
function createFolder(relativePath, folderName) {
  const parentPath = getSafePath(relativePath);
  const newFolderPath = path.join(parentPath, folderName);

  if (fs.existsSync(newFolderPath)) {
    throw new Error('A file or folder with that name already exists.');
  }

  fs.mkdirSync(newFolderPath);
}

/**
 * Rename an item inside `relativePath` from `oldName` to `newName`.
 *
 * @param {string} relativePath - Parent folder relative path.
 * @param {string} oldName - Current name of the item.
 * @param {string} newName - New desired name for the item.
 * @throws {Error} If the old item doesn't exist or the new name already exists.
 */
function renameItem(relativePath, oldName, newName) {
  const parentPath = getSafePath(relativePath);
  const oldPath = path.join(parentPath, oldName);
  const newPath = path.join(parentPath, newName);

  if (!fs.existsSync(oldPath)) {
    throw new Error('Item to rename does not exist.');
  }

  if (fs.existsSync(newPath)) {
    throw new Error('A file or folder with the new name already exists.');
  }

  fs.renameSync(oldPath, newPath);
}

/**
 * Delete a file or folder inside `relativePath` with name `itemName`.
 * Folders are removed recursively.
 *
 * @param {string} relativePath - Parent folder relative path.
 * @param {string} itemName - Name of the file or folder to delete.
 * @throws {Error} If the item does not exist.
 */
function deleteItem(relativePath, itemName) {
  const parentPath = getSafePath(relativePath);
  const itemPath = path.join(parentPath, itemName);

  if (!fs.existsSync(itemPath)) {
    throw new Error('Item to delete does not exist.');
  }

  const stats = fs.statSync(itemPath);
  if (stats.isDirectory()) {
    fs.rmSync(itemPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(itemPath);
  }
}

/**
 * Generate a filesystem-safe unique name in `folderPath` by appending
 * `-N` before the file extension when a collision exists.
 *
 * @param {string} folderPath - Absolute folder path on disk.
 * @param {string} fileName - Original file name.
 * @returns {string} A candidate filename that does not collide with existing files.
 */
function generateUniqueName(folderPath, fileName) {
  let candidate = fileName;
  let counter = 1;

  while (fs.existsSync(path.join(folderPath, candidate))) {
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    candidate = `${baseName}-${counter}${extension}`;
    counter += 1;
  }

  return candidate;
}

/**
 * Move an uploaded temporary file into the storage folder, ensuring a unique
 * filename. Returns a descriptor similar to `listItems`.
 *
 * @param {string} relativePath - Target relative folder path inside storage.
 * @param {Object} file - Multer file object with `path` and `originalname`.
 * @returns {Object} File descriptor: { id, name, type, size, modified }.
 */
function saveUploadedFile(relativePath, file) {
  const targetFolder = getSafePath(relativePath);

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const safeFileName = generateUniqueName(targetFolder, file.originalname);
  const destinationPath = path.join(targetFolder, safeFileName);
  fs.renameSync(file.path, destinationPath);

  const stats = fs.statSync(destinationPath);
  return {
    id: path.join(relativePath, safeFileName),
    name: safeFileName,
    type: 'file',
    size: formatSize(stats.size),
    modified: formatDate(stats.mtimeMs)
  };
}

module.exports = {
  listItems,
  createFolder,
  renameItem,
  deleteItem,
  saveUploadedFile
};
 
// Export helper for routes that need the absolute file path
module.exports.getSafePath = getSafePath;

