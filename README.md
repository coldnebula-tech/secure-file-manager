# File Manager

A beginner-friendly file manager application with a secure Node.js backend and responsive client interface. Upload, organize, rename, delete, and download files with JWT-based authentication and password hashing.

---

## 🎯 Quick Overview

| Feature | Details |
|---------|---------|
| **Authentication** | JWT tokens with bcrypt password hashing |
| **File Operations** | List, upload, rename, delete, download files |
| **Security** | Helmet headers, rate limiting, input validation |
| **Storage** | Sandboxed filesystem under `server/storage/files` |
| **Tech Stack** | Node.js/Express, Vanilla JavaScript, HTML5/CSS3 |

---

## 📁 Project Structure

```
filemanager/
├── server/                 # Node.js backend
│   ├── routes/            # API endpoints (auth, files, folders)
│   ├── middleware/        # Auth & lock middleware
│   ├── services/          # Business logic (file, search, sort)
│   ├── config/            # Configuration (users.json)
│   ├── storage/           # File storage (files/, tmp/)
│   ├── app.js             # Express app setup
│   └── server.js          # Entry point
├── client/                # Frontend (static)
│   ├── pages/            # HTML pages (login, manager, lock)
│   ├── js/               # Client scripts
│   └── css/              # Stylesheets
├── docs/                 # Documentation
├── data/                 # Logs & backups
├── package.json          # Dependencies
├── .env.example          # Environment variables template
├── Dockerfile            # Docker configuration
└── README.md             # This file
```

---

## 🚀 Getting Started (Easiest Way)

### Prerequisites

- **Node.js** (v14 or higher) — [Download here](https://nodejs.org/)
- A text editor or IDE (VS Code recommended)

### Option 1: Windows (PowerShell or Command Prompt)

**Step 1: Install dependencies**
```powershell
cd C:\Users\YourUsername\filemanager
npm install
```

**Step 2: Create environment file**

Copy `.env.example` to `.env` and edit it:
```powershell
Copy-Item .env.example .env
```

Open `.env` in a text editor and ensure:
```
PORT=3000
JWT_SECRET=test_secret_key_for_dev
APP_LOCKED=false
NODE_ENV=development
```

**Step 3: Start the server**
```powershell
npm start
```

**Step 4: Open in browser**
```
http://localhost:3000/pages/login/login.html
```

**Login with:**
- Username: `admin`
- Password: `password`

---

### Option 2: Linux / macOS (Bash / Zsh)

**Step 1: Install dependencies**
```bash
cd ~/filemanager
npm install
```

**Step 2: Create environment file**
```bash
cp .env.example .env
```

Edit `.env`:
```bash
nano .env
# or use your preferred editor (vim, code, etc.)
```

Ensure:
```
PORT=3000
JWT_SECRET=test_secret_key_for_dev
APP_LOCKED=false
NODE_ENV=development
```

**Step 3: Start the server**
```bash
npm start
```

**Step 4: Open in browser**
```
http://localhost:3000/pages/login/login.html
```

**Login with:**
- Username: `admin`
- Password: `password`

---

## 🐳 Running with Docker (All Platforms)

**Build the image:**
```bash
docker build -t filemanager:latest .
```

**Run the container:**
```bash
docker run -p 3000:3000 \
  --env JWT_SECRET=your-secret-here \
  --env NODE_ENV=development \
  filemanager:latest
```

Then open: `http://localhost:3000/pages/login/login.html`

---

## 📚 API Endpoints

All file/folder endpoints require `Authorization: Bearer <token>` header (obtained from login).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with username/password, get JWT |
| `GET` | `/api/files` | List files & folders |
| `POST` | `/api/files/upload` | Upload files (multipart) |
| `POST` | `/api/files/rename` | Rename a file/folder |
| `DELETE` | `/api/files/delete` | Delete a file/folder |
| `GET` | `/api/files/download` | Download a file |
| `GET` | `/api/folders` | List folder contents |
| `POST` | `/api/folders/create` | Create a new folder |
| `GET` | `/api/admin/users` | List all users (admin only) |
| `POST` | `/api/admin/users/add` | Add a new user (admin only) |
| `POST` | `/api/admin/users/change-password` | Change password (own or admin) |
| `POST` | `/api/admin/users/change-username` | Change username (admin only) |
| `DELETE` | `/api/admin/users/:userId` | Delete a user (admin only) |

---

## 👨‍💼 User Management (Admin)

### Getting Your Admin Token

First, login as admin to get a token:

**Windows PowerShell:**
```powershell
$loginResponse = Invoke-WebRequest -Uri http://localhost:3000/api/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"password"}' `
  -UseBasicParsing

$token = ($loginResponse.Content | ConvertFrom-Json).token
Write-Host "Your token: $token"
```

**Linux/macOS:**
```bash
LOGIN_RESPONSE=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Your token: $TOKEN"
```

Then use `$token` (or `$TOKEN`) in the examples below.

### Initial Login

**Default admin account:**
- Username: `admin`
- Password: `password`

⚠️ **Important:** Change the admin password immediately in production!

### Add a New User

**Via cURL (Windows PowerShell):**
```powershell
$token = "YOUR_ADMIN_TOKEN_HERE"

$response = Invoke-WebRequest -Uri http://localhost:3000/api/admin/users/add `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"Authorization" = "Bearer $token"} `
  -Body '{"username":"john","password":"secure123"}' `
  -UseBasicParsing

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Via cURL (Linux/macOS):**
```bash
TOKEN="YOUR_ADMIN_TOKEN_HERE"

curl -X POST http://localhost:3000/api/admin/users/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"secure123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "User 'john' created successfully.",
  "user": { "id": 2, "username": "john" }
}
```

### List All Users

**Via cURL (Windows PowerShell):**
```powershell
$token = "YOUR_ADMIN_TOKEN_HERE"

