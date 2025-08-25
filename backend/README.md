# TravelBuddy Backend

This is the backend API for TravelBuddy, built with Node.js, Express, MongoDB, and Passport.js.

## Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Create a `.env` file

Create a `.env` file in the `backend/` directory with the following content:

```env
MONGODB_URI=mongodb://localhost:27017/travelbuddy
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
PORT=5001
```

- **MONGODB_URI**: Your MongoDB connection string (local or Atlas)
- **JWT_SECRET**: Secret for JWT token signing
- **GOOGLE_CLIENT_ID / SECRET**: Credentials from Google Cloud Console for OAuth
- **PORT**: (Optional) Port for backend server (default: 5001)

### 3. Start the server

```sh
npm run dev
```

The API will be available at `http://localhost:5001/api`.

---

## Main Endpoints

- `POST /api/register` — Register user
- `POST /api/login` — Login user
- `GET /api/profile` — Get current user profile
- `PUT /api/profile` — Update user profile
- `GET /api/activities` — List all activities
- `POST /api/activities` — Create activity
- `PUT /api/activities/:id` — Update activity
- `DELETE /api/activities/:id` — Delete activity
- `POST /api/activities/:id/join` — Join activity
- `POST /api/activities/:id/leave` — Leave activity
- `GET /api/activities/:id` — Get activity details
- `GET /api/activities/search` — Search activities
- `GET /api/activities/categories` — List categories
- `GET /api/activities/user/:userId` — Get activities for a user
- `GET /api/notifications` — Get notifications

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create OAuth 2.0 credentials.
3. Set the callback URL to:  
   ```
   http://localhost:5001/auth/google/callback
   ```
4. Add your credentials to `.env`.

---

## WebSocket (Socket.io)

- Real-time chat and notifications are handled via Socket.io on the same port.

---

## License

This project is for educational/demo purposes and made during the internship period on Cantilever
