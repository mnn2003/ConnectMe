# ConnectMe 🔗💬

A WhatsApp-like web app with real-time messaging, voice calls, and user status updates, built with **React, TypeScript, and Firebase**.

![ConnectMe Preview](https://via.placeholder.com/800x400?text=ConnectMe+App+Preview)

## Features ✨
- ✅ **Real-time messaging** (Firestore)
- ✅ **Voice calls** (WebRTC + Firebase)
- ✅ **Online/Offline status**
- ✅ **Typing indicators**
- ✅ **Profile customization** (name, status, profile picture)
- ✅ **User blocking**
- ✅ **Message read receipts**
- ✅ **Dark/Light mode**

## Tech Stack 🛠️

| Frontend       | Backend         | Real-time      | Styling              |
|----------------|------------------|----------------|-----------------------|
| React          | Firebase Auth    | WebRTC         | TailwindCSS           |
| TypeScript     | Firestore        | Socket.IO      | Styled Components     |
| Redux Toolkit  | Cloud Storage    |                |                       |

## Live Demo 🌐

[![Live Demo]( https://img.shields.io/badge/Demo-ConnectMe-blue )](https://connect-me-brown.vercel.app/ )

## Installation ⚙️

### 1. Clone the repository

```bash
git clone https://github.com/mnn2003/ConnectMe.git   
cd ConnectMe
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up Firebase

Create a `.env` file in the root directory with your Firebase config:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run the app

```bash
npm start
# or
yarn start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Firebase Security Rules 🔒

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
    match /messages/{messageId} {
      allow read: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participants;
      allow create: if request.auth != null;
    }
  }
}
```

## Deployment 🚀

```bash
npm run build
firebase login
firebase init
# Select Hosting and configure
firebase deploy
```