$response = Invoke-WebRequest -Uri http://localhost:3000/api/admin/users `
  -Method GET `
  -Headers @{"Authorization" = "Bearer $token"} `
  -UseBasicParsing

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Via cURL (Linux/macOS):**
```bash
TOKEN="YOUR_ADMIN_TOKEN_HERE"

curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "users": [
    { "id": 1, "username": "admin" },
    { "id": 2, "username": "john" }
  ]
}
```

### Change User Password

**Via cURL (Windows PowerShell):**
```powershell
$token = "YOUR_ADMIN_TOKEN_HERE"

# Change another user's password (admin only)
$response = Invoke-WebRequest -Uri http://localhost:3000/api/admin/users/change-password `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"Authorization" = "Bearer $token"} `
  -Body '{"userId":2,"newPassword":"newsecure456"}' `
  -UseBasicParsing

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Via cURL (Linux/macOS):**
```bash
TOKEN="YOUR_ADMIN_TOKEN_HERE"

# Change another user's password (admin only)
curl -X POST http://localhost:3000/api/admin/users/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":2,"newPassword":"newsecure456"}'

# Change your own password (any user can do this)
curl -X POST http://localhost:3000/api/admin/users/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":YOUR_USER_ID,"newPassword":"mynewpass123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully for user 'john'."
}
```

### Change Username

**Via cURL (Windows PowerShell):**
```powershell
$token = "YOUR_ADMIN_TOKEN_HERE"

$response = Invoke-WebRequest -Uri http://localhost:3000/api/admin/users/change-username `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"Authorization" = "Bearer $token"} `
  -Body '{"userId":2,"newUsername":"johnsmith"}' `
  -UseBasicParsing

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Via cURL (Linux/macOS):**
```bash
TOKEN="YOUR_ADMIN_TOKEN_HERE"

curl -X POST http://localhost:3000/api/admin/users/change-username \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":2,"newUsername":"johnsmith"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Username changed from 'john' to 'johnsmith'.",
  "user": { "id": 2, "username": "johnsmith" }
}
```

### Delete a User

