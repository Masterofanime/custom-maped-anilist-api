const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const ANILIST_URL = 'https://graphql.anilist.co';

/**
 * Helper: Fetch data from AniList
 */
const fetchAniList = async (query, variables = {}) => {
    try {
        const response = await axios.post(ANILIST_URL, { query, variables }, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });
        return response.data.data;
    } catch (err) {
        console.error("AniList API Error:", err.response?.data || err.message);
        return null;
    }
};

/**
 * Helper: Transform AniList Media into your Documentation Schema
 */
const transformAnime = (media) => {
    if (!media) return null;
    return {
        id: media.id.toString(),
        data_id: media.id,
        poster: media.coverImage?.extraLarge || media.coverImage?.large,
        title: media.title?.english || media.title?.romaji,
        japanese_title: media.title?.native || media.title?.romaji,
        description: media.description?.replace(/<[^>]*>?/gm, '') || "",
        tvInfo: {
            showType: media.format || "TV",
            duration: media.duration ? `${media.duration}m` : "N/A",
            releaseDate: media.seasonYear ? `${media.season} ${media.seasonYear}` : "N/A",
            quality: "HD",
            sub: media.episodes || 0,
            dub: 0, // AniList doesn't distinguish sub/dub counts easily
            eps: media.episodes || 0
        },
        adultContent: media.isAdult || false
    };
};

// --- ENDPOINTS ---

// 1. GET Home Info (spotlights, trending, latest)
app.get('/api/home', async (req, res) => {
    const query = `query {
        trending: Page(page: 1, perPage: 10) { media(sort: TRENDING_DESC, type: ANIME) { id title { english romaji native } bannerImage coverImage { extraLarge } description format duration season seasonYear episodes } }
        popular: Page(page: 1, perPage: 10) { media(sort: POPULARITY_DESC, type: ANIME) { id title { english romaji native } coverImage { extraLarge } description format episodes } }
    }`;
    const data = await fetchAniList(query);
    if (!data) return res.status(500).json({ success: false, message: "AniList Error" });

    res.json({
        success: true,
        results: {
            spotlights: data.trending.media.map(transformAnime),
            trending: data.trending.media.map((a, i) => ({ ...transformAnime(a), number: i + 1 })),
            latestEpisode: data.popular.media.map(transformAnime),
            genres: ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"]
        }
    });
});

// 2. GET Top 10
app.get('/api/top-ten', async (req, res) => {
    const query = `{ Page(perPage: 10) { media(sort: SCORE_DESC, type: ANIME) { id title { english } coverImage { large } format episodes } } }`;
    const data = await fetchAniList(query);
    const list = data?.Page.media.map(transformAnime) || [];
    res.json({ success: true, results: { today: list, week: list, month: list } });
});

// 3. GET Specified Anime's Info
app.get('/api/info', async (req, res) => {
    const query = `query ($id: Int) {
        Media(id: $id) {
            id title { english native romaji } description coverImage { extraLarge } format status season seasonYear episodes duration averageScore genres isAdult
            studios(isMain: true) { nodes { name } }
        }
    }`;
    const data = await fetchAniList(query, { id: parseInt(req.query.id) });
    if (!data) return res.status(404).json({ success: false });

    const anime = data.Media;
    res.json({
        success: true,
        results: {
            data: transformAnime(anime),
            animeInfo: {
                Overview: anime.description?.replace(/<[^>]*>?/gm, ''),
                Status: anime.status,
                "MAL Score": (anime.averageScore / 10).toFixed(2),
                Genres: anime.genres,
                Studios: anime.studios.nodes[0]?.name || "N/A"
            }
        }
    });
});

// 4. GET Categories (Genres & Types)
app.get('/api/:category', async (req, res) => {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    
    // Simple logic to handle genres vs types
    let vars = { page };
    let filter = "sort: POPULARITY_DESC";
    
    if (category.startsWith("genre-")) {
        vars.genre = category.replace("genre-", "");
        filter = `genre: $genre`;
    }

    const query = `query ($page: Int, $genre: String) {
        Page(page: $page, perPage: 20) {
            pageInfo { lastPage }
            media(${filter}, type: ANIME) { id title { english romaji } coverImage { large } format episodes duration description }
        }
    }`;

    const data = await fetchAniList(query, vars);
    res.json({
        success: true,
        results: {
            totalPages: data?.Page.pageInfo.lastPage || 1,
            data: data?.Page.media.map(transformAnime) || []
        }
    });
});

// 5. GET Search Results
app.get('/api/search', async (req, res) => {
    const query = `query ($search: String) {
        Page(perPage: 20) { media(search: $search, type: ANIME) { id title { english romaji } coverImage { large } format episodes } }
    }`;
    const data = await fetchAniList(query, { search: req.query.keyword });
    res.json({ success: true, results: data?.Page.media.map(transformAnime) || [] });
});

// 6. GET Episode List
app.get('/api/episodes/:id', async (req, res) => {
    const query = `query ($id: Int) { Media(id: $id) { episodes streamingEpisodes { title thumbnail } } }`;
    const data = await fetchAniList(query, { id: parseInt(req.params.id) });
    const episodes = data?.Media.streamingEpisodes.map((ep, i) => ({
        episode_no: i + 1,
        title: ep.title || `Episode ${i + 1}`,
        id: `${req.params.id}-ep-${i + 1}`
    })) || [];

    res.json({ success: true, results: { totalEpisodes: data?.Media.episodes || 0, episodes } });
});

// 7. GET Character List
app.get('/api/character/list/:id', async (req, res) => {
    const query = `query ($id: Int) {
        Media(id: $id) {
            characters(sort: ROLE, perPage: 15) {
                edges {
                    node { id name { full } image { large } }
                    voiceActors(language: JAPANESE) { id name { full } image { large } }
                    role
                }
            }
        }
    }`;
    const data = await fetchAniList(query, { id: parseInt(req.params.id) });
    const characters = data?.Media.characters.edges.map(edge => ({
        character: {
            id: edge.node.id.toString(),
            name: edge.node.name.full,
            poster: edge.node.image.large,
            cast: edge.role
        },
        voiceActors: edge.voiceActors.map(va => ({
            id: va.id.toString(),
            name: va.name.full,
            poster: va.image.large
        }))
    })) || [];

    res.json({ success: true, results: { data: characters } });
});

// 8. GET Schedule
app.get('/api/schedule', async (req, res) => {
    const date = Math.floor(Date.now() / 1000);
    const query = `query ($date: Int) {
        Page { airingSchedules(airingAt_greater: $date, sort: TIME) {
            episode airingAt media { id title { english romaji } }
        } }
    }`;
    const data = await fetchAniList(query, { date });
    const schedule = data?.Page.airingSchedules.map(s => ({
        id: s.media.id.toString(),
        title: s.media.title.english || s.media.title.romaji,
        time: new Date(s.airingAt * 1000).toLocaleTimeString(),
        episode_no: s.episode
    })) || [];

    res.json({ success: true, results: schedule });
});

// 9. Streaming Fallback
app.get(['/api/stream', '/api/servers/:id'], (req, res) => {
    res.json({
        success: false,
        message: "AniList is a metadata provider. For video links, integrate a scraper like GogoAnime."
    });
});

app.listen(PORT, () => {
    console.log(`Updated API Scraper running at http://localhost:${PORT}`);
});