**AniList**.
# Anime API (AniList Bridge)
<p align="center">
<img src="./public/anya.gif" width="200" height="200" />
</p>
A high-performance **RESTful API** built with **Node.js** and **Express**. This API acts as a bridge, transforming **AniList GraphQL** data into a custom, flattened JSON schema designed for modern anime streaming interfaces like **Zenime** or **XEAnime**.
## 🚀 Features
 * **Fast & Scalable:** Built on Node.js with optimized GraphQL queries.
 * **Unified Schema:** Standardized anime objects across all endpoints.
 * **Rich Metadata:** Fetches genres, studios, character cast, and airing schedules.
 * **Easy Deployment:** Pre-configured for Vercel, Render, or local hosting.
## 🛠️ Installation
### Local Setup
Ensure you have Node.js installed on your machine.
 1. **Clone the repository:**
   ```bash
   git clone https://github.com/itzzzme/anime-api.git
   cd anime-api
   
   ```
 2. **Install dependencies:**
   ```bash
   npm install
   
   ```
 3. **Set up Environment Variables:**
   Create a .env file in the root directory:
   ```env
   PORT=3000
   ALLOWED_ORIGIN=https://your-site.com
   
   ```
 4. **Start the server:**
   ```bash
   npm start
   # For development (auto-restart)
   npm run dev
   
   ```
## 📑 Documentation
### 1. GET Home Info
Returns trending anime (spotlights), popular hits, and available genres.
 * **Endpoint:** GET /api/
 * **Response:**
   ```json
   {
     "success": true,
     "results": {
       "spotlights": [...],
       "trending": [...],
       "latestEpisode": [...],
       "genres": ["Action", "Romance", ...]
     }
   }
   
   ```
### 2. GET Anime Details
Fetch comprehensive metadata for a specific anime.
 * **Endpoint:** GET /api/info?id={anilist_id}
 * **Example:** /api/info?id=1535
### 3. GET Search
Search the entire AniList database with keyword support.
 * **Endpoint:** GET /api/search?keyword={query}
 * **Example:** /api/search?keyword=solo%20leveling
### 4. GET Characters
Retrieves the cast list including Voice Actors (JAPANESE).
 * **Endpoint:** GET /api/character/list/{id}
### 5. GET Episode List
Fetches the total episode count and available metadata.
 * **Endpoint:** GET /api/episodes/{id}
### 6. GET Airing Schedule
Returns anime airing today with precise times.
 * **Endpoint:** GET /api/schedule
## 📦 Project Structure
```text
├── public/             # Static assets (Gifs/Images)
├── index.js            # Main server and routes
├── package.json        # Project metadata & dependencies
├── .env                # Configuration
└── README.md           # Documentation

```
## ⚠️ Disclaimer
 * This API **does not store or host any media files**.
 * It serves metadata sourced via the **AniList API**.
 * Streaming and server endpoints currently serve as placeholders; you must integrate your own 3rd party video provider for video playback.
 * Explicitly made for **educational purposes only**.
## 🤝 Support
If you find this project useful, please consider giving it a **Star ✨** on GitHub!
**Developed by miraj** 🫰
