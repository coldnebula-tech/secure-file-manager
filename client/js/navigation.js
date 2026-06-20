// navigation.js
// Beginner-friendly manager page script.
// Responsibilities:
// - Load files from the backend
// - Handle search, sort, upload, create/rename/delete dialogs
// - Manage simple page navigation (lock/logout)

// Simple state variables (clear names for beginners)
let currentQuery = '';
let currentSortKey = 'name';
let currentSortOrder = 'asc';
let activeRenameId = null; // currently selected item id for rename
let activeDeleteId = null; // currently selected item id for delete
let currentPath = ''; // folder path shown in the UI ('' = root)

/**
 * Initialize the manager page: check access, wire up UI handlers and render
 * the initial file list.
 *
 * @returns {void}
 */
function initManagerPage() {
  checkManagerAccess();
  updateUserStatus();
  attachActionButtons();
  attachDialogs();
  attachSearch();
  attachSortButtons();
  attachUploadInput();
  attachDragAndDrop();
  renderFileList();
}

/**
 * Attach event listeners to the primary action buttons (upload, new folder,
 * refresh, lock, logout).
 *
 * @returns {void}
 */
function attachActionButtons() {
  document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('upload-input')?.click();
  });

  document.getElementById('new-folder-btn')?.addEventListener('click', () => {
    showDialog('new-folder-dialog');
  });

  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    showTemporaryMessage('Page refreshed.');
    renderFileList();
  });

  document.getElementById('lock-btn')?.addEventListener('click', lockSession);
  document.getElementById('logout-btn')?.addEventListener('click', logoutUser);
}

/**
 * Attach handlers for dialog confirm/cancel buttons (create, rename, delete).
 *
 * @returns {void}
 */
function attachDialogs() {
  document.getElementById('create-folder-confirm')?.addEventListener('click', createNewFolder);
  document.getElementById('create-folder-cancel')?.addEventListener('click', () => hideDialog('new-folder-dialog'));
  document.getElementById('rename-confirm')?.addEventListener('click', renameSelectedItem);
  document.getElementById('rename-cancel')?.addEventListener('click', () => hideDialog('rename-dialog'));
  document.getElementById('delete-confirm')?.addEventListener('click', deleteSelectedItem);
  document.getElementById('delete-cancel')?.addEventListener('click', () => hideDialog('delete-dialog'));
}

/**
 * Attach the search input handler which updates the query and re-renders
 * the file list as the user types.
 *
 * @returns {void}
 */
function attachSearch() {
  const searchInput = document.getElementById('search-input');
  searchInput?.addEventListener('input', (event) => {
    currentQuery = event.target.value.toLowerCase();
    renderFileList();
  });
}

/**
 * Attach click handlers to sort buttons and update the current sort key/order.
 *
 * @returns {void}
 */
function attachSortButtons() {
  const sortButtons = document.querySelectorAll('.sort-button');
  sortButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const sortKey = button.dataset.sortKey;
      if (!sortKey) return;
      if (currentSortKey === sortKey) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortKey = sortKey;
        currentSortOrder = 'asc';
      }
      updateSortLabels();
      renderFileList();
    });
  });
}

/**
 * Attach the file input change handler. Selected files are uploaded to the
 * backend and the file list is refreshed on success.
 *
 * @returns {void}
 */
async function uploadFiles(files) {
  if (files.length === 0) return;

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('path', currentPath);

  try {
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    if (!result.success) {
      window.alert(result.message || 'Upload failed.');
    } else {
      showTemporaryMessage(`${files.length} file(s) uploaded successfully.`);
      renderFileList();
    }
  } catch (error) {
    window.alert('Upload failed. Please try again.');
  }
}

function attachUploadInput() {
  const uploadInput = document.getElementById('upload-input');
  uploadInput?.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    await uploadFiles(files);
    if (uploadInput) {
      uploadInput.value = '';
    }
  });
}

let dragCounter = 0;

function attachDragAndDrop() {
  const overlay = document.getElementById('drag-drop-overlay');

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1 && overlay) {
      overlay.classList.remove('hidden');
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0 && overlay) {
      overlay.classList.add('hidden');
    }
  });

  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (overlay) {
      overlay.classList.add('hidden');
    }

    const files = Array.from(e.dataTransfer.files || []);
    await uploadFiles(files);
  });
}

/**
 * Update the user status element in the UI to show the currently logged-in
 * username. Reads from `localStorage` for the demo.
 *
 * @returns {void}
 */
function updateUserStatus() {
  const userStatus = document.querySelector('.user-status');
  const username = localStorage.getItem('filemanager-user') || 'admin';

  if (userStatus) {
    userStatus.textContent = `User: ${username}`;
  }
}

/**
 * Show a dialog element by removing the `hidden` class.
 *
 * @param {string} dialogId - The id of the dialog element to show.
 * @returns {void}
 */
