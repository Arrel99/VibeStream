// ==================== Library Manager (JSON-based) ====================
// Loads music and podcasts from library.json file

class LibraryManager {
    constructor() {
        this.library = null;
        this.libraryPath = 'library.json';
    }

    async loadLibrary() {
        try {
            const response = await fetch(this.libraryPath);
            if (!response.ok) {
                throw new Error('Failed to load library.json');
            }
            this.library = await response.json();
            console.log('Library loaded:', this.library);
            return this.library;
        } catch (error) {
            console.error('Error loading library:', error);
            // Return empty library if file not found
            return { music: [], podcasts: [] };
        }
    }

    // ==================== Music Methods ====================
    getAllMusic() {
        return this.library?.music || [];
    }

    getMusicById(id) {
        return this.getAllMusic().find(track => track.id === id);
    }

    getPopularMusic(limit = 6) {
        return this.getAllMusic()
            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
            .slice(0, limit);
    }

    getNewMusic(limit = 6) {
        return this.getAllMusic()
            .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
            .slice(0, limit);
    }

    getMusicRecommendations(limit = 6) {
        const music = this.getAllMusic();
        const shuffled = [...music].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, limit);
    }

    getMusicByArtist(artist) {
        return this.getAllMusic().filter(t => t.artist === artist);
    }

    getMusicByAlbum(album) {
        return this.getAllMusic().filter(t => t.album === album);
    }

    getMusicByGenre(genre) {
        return this.getAllMusic().filter(t => t.genre === genre);
    }

    searchMusic(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllMusic().filter(track =>
            track.title.toLowerCase().includes(lowerQuery) ||
            track.artist.toLowerCase().includes(lowerQuery) ||
            (track.album && track.album.toLowerCase().includes(lowerQuery)) ||
            (track.genre && track.genre.toLowerCase().includes(lowerQuery))
        );
    }

    // ==================== Podcast Methods ====================
    getAllPodcasts() {
        return this.library?.podcasts || [];
    }

    getPodcastById(id) {
        return this.getAllPodcasts().find(ep => ep.id === id);
    }

    getPodcastsByShow(show) {
        return this.getAllPodcasts().filter(e => e.show === show);
    }

    getInProgressPodcasts() {
        return this.getAllPodcasts()
            .filter(e => e.progress > 0 && e.percentComplete < 100)
            .sort((a, b) => new Date(b.lastListened || 0) - new Date(a.lastListened || 0));
    }

    getNewPodcasts(limit = 6) {
        return this.getAllPodcasts()
            .filter(e => !e.completed)
            .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
            .slice(0, limit);
    }

    getRecentlyListenedPodcasts(limit = 6) {
        return this.getAllPodcasts()
            .filter(e => e.lastListened)
            .sort((a, b) => new Date(b.lastListened) - new Date(a.lastListened))
            .slice(0, limit);
    }

    getAllShows() {
        const shows = new Set(this.getAllPodcasts().map(e => e.show));
        return Array.from(shows);
    }

    searchPodcasts(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllPodcasts().filter(episode =>
            episode.title.toLowerCase().includes(lowerQuery) ||
            episode.show.toLowerCase().includes(lowerQuery) ||
            (episode.description && episode.description.toLowerCase().includes(lowerQuery))
        );
    }

    // ==================== Persistence Methods ====================
    // Note: Browser can't write to files directly
    // These update in-memory only, not library.json
    // User must manually edit library.json for permanent changes

    incrementPlayCount(id, type = 'music') {
        const item = type === 'music' ? this.getMusicById(id) : this.getPodcastById(id);
        if (item) {
            item.playCount = (item.playCount || 0) + 1;
            item.lastPlayed = new Date().toISOString();

            // Save to localStorage for session persistence
            this.saveToLocalStorage();
        }
    }

    updatePodcastProgress(id, progress, percentComplete) {
        const podcast = this.getPodcastById(id);
        if (podcast) {
            podcast.progress = progress;
            podcast.percentComplete = percentComplete;
            podcast.lastListened = new Date().toISOString();

            if (percentComplete >= 100) {
                podcast.completed = true;
                podcast.completedAt = new Date().toISOString();
            }

            // Save to localStorage for session persistence
            this.saveToLocalStorage();
        }
    }

    saveToLocalStorage() {
        try {
            // Get current user ID from auth manager
            const userId = window.authManager?.getCurrentUserId() || 'default';
            const key = `vibestream_library_state_${userId}`;
            localStorage.setItem(key, JSON.stringify(this.library));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            // Get current user ID from auth manager
            const userId = window.authManager?.getCurrentUserId() || 'default';
            const key = `vibestream_library_state_${userId}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                const savedLibrary = JSON.parse(saved);
                // Merge with loaded library (prefer saved play counts and progress)
                this.mergeLibraries(savedLibrary);
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

    mergeLibraries(savedLibrary) {
        // Merge music
        if (savedLibrary.music && this.library.music) {
            this.library.music.forEach(track => {
                const saved = savedLibrary.music.find(t => t.id === track.id);
                if (saved) {
                    track.playCount = saved.playCount || 0;
                    track.lastPlayed = saved.lastPlayed;
                }
            });
        }

        // Merge podcasts
        if (savedLibrary.podcasts && this.library.podcasts) {
            this.library.podcasts.forEach(episode => {
                const saved = savedLibrary.podcasts.find(e => e.id === episode.id);
                if (saved) {
                    episode.playCount = saved.playCount || 0;
                    episode.progress = saved.progress || 0;
                    episode.percentComplete = saved.percentComplete || 0;
                    episode.lastListened = saved.lastListened;
                    episode.completed = saved.completed;
                    episode.completedAt = saved.completedAt;
                }
            });
        }
    }

    clearLocalStorage() {
        localStorage.removeItem('vibestream_library_state');
    }
}

// Export for use in other modules
window.LibraryManager = LibraryManager;
