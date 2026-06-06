// lock middleware
// If APP_LOCKED=true, require an authenticated user (set by auth middleware)
// to proceed. Returns 423 Locked otherwise.

/**
 * Express middleware that enforces a simple application-wide lock when
 * `APP_LOCKED=true`. This middleware expects `req.user` to be populated by
 * an authentication middleware when the app is locked.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
module.exports = (req, res, next) => {
  const appLocked = String(process.env.APP_LOCKED || 'false').toLowerCase() === 'true';

  if (!appLocked) return next();

  if (req.user && req.user.username) {
    return next();
  }

  return res.status(423).json({ success: false, message: 'Application is locked.' });
};
