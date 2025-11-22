# VibeStream - Minimalist Music & Podcast Player

A minimalist web-based music and podcast player with user authentication, built with Vanilla JavaScript.

## Overview

VibeStream is a minimalist music and podcast player web application with a clean, modern design. This project demonstrates a simple yet elegant approach to building a media player using vanilla JavaScript.

## User Authentication

VibeStream includes a basic user management system to allow multiple users to maintain their own listening history, play counts, and podcast progress.

### Demo Accounts

Two demo accounts are pre-configured:
- **admin** / admin123
- **demo** / demo123

### Features
- User login and registration
- Session persistence (auto-login on page refresh)
- Per-user data separation (play counts, progress, etc.)
- Logout functionality

### ⚠️ Security Warning

**THIS IS A DEMO AUTHENTICATION SYSTEM ONLY.** It uses:
- Plain text passwords (no encryption)
- Client-side only authentication (no server validation)
- localStorage for session management

**DO NOT USE THIS IN PRODUCTION.** This is purely for demonstration and local testing purposes.

## Setup and Running the App

### Prerequisites
- A local HTTP server (VibeStream requires HTTP server due to browser security restrictions for loading local files)

### Installation

1. **Clone or download this repository**

2. **Add your media files** to the respective folders:
   - Add music files to `music/` folder
   - Add podcast files to `podcast/` folder
   - Add cover images to `covers/` folder

3. **Update `library.json`** (see File Structure section below for format)

4. **Start a local server** in the project directory. Choose one:

   **Option 1: Using Live Server (VS Code Extension)**
   - Install "Live Server" extension in VS Code
   - Right-click on `auth.html` and select "Open with Live Server"
   
   **Option 2: Using Python**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   Then open `http://localhost:8000/auth.html` in your browser
   
   **Option 3: Using Node.js (http-server)**
   ```bash
   npx http-server -p 8000
   ```
   Then open `http://localhost:8000/auth.html` in your browser

5. **Login** using one of the demo accounts or create a new account

6. **Enjoy!** Browse and play your music and podcasts

## File Structure

```
VibeStream/
├── index.html              # Main application page
├── auth.html               # Login/Register page
├── style.css               # Minimalist styling
├── library.json            # Media library database
├── users.json              # User database (demo only)
├── README.md
├── js/
│   ├── auth.js             # Authentication manager
│   ├── storage.js          # Library manager (loads library.json)
│   ├── music-player.js     # Music player logic
│   ├── podcast-player.js   # Podcast player logic
│   └── app.js              # Main app coordinator
├── music/                  # Music files folder
├── podcast/                # Podcast files folder
└── covers/                 # Cover images folder
```

## Adding Media Files

### library.json Format

**Music Example:**
```json
{
  "music": [
    {
      "id": "music_001",
      "title": "Come Together",
      "artist": "The Beatles",
      "album": "Abbey Road",
      "genre": "Rock",
      "audioFile": "music/the_beatles/abbey_road/come_together.mp3",
      "coverFile": "covers/abbey_road.jpg",
      "duration": 259,
      "playCount": 0,
      "addedDate": "2025-01-15T10:00:00Z"
    }
  ]
}
```

**Podcast Example:**
```json
{
  "podcasts": [
    {
      "id": "podcast_001",
      "title": "Episode 1: Introduction",
      "show": "Tech Talks",
      "description": "First episode of our tech podcast series",
      "audioFile": "podcast/tech_talks/ep001_intro.mp3",
      "coverFile": "covers/tech_talks.jpg",
      "duration": 1800,
      "playCount": 0,
      "progress": 0,
      "percentComplete": 0,
      "addedDate": "2025-01-10T08:00:00Z"
    }
  ]
}
```

## Features

### User Authentication
- ✅ Login with username/password
- ✅ Register new accounts
- ✅ Session persistence
- ✅ Per-user data isolation
- ✅ Logout functionality

### Music Mode
- ✅ Browse by Popular / New Releases / All Music
- ✅ Play, Pause, Next, Previous
- ✅ Shuffle & Repeat
- ✅ Progress bar & volume control
- ✅ Play count tracking (per user)

### Podcast Mode
- ✅ Continue Listening (episode in progress)
- ✅ New Episodes
- ✅ Recently Listened
- ✅ Resume from last position
- ✅ Skip forward/backward 30s
- ✅ Playback speed (1x - 2x)
- ✅ Progress tracking per episode (per user)

## Design

- Monochrome (black/white) + accent pink (#FF006E)
- No gradients, no glassmorphism
- Flat, minimalist design
- Typography-focused
- Responsive

## Technology Stack

- HTML5
- CSS3 (Custom Properties, Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- Web Audio API
- LocalStorage (for user sessions and per-user data)

## Tips

- **ID must be unique**: Use format `music_001`, `music_002`, etc.
- **Relative paths**: All paths relative to `index.html`
- **Duration**: In seconds (optional, auto-detect during playback)
- **addedDate**: ISO 8601 format for sorting
- **Play count**: Auto-saved to localStorage (per user)
- **Progress**: Podcast progress auto-saved to localStorage (per user)
- **Multi-user**: Each user has separate play counts and progress

## License

Free to use.
