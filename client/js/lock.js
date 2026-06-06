// lock.js
// Simple lock screen behavior for the beginner demo.
// - If the app is not locked, redirect to the correct page
// - Unlock form clears the locked flag and returns to login

/**
 * DOMContentLoaded handler for the lock page. Redirects users away from
 * the lock page if the application is not currently locked, and sets up
 * the unlock form handler when the page is shown.
 *
 * @returns {void}
 */
document.addEventListener('DOMContentLoaded', () => {
  const isLocked = localStorage.getItem('filemanager-locked');
  const isAuthenticated = localStorage.getItem('filemanager-authenticated');

  if (!isLocked) {
    if (isAuthenticated) {
      window.location.href = '../manager/manager.html';
    } else {
      window.location.href = '../login/login.html';
    }
    return;
  }

  /**
   * Unlock form submit handler. Validates that a password is provided and
   * clears the local locked flag on success. This demo does not verify the
   * entered password against a server.
   *
   * @param {Event} event - Submit event from the unlock form.
   * @returns {void}
   */
  document.getElementById('unlock-form')?.addEventListener('submit', (event) => {
    event.preventDefault();

    const passwordInput = document.getElementById('unlock-password');
    const password = passwordInput?.value.trim();

    if (!password) {
      window.alert('Please enter your password to unlock.');
      return;
    }

    // For the beginner demo we simply clear the locked flag.
    try {
      localStorage.removeItem('filemanager-locked');
      window.location.href = '../login/login.html';
    } catch (error) {
      console.error('Unlock error', error);
      window.alert('Unable to unlock. Please try again.');
    }
  });
});
