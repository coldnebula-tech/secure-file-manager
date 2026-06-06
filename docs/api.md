# API Documentation

## Authentication
- `POST /api/auth/login` — Login with username and password, get JWT token

## Files
- `GET /api/files` — List files and folders (requires auth)
- `POST /api/files/upload` — Upload files (requires auth)
- `POST /api/files/rename` — Rename a file/folder (requires auth)
- `DELETE /api/files/delete` — Delete a file/folder (requires auth)
- `GET /api/files/download` — Download a file (requires auth)

## Folders
- `GET /api/folders` — List folder contents (requires auth)
- `POST /api/folders/create` — Create a new folder (requires auth)

## Admin (User Management)
- `GET /api/admin/users` — List all users (admin only)
- `POST /api/admin/users/add` — Add a new user (admin only)
- `POST /api/admin/users/change-password` — Change user password (admin or self)
- `POST /api/admin/users/change-username` — Change username (admin only)
- `DELETE /api/admin/users/:userId` — Delete a user (admin only)

## Authentication

All endpoints except `/api/auth/login` require the `Authorization: Bearer <token>` header.

### Get Token
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

Response:
```json
{
  "success": true,
  "user": { "id": 1, "username": "admin" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Use Token
```
GET /api/files
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Admin Endpoints

### Add User
```
POST /api/admin/users/add
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "username": "john",
  "password": "secure123"
}
```

### List Users
```
GET /api/admin/users
Authorization: Bearer <admin_token>
```

### Change Password
```
POST /api/admin/users/change-password
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 2,
  "newPassword": "newpassword123"
}
```

### Change Username
```
POST /api/admin/users/change-username
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 2,
  "newUsername": "newusername"
}
```

### Delete User
```
DELETE /api/admin/users/2
Authorization: Bearer <admin_token>
```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description here"
}
```

Common HTTP status codes:
- `200` — Success
- `400` — Bad request (invalid input)
- `401` — Unauthorized (missing or invalid token)
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `500` — Server error
