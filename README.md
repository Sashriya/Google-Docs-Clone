# 📝 Google Docs Clone

A real-time collaborative document editor inspired by Google Docs. Multiple users can edit the same document simultaneously, with changes synced instantly across all connected clients.

---

## ✨ Features

- 🔄 **Real-time collaboration** — live document syncing across all users via WebSockets
- ✍️ **Rich text editing** — powered by Quill.js with full formatting toolbar (headings, bold, italic, lists, colors, alignment, and more)
- 📄 **Multiple documents** — each document gets a unique URL using UUID, allowing separate editing sessions
- 💾 **Auto-save** — document content is persisted to MongoDB at regular intervals
- 📡 **Socket.io events** — delta-based change transmission so only diffs are sent, not the entire document

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **React** — UI framework
- **Quill.js** — rich text editor
- **Socket.io-client** — real-time WebSocket communication
- **React Router DOM** — document routing via UUID
- **UUID** — unique document ID generation

### Backend (`/server`)
- **Node.js** — runtime
- **Express** — HTTP server
- **Socket.io** — WebSocket server
- **Mongoose** — MongoDB ODM
- **MongoDB** — document persistence

---

## 📁 Project Structure

```
Google-Docs-Clone/
├── client/               # React frontend
│   ├── src/
│   │   ├── TextEditor.js # Quill editor + Socket.io logic
│   │   └── App.js        # Route setup with UUID redirect
│   └── package.json
│
└── server/               # Node.js backend
    ├── server.js         # Socket.io events + MongoDB logic
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/Sashriya/Google-Docs-Clone.git
cd Google-Docs-Clone
```

### 2. Start the Backend
```bash
cd server
npm install
npm run devStart
```
Server runs on `http://localhost:3001`

### 3. Start the Frontend
```bash
cd client
npm install
npm start
```
Client runs on `http://localhost:3000`

### 4. Open in Browser
Visit `http://localhost:3000` — you'll be redirected to a unique document URL automatically. Open the same URL in another tab or browser to test real-time collaboration.

---

## ⚙️ How It Works

1. When a user opens the app, they are redirected to a unique document ID (UUID).
2. The client connects to the Socket.io server and requests the document by ID.
3. The server loads the document from MongoDB (or creates a new one) and sends it back.
4. As the user types, Quill emits `text-change` events — only the **delta** (the diff) is sent to the server via Socket.io.
5. The server broadcasts the delta to all other clients editing the same document.
6. Every 2 seconds, the server saves the current document state to MongoDB.

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `quill` | Rich text editor |
| `socket.io` | Real-time WebSocket server |
| `socket.io-client` | WebSocket client |
| `mongoose` | MongoDB object modeling |
| `uuid` | Unique document IDs |
| `react-router-dom` | Client-side routing |

---

## 🔮 Future Improvements

- [ ] User authentication and document ownership
- [ ] Document list / dashboard per user
- [ ] Cursor presence (see where other users are typing)
- [ ] Document sharing with permissions
- [ ] Export to PDF / DOCX

---

## 👤 Author

**Sashriya** — [github.com/Sashriya](https://github.com/Sashriya)