**Via cURL (Windows PowerShell):**
```powershell
$token = "YOUR_ADMIN_TOKEN_HERE"

$response = Invoke-WebRequest -Uri http://localhost:3000/api/admin/users/2 `
  -Method DELETE `
  -Headers @{"Authorization" = "Bearer $token"} `
  -UseBasicParsing

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Via cURL (Linux/macOS):**
```bash
TOKEN="YOUR_ADMIN_TOKEN_HERE"

curl -X DELETE http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer $TOKEN"
```

---

## � Admin Best Practices

✅ **DO:**
- Change the default admin password immediately
- Use strong passwords (mix uppercase, lowercase, numbers, symbols)
- Regularly review the list of active users
- Delete inactive or compromised user accounts
- Keep audit logs of admin actions (for production)

❌ **DON'T:**
- Share the admin token with other users
- Use the same password for multiple accounts
- Leave default credentials in production
- Store tokens in version control or logs

### Admin User Verification

Only users with `id=1` (the admin user) can:
- Add new users
- List all users
- Change any user's password
- Change any user's username
- Delete users

Any other user can only:
- Change their own password via `/api/admin/users/change-password` with their own user ID

---

## �📚 API Endpoints (File & Folder Operations)

---

## ⚙️ Environment Variables

Create or edit `.env` to customize behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | `dev_secret_change_me` | JWT signing key (CHANGE in production) |
| `NODE_ENV` | `development` | `development` or `production` |
| `APP_LOCKED` | `false` | Set `true` to enable app lock |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Max upload size (10 MB) |
| `BCRYPT_ROUNDS` | `10` | Password hashing cost |
| `CORS_ORIGIN` | (empty) | Restrict CORS origin |
| `LOG_LEVEL` | `info` | Logging level |

---

## 🔐 Security Features

✅ **Implemented:**
- JWT authentication
- Bcrypt password hashing (legacy passwords auto-migrate)
- Helmet security headers
- Rate limiting (120 req/min per IP)
- Upload size limits (10 MB default)
- Input validation with Joi
- HTTPS redirect (production mode)

⚠️ **For Production:**
- [ ] Replace `server/config/users.json` with a real database
- [ ] Use a secure secrets manager for `JWT_SECRET`
- [ ] Terminate TLS at a reverse proxy (Nginx, AWS ALB, etc.)
- [ ] Add structured logging & centralized monitoring
- [ ] Implement automated backups for `server/storage/files`
- [ ] Add file type & malware scanning
- [ ] Add comprehensive tests & CI/CD pipeline
- [ ] Enable WAF (Web Application Firewall) at infrastructure level

---

## 💾 File Storage

- **User files:** `server/storage/files/`
- **Temp uploads:** `server/storage/tmp/`

All paths are sandboxed to prevent directory traversal attacks.

---

## 🧪 Testing the Application

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Test File List (with token)
```bash
curl -X GET http://localhost:3000/api/files \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Without Auth (should fail)
```bash
curl -X GET http://localhost:3000/api/files
# Returns: {"success":false,"message":"Authentication required."}
```

---

## 📖 Documentation Files

- `docs/api.md` — API reference
- `docs/roadmap.md` — Future enhancements
- `.env.example` — Environment variables template

---

## 🛠️ Troubleshooting

**"Port 3000 is already in use"**
```bash
# Windows: Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS: Find and kill process
lsof -ti:3000 | xargs kill -9
```

**"npm: command not found"**
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal/PowerShell

**"Authentication required" on API calls**
- Make sure you obtained a token from `/api/auth/login` first
- Include the token in the `Authorization: Bearer <token>` header

**Server won't start**
- Check that port 3000 is available
- Verify `.env` file exists and `JWT_SECRET` is set
- Run `npm install` again

---

## 🎓 Code Quality

- **JSDoc comments** on all functions for beginners
- **Modular services** (fileService, searchService, sortService)
- **Clear middleware** (auth, lock)
- **Input validation** with Joi schema

---

## 📄 License

MIT — Feel free to use and modify for learning or projects.

---

## 🤝 Contributing

Suggestions and improvements welcome! Open an issue or pull request on GitHub.

---

## 🔗 Quick Links

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [Bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