function showDialog(dialogId) {
  document.getElementById(dialogId)?.classList.remove('hidden');
}

/**
 * Hide a dialog element by adding the `hidden` class.
 *
 * @param {string} dialogId - The id of the dialog element to hide.
 * @returns {void}
 */
function hideDialog(dialogId) {
  document.getElementById(dialogId)?.classList.add('hidden');
}

async function createNewFolder() {
  const input = document.getElementById('new-folder-name');
  const folderName = input?.value.trim();
  if (!folderName) {
    window.alert('Please enter a folder name.');
    return;
  }

  try {
    const response = await fetch('/api/folders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentPath, name: folderName })
    });
    const result = await response.json();

    if (!result.success) {
      window.alert(result.message || 'Could not create folder.');
      return;
    }

    if (input) input.value = '';
    hideDialog('new-folder-dialog');
    renderFileList();
  } catch (error) {
    window.alert('Unable to create folder.');
  }
}

/**
 * Open the rename dialog and pre-fill the current item name.
 *
 * @param {string} itemId - The id of the item to rename.
 * @returns {void}
 */
function openRenameDialog(itemId) {
  activeRenameId = itemId;
  const renameInput = document.getElementById('rename-input');
  const row = document.querySelector(`.file-item[data-id="${itemId}"]`);
  const name = row?.querySelector('.file-name')?.textContent || '';

  if (renameInput) {
    renameInput.value = name;
    showDialog('rename-dialog');
    renameInput.focus();
  }
}

/**
 * Perform the rename action for the currently selected item. Calls the
 * `/api/files/rename` endpoint and refreshes the list on success.
 *
 * @returns {Promise<void>}
 */
async function renameSelectedItem() {
  const renameInput = document.getElementById('rename-input');
  const newName = renameInput?.value.trim();
  const row = document.querySelector(`.file-item[data-id="${activeRenameId}"]`);
  const oldName = row?.querySelector('.file-name')?.textContent || '';

  if (!newName) {
    window.alert('Please enter a new name.');
    return;
  }

  try {
    const response = await fetch('/api/files/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentPath, oldName, newName })
    });
    const result = await response.json();

    if (!result.success) {
      window.alert(result.message || 'Rename failed.');
      return;
    }

    hideDialog('rename-dialog');
    renderFileList();
  } catch (error) {
    window.alert('Unable to rename item.');
  }
}

/**
 * Open the delete confirmation dialog for a specific item.
 *
 * @param {string} itemId - The id of the item to delete.
 * @returns {void}
 */
function openDeleteDialog(itemId) {
  activeDeleteId = itemId;
  const row = document.querySelector(`.file-item[data-id="${itemId}"]`);
  const name = row?.querySelector('.file-name')?.textContent || '';
  const message = document.getElementById('delete-message');

  if (message) {
    message.textContent = `Are you sure you want to delete "${name}"?`;
  }

  showDialog('delete-dialog');
}

/**
 * Delete the currently selected item by calling the `/api/files/delete`
 * endpoint and refresh the list on success.
 *
 * @returns {Promise<void>}
 */
