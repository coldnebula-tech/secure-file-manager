// auth.js
// Handles the simple login flow for the beginner demo.
// - Sends credentials to the backend for validation
// - Stores a simple authentication flag in localStorage

/**
 * DOMContentLoaded handler for the login page. Redirects already-authenticated
 * users to the appropriate page and attaches the login form handler.
 *
 * @returns {void}
 */
document.addEventListener('DOMContentLoaded', () => {
  const isAuthenticated = localStorage.getItem('filemanager-authenticated');
  const isLocked = localStorage.getItem('filemanager-locked');

  // If the user is already logged-in and locked, send to lock screen
  if (isAuthenticated && isLocked) {
    window.location.href = '../lock/lock.html';
    return;
  }

  // If logged-in and not locked, go to manager directly
  if (isAuthenticated && !isLocked) {
    window.location.href = '../manager/manager.html';
    return;
  }

  // Attach the login form handler
  /**
   * Login form submit handler. Sends credentials to the server and, on
   * success, stores a simple authenticated flag in localStorage for the demo.
   *
   * @param {Event} event - Submit event from the login form.
   * @returns {Promise<void>}
   */
  document.getElementById('login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const username = usernameInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!username || !password) {
      window.alert('Please enter both username and password.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!result.success) {
        window.alert(result.message || 'Login failed.');
        return;
      }

      // Store a very simple authenticated flag (for demo only)
      localStorage.setItem('filemanager-authenticated', 'true');
      localStorage.setItem('filemanager-user', username);
      localStorage.removeItem('filemanager-locked');

      window.location.href = '../manager/manager.html';
    } catch (error) {
      console.error('Login error', error);
      window.alert('Unable to reach the server. Please try again.');
    }
  });
});
