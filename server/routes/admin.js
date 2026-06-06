const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const auth = require('../middleware/auth');
const router = express.Router();

// Admin users management routes
// In this demo, user with id=1 (admin) has admin rights
const usersPath = path.resolve(__dirname, '../config/users.json');
const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

/**
 * Load users from the JSON file
 *
 * @returns {Array<Object>} Array of user objects
 */
function loadUsers() {
  return require('../config/users.json');
}

/**
 * Save users back to the JSON file
 *
 * @param {Array<Object>} users - Array of user objects to save
 */
function saveUsers(users) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

/**
 * Check if the authenticated user is an admin (id === 1)
 *
 * @param {Object} user - User object from JWT payload
 * @returns {boolean} True if user is admin
 */
function isAdmin(user) {
  return user && user.id === 1;
}

/**
 * GET /api/admin/users
 * List all users (admin only). Returns usernames and IDs (no passwords).
 */
router.get('/users', auth, (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  const users = loadUsers();
  const sanitized = users.map((u) => ({ id: u.id, username: u.username }));

  res.json({ success: true, users: sanitized });
});

/**
 * POST /api/admin/users/add
 * Add a new user (admin only). Body: { username, password }
 */
router.post('/users/add', auth, async (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const users = loadUsers();
  const { username, password } = value;

  // Check if username already exists
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ success: false, message: 'Username already exists.' });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Find next available ID
    const nextId = Math.max(...users.map((u) => u.id), 0) + 1;

    // Add new user
    const newUser = { id: nextId, username, password: hashedPassword };
    users.push(newUser);
    saveUsers(users);

    res.json({
      success: true,
      message: `User '${username}' created successfully.`,
      user: { id: nextId, username }
    });
  } catch (err) {
    console.error('Error creating user', err);
    res.status(500).json({ success: false, message: 'Error creating user.' });
  }
});

/**
 * POST /api/admin/users/change-password
 * Change a user's password (admin only or user changing own password).
 * Body: { userId, newPassword }
 */
router.post('/users/change-password', auth, async (req, res) => {
  const schema = Joi.object({
    userId: Joi.number().required(),
    newPassword: Joi.string().min(6).required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const { userId, newPassword } = value;

  // Allow users to change their own password or admins to change anyone's
  if (userId !== req.user.id && !isAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'You can only change your own password.' });
  }

  const users = loadUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    saveUsers(users);

    res.json({ success: true, message: `Password changed successfully for user '${user.username}'.` });
  } catch (err) {
    console.error('Error changing password', err);
    res.status(500).json({ success: false, message: 'Error changing password.' });
  }
});

/**
 * POST /api/admin/users/change-username
 * Change a user's username (admin only).
 * Body: { userId, newUsername }
 */
router.post('/users/change-username', auth, (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  const schema = Joi.object({
    userId: Joi.number().required(),
    newUsername: Joi.string().alphanum().min(3).max(30).required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const { userId, newUsername } = value;

  const users = loadUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Check if new username is already taken
  if (users.find((u) => u.username === newUsername && u.id !== userId)) {
    return res.status(400).json({ success: false, message: 'Username already taken.' });
  }

  try {
    const oldUsername = user.username;
    user.username = newUsername;
    saveUsers(users);

    res.json({
      success: true,
      message: `Username changed from '${oldUsername}' to '${newUsername}'.`,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error('Error changing username', err);
    res.status(500).json({ success: false, message: 'Error changing username.' });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete a user (admin only). Cannot delete the admin user (id=1).
 */
router.delete('/users/:userId', auth, (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  const userId = parseInt(req.params.userId, 10);

  if (userId === 1) {
    return res.status(400).json({ success: false, message: 'Cannot delete the admin user.' });
  }

  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  try {
    const deletedUsername = users[userIndex].username;
    users.splice(userIndex, 1);
    saveUsers(users);

    res.json({ success: true, message: `User '${deletedUsername}' deleted successfully.` });
  } catch (err) {
    console.error('Error deleting user', err);
    res.status(500).json({ success: false, message: 'Error deleting user.' });
  }
});

module.exports = router;
