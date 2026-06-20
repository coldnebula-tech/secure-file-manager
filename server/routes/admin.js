const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const auth = require('../middleware/auth');
const { User } = require('../config/db');
const router = express.Router();

// Admin users management routes
// In this demo, user with id=1 (admin) has admin rights
const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

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
router.get('/users', auth, async (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  try {
    const users = await User.findAll();
    const sanitized = users.map((u) => ({ id: u.id, username: u.username }));
    res.json({ success: true, users: sanitized });
  } catch (err) {
    console.error('Error listing users', err);
    res.status(500).json({ success: false, message: 'Error listing users.' });
  }
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

  const { username, password } = value;

  try {
    // Check if username already exists
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Add new user
    const newUser = await User.create({ username, password: hashedPassword });

    res.json({
      success: true,
      message: `User '${username}' created successfully.`,
      user: { id: newUser.id, username }
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

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    await user.save();

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
router.post('/users/change-username', auth, async (req, res) => {
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

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if new username is already taken
    const existing = await User.findOne({ where: { username: newUsername } });
    if (existing && existing.id !== userId) {
      return res.status(400).json({ success: false, message: 'Username already taken.' });
    }

    const oldUsername = user.username;
    user.username = newUsername;
    await user.save();

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
router.delete('/users/:userId', auth, async (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  const userId = parseInt(req.params.userId, 10);

  if (userId === 1) {
    return res.status(400).json({ success: false, message: 'Cannot delete the admin user.' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const deletedUsername = user.username;
    await user.destroy();

    res.json({ success: true, message: `User '${deletedUsername}' deleted successfully.` });
  } catch (err) {
    console.error('Error deleting user', err);
    res.status(500).json({ success: false, message: 'Error deleting user.' });
  }
});

module.exports = router;
