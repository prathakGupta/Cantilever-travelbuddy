# TravelBuddy

TravelBuddy is a full-stack social platform for travelers to discover, join, and create activities, chat in real-time, and connect with others nearby.

## Project Structure

```
/
├── backend/      # Node.js, Express, MongoDB API
├── frontend/     # React, Vite, Tailwind CSS client
└── README.md     # (this file)
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm
- MongoDB (local or Atlas)

### Setup

#### 1. Clone the repository

```sh
git clone <your-repo-url>
cd <your-repo-name>
```

#### 2. Install dependencies

```sh
cd backend
npm install
cd ../frontend
npm install
```

#### 3. Configure Environment Variables

- See [backend/README.md](./backend/README.md) and [frontend/README.md](./frontend/README.md) for `.env` setup.

#### 4. Start the servers

- **Backend:**  
  ```sh
  cd backend
  npm run dev
  ```
- **Frontend:**  
  ```sh
  cd frontend
  npm run dev
  ```

#### 5. Open the app

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## Features

- User authentication (JWT, Google OAuth)
- Activity creation, joining, editing, and search
- Real-time chat (Socket.io)
- Map view (Google Maps API)
- User profiles, following, notifications

---

## Environment Variables

See the respective `README.md` files in `backend/` and `frontend/` for details.

---

## License

This project is for educational/demo purposes and made during the internship period on Cantilever
