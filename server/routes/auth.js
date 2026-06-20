const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const { User } = require('../config/db');
const router = express.Router();

// auth.js
// Secure authentication improvements for demo:
// - Accepts plaintext legacy passwords and migrates them to bcrypt hashes
// - Validates input with Joi
// - Issues JWT tokens (keep `JWT_SECRET` in environment for production)

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});
/**
 * POST /api/auth/login
 * Authenticate a user. Accepts `{ username, password }` in the request body.
 * Legacy plaintext passwords will be migrated to bcrypt hashes on first
 * successful login.
 */
router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const username = value.username.trim();
  const password = value.password.trim();

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const stored = user.password || '';

    if (stored.startsWith('$2')) {
      // bcrypt hash
      const ok = await bcrypt.compare(password, stored);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    } else {
      // legacy plaintext — verify and migrate to bcrypt
      if (password !== stored) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      const newHash = await bcrypt.hash(password, SALT_ROUNDS);
      user.password = newHash;
      // Persist migration
      try {
        await user.save();
      } catch (writeErr) {
        console.error('Failed to migrate user password to hash:', writeErr);
      }
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, user: { id: user.id, username: user.username }, token });
  } catch (err) {
    console.error('Authentication error', err);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
});

module.exports = router;
