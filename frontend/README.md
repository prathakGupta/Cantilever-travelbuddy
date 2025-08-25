# TravelBuddy Frontend

This is the frontend for TravelBuddy, built with React, Vite, and Tailwind CSS.

## Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Create a `.env` file

Create a `.env` file in the `frontend/` directory with the following content:

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

- **VITE_API_BASE_URL**: The base URL for your backend API.
- **VITE_GOOGLE_MAPS_API_KEY**: Your Google Maps JavaScript API key (enable Maps JavaScript API and billing in Google Cloud).

### 3. Start the development server

```sh
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

---

## Environment Variables

- **VITE_API_BASE_URL**: Used for all API requests.
- **VITE_GOOGLE_MAPS_API_KEY**: Used for displaying maps in the Map View.

---

## Features

- User authentication (JWT, Google OAuth)
- Activity management (create, join, edit, delete)
- Real-time chat (Socket.io)
- Map view (Google Maps)
- User profiles, following, notifications

---

## License

This project is for educational/demo purposes and made during the internship period on Cantilever