async function deleteSelectedItem() {
  const row = document.querySelector(`.file-item[data-id="${activeDeleteId}"]`);
  const name = row?.querySelector('.file-name')?.textContent || '';

  if (!name) {
    hideDialog('delete-dialog');
    return;
  }

  try {
    const response = await fetch(`/api/files/delete?path=${encodeURIComponent(currentPath)}&name=${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
    const result = await response.json();

    if (!result.success) {
      window.alert(result.message || 'Delete failed.');
      return;
    }

    hideDialog('delete-dialog');
    renderFileList();
  } catch (error) {
    window.alert('Unable to delete item.');
  }
}

/**
 * Display a temporary message to the user. In the demo this simply uses
 * `window.alert` for simplicity.
 *
 * @param {string} message - The message to show.
 * @returns {void}
 */
function showTemporaryMessage(message) {
  window.alert(message);
}

/**
 * Update the breadcrumb UI element according to `currentPath` and attach
 * click handlers for navigation.
 *
 * @returns {void}
 */
function updateBreadcrumb() {
  const breadcrumb = document.querySelector('.breadcrumb');
  if (!breadcrumb) return;

  // If at root, show Home
  if (!currentPath) {
    breadcrumb.innerHTML = `<a href="#" data-path="">Home</a>`;
    return;
  }

  // Build clickable breadcrumb parts for navigation
  const parts = currentPath.split('/').filter(Boolean);
  let pathSoFar = '';
  const nodes = ['<a href="#" data-path="">Home</a>'];
  parts.forEach((p) => {
    pathSoFar = pathSoFar ? `${pathSoFar}/${p}` : p;
    nodes.push(`<a href="#" data-path="${pathSoFar}">${p}</a>`);
  });

  breadcrumb.innerHTML = nodes.join(' &gt; ');

  // Attach click handlers to breadcrumb links
  breadcrumb.querySelectorAll('a[data-path]').forEach((link) => {
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
      const targetPath = link.getAttribute('data-path') || '';
      openFolder(targetPath);
    });
  });
}

// Navigate into the given folder path and refresh the list
/**
 * Navigate into a folder and re-render the file list.
 *
 * @param {string} path - Relative folder path to open ('' = root).
 * @returns {void}
 */
function openFolder(path) {
  currentPath = path || '';
  renderFileList();
}

/**
 * Update the sort button labels to indicate the current sort key and order.
 *
 * @returns {void}
 */
function updateSortLabels() {
  document.querySelectorAll('.sort-button').forEach((button) => {
    const sortKey = button.dataset.sortKey;
    const label = button.dataset.label || button.textContent.trim();

    if (sortKey === currentSortKey) {
      button.classList.add('active');
      button.textContent = `${label} ${currentSortOrder === 'asc' ? '↑' : '↓'}`;
    } else {
      button.classList.remove('active');
      button.textContent = label;
    }
  });
}

/**
 * Update the status bar with the number of items currently shown.
 *
 * @param {number} count - Number of items returned by the server.
 * @returns {void}
 */
function updateStatusBar(count) {
  const itemCount = document.getElementById('item-count');
  if (itemCount) {
    itemCount.textContent = String(count);
  }
}

/**
 * Fetch items from the server using the current path, query and sort
 * parameters.
 *
 * @returns {Promise<Array>} Array of item descriptors from the server.
 */
async function fetchItems() {
  try {
    const url = `/api/files?path=${encodeURIComponent(currentPath)}&search=${encodeURIComponent(currentQuery)}&sortBy=${encodeURIComponent(currentSortKey)}&order=${encodeURIComponent(currentSortOrder)}`;
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      window.alert(result.message || 'Unable to load items.');
      return [];
    }

    return result.items || [];
  } catch (error) {
    window.alert('Unable to reach the server.');
    return [];
  }
}

/**
 * Render the file list into the DOM by fetching items and building the
 * HTML for each item. Also attaches per-item action handlers (rename,
 * delete, download, open folder).
 *
 * @returns {Promise<void>}
 */
async function renderFileList() {
  const fileList = document.getElementById('file-list');
  const items = await fetchItems();

  if (!fileList) return;

  fileList.innerHTML = items
    .map((item) => {
      // Add a download button for files and allow folders to be opened
      const actions = [];
      actions.push('<button type="button" class="rename-btn">Rename</button>');
      actions.push('<button type="button" class="delete-btn">Delete</button>');
      if (item.type === 'file') {
        actions.push(`<button type="button" class="download-btn" data-name="${item.name}">Download</button>`);
      }

      return `
        <div class="file-item ${item.type}" data-id="${item.id}" data-name="${item.name}">
          <span class="file-name" role="button">${item.name}</span>
          <span class="file-size">${item.size}</span>
          <span class="file-modified">${item.modified}</span>
          <span class="file-actions">${actions.join('')}</span>
        </div>
      `;
    })
    .join('');

  fileList.querySelectorAll('.rename-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const row = event.target.closest('.file-item');
      const itemId = row?.dataset.id;
      if (itemId) openRenameDialog(itemId);
    });
  });

  fileList.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const row = event.target.closest('.file-item');
      const itemId = row?.dataset.id;
      if (itemId) openDeleteDialog(itemId);
    });
  });

  // Download handler for files
  fileList.querySelectorAll('.download-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const row = event.target.closest('.file-item');
      const name = row?.dataset.name;
      if (!name) return;
      // Use browser navigation to trigger a file download from the server
      const url = `/api/files/download?path=${encodeURIComponent(currentPath)}&name=${encodeURIComponent(name)}`;
      window.location.href = url;
    });
  });

  // Allow clicking the name to open folders
  fileList.querySelectorAll('.file-item.folder .file-name').forEach((el) => {
    el.addEventListener('click', (event) => {
      const row = event.target.closest('.file-item');
      const id = row?.dataset.id || '';
      if (id) openFolder(id);
    });
  });

  updateStatusBar(items.length);
  updateSortLabels();
  updateBreadcrumb();
}

function lockSession() {
  localStorage.setItem('filemanager-locked', 'true');
  window.location.href = '../lock/lock.html';
}

function logoutUser() {
  localStorage.removeItem('filemanager-authenticated');
  localStorage.removeItem('filemanager-user');
  localStorage.removeItem('filemanager-locked');
  window.location.href = '../login/login.html';
}

function checkManagerAccess() {
  const isAuthenticated = localStorage.getItem('filemanager-authenticated');
  const isLocked = localStorage.getItem('filemanager-locked');

  if (!isAuthenticated) {
    window.location.href = '../login/login.html';
    return;
  }

  if (isLocked) {
    window.location.href = '../lock/lock.html';
  }
}

document.addEventListener('DOMContentLoaded', initManagerPage);
