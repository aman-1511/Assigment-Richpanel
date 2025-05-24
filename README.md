# Richpanel Assignment – Facebook Helpdesk

## Overview
This project is a **Facebook Helpdesk** web application built as a proof-of-concept for Richpanel. It allows businesses to connect their Facebook pages, listen to Messenger messages, and reply to them from a unified, team-friendly interface. The app supports user registration, Facebook page integration, real-time messaging, and a clean, modern UI inspired by the provided reference designs.

---
## Screenshots
![Image](https://github.com/user-attachments/assets/599d3d23-c001-47b6-8a6b-e88cf9bd3e8e)
![Image](https://github.com/user-attachments/assets/06f3bf6b-f4f9-44be-afc1-4f0ef3b13198)
![Image](https://github.com/user-attachments/assets/0d54c305-bd53-4666-b0ca-e53e87323734)
![Image](https://github.com/user-attachments/assets/4326ccc8-350d-4be3-a85c-29c87c85174f)
![Image](https://github.com/user-attachments/assets/147b12c0-c216-43ae-8526-1e442e2e71b2)


---

## Features
- **User Authentication:** Register and login with email and password.
- **Facebook Page Integration:** Connect and disconnect Facebook pages using Facebook Login and Graph API permissions.
- **Real-time Messaging:** Listen to and reply to Facebook Messenger messages in real time.
- **Conversation Management:** Messages are grouped into conversations per customer, with new conversations created if 24+ hours have passed since the last message.
- **Agent Workspace:** Agents can view all conversations, select one, and reply directly from the helpdesk UI.
- **Customer Profile:** View customer details and Facebook profile from the chat interface.
- **Responsive UI:** Clean, modern, and responsive design matching the provided reference screenshots.

---

## Tech Stack
### Backend
- **Node.js** + **Express**
- **MongoDB** (via Mongoose)
- **WebSocket** (for real-time updates)
- **JWT** for authentication
- **Facebook Graph API** integration

### Frontend
- **React** (with hooks and context)
- **Vite** (for fast development)
- **Tailwind CSS** (for styling)
- **Axios** (for API requests)
- **react-facebook-login** (for FB auth)
- **zustand** (for state management)
- **react-toastify** (for notifications)

---

## Folder Structure

```
/Backend
  /src
    /Controllers        # Express middleware/controllers
    /Database           # MongoDB connection
    /Handlers           # Route handlers (Auth, Facebook API, Messages, WebSocket)
    /Models             # Mongoose models (User, Connections, Message)
    /Utils, /Validation # Utilities and validation logic
    index.js            # Main Express app entry point
  package.json          # Backend dependencies and scripts

/src
  /components           # React components (Login, Signup, Chat, FB Connect, etc.)
  /Api                  # Axios API setup
  /hooks                # Custom React hooks (auth, loader)
  /lib                  # Utility functions
  App.jsx               # Main app and routing
  main.jsx              # React entry point
  App.css, index.css    # Styles
  package.json          # Frontend dependencies and scripts
```

---

## Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB (local or Atlas)
- Facebook Developer App (for Messenger API, in development mode)

### 1. Backend Setup
```bash
cd Backend
npm install
# Create a .env file with:
# MONGODB_URI=mongodb://localhost:27017/facebook-helpdesk
# JWT_SECRET=your_jwt_secret
# EBHOOK_VERIFICATION_TOKEN
npm start
```
- The backend runs on **http://localhost:3000** by default.

### 2. Frontend Setup
```bash
npm install
# Create a .env file with:
# VITE_FACEBOOK_APP_ID=your_fb_app_id
# VITE_PUBLIC_URL_ENCODED=your_redirect_url
npm run dev
```
- The frontend runs on **http://localhost:5173** by default.

---

## Usage Flow
1. **Register** a new account or **login**.
2. **Connect your Facebook Page** via the provided button (requires Facebook permissions).
3. **View and manage conversations** as they arrive from Messenger.
4. **Reply to messages** directly from the app; replies are sent to Facebook Messenger.
5. **View customer details** and Facebook profiles from the chat sidebar.
6. **Disconnect** the Facebook page if needed.

---

## API Endpoints (Backend)
- `POST /auth/signup` – Register a new user
- `POST /auth/login` – Login and receive JWT
- `GET /auth/get-user` – Get current user info (JWT required)
- `GET/POST /webhook` – Facebook Messenger webhook
- `GET /messages` – Get all messages for a page
- `POST /messages/send` – Send a message to a customer

---

## Database Models
- **User:** Stores user credentials and info
- **Connections:** Stores Facebook page connection details
- **Message:** Stores messages and conversation metadata

---

## Facebook Integration Notes
- The app uses Facebook Login and Graph API to fetch pages and listen/send messages.
- Only works in Facebook App **development mode** (add test users as needed).
- Requires permissions: `pages_show_list`, `pages_messaging`, `pages_read_engagement`, `pages_manage_metadata`.



## Test Cases
- User registration and login
- Facebook page connection and disconnection
- Real-time message reception and reply
- Conversation grouping (24h rule)
- Customer profile display



