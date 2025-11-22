// ==================== Music Player Class ====================
// Handles music-specific playback and library management

class MusicPlayer {
    constructor(libraryManager) {
        this.library = libraryManager;
        this.audio = new Audio();
        this.currentTrack = null;
        this.queue = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 'off'; // 'off', 'all', 'one'

        this.setupAudioEvents();
    }

    setupAudioEvents() {
        this.audio.addEventListener('ended', () => this.onTrackEnded());
        this.audio.addEventListener('error', (e) => this.onError(e));
        this.audio.addEventListener('timeupdate', () => {
            if (this.onTimeUpdate) this.onTimeUpdate();
        });
        this.audio.addEventListener('loadedmetadata', () => {
            if (this.onMetadataLoaded) this.onMetadataLoaded();
        });
    }

    // ==================== Playback Control ====================
    async playTrack(track, queue = null, startIndex = 0) {
        try {
            // Set queue if provided
            if (queue) {
                this.queue = queue;
                this.currentIndex = startIndex;
            }

            // Load audio from file path
            this.currentTrack = track;
            this.audio.src = track.audioFile;
            this.audio.load();
            await this.audio.play();
            this.isPlaying = true;

            // Update play count
            this.library.incrementPlayCount(track.id, 'music');

            return true;
        } catch (error) {
            console.error('Error playing track:', error);
            throw error;
        }
    }

    play() {
        if (this.audio.src) {
            this.audio.play();
            this.isPlaying = true;
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    async next() {
        if (this.queue.length === 0) return null;

        if (this.isShuffle) {
            this.currentIndex = Math.floor(Math.random() * this.queue.length);
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        }

        const nextTrack = this.queue[this.currentIndex];
        await this.playTrack(nextTrack, this.queue, this.currentIndex);
        return nextTrack;
    }

    async previous() {
        if (this.queue.length === 0) return null;

        // If current time > 3s, restart current track
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return this.currentTrack;
        }

        if (this.isShuffle) {
            this.currentIndex = Math.floor(Math.random() * this.queue.length);
        } else {
            this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
        }

        const prevTrack = this.queue[this.currentIndex];
        await this.playTrack(prevTrack, this.queue, this.currentIndex);
        return prevTrack;
    }

    seek(time) {
        this.audio.currentTime = time;
    }

    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }

    getVolume() {
        return this.audio.volume;
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        return this.isShuffle;
    }

    toggleRepeat() {
        const modes = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        return this.repeatMode;
    }

    async onTrackEnded() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.play();
        } else if (this.repeatMode === 'all' || this.currentIndex < this.queue.length - 1) {
            await this.next();
        } else {
            this.isPlaying = false;
            if (this.onPlaybackEnded) this.onPlaybackEnded();
        }
    }

    onError(e) {
        console.error('Audio error:', e);
        if (this.onPlaybackError) {
            this.onPlaybackError(e);
        }
    }

    // ==================== Library Access ====================
    getAllTracks() {
        return this.library.getAllMusic();
    }

    getPopularTracks(limit = 6) {
        return this.library.getPopularMusic(limit);
    }

    getNewTracks(limit = 6) {
        return this.library.getNewMusic(limit);
    }

    getRecommendations(limit = 6) {
        return this.library.getMusicRecommendations(limit);
    }

    getTracksByArtist(artist) {
        return this.library.getMusicByArtist(artist);
    }

    getTracksByAlbum(album) {
        return this.library.getMusicByAlbum(album);
    }

    getTracksByGenre(genre) {
        return this.library.getMusicByGenre(genre);
    }

    searchTracks(query) {
        return this.library.searchMusic(query);
    }

    // ==================== Utility ====================
    getCurrentTime() {
        return this.audio.currentTime;
    }

    getDuration() {
        return this.audio.duration;
    }

    destroy() {
        this.pause();
        this.audio.src = '';
    }
}

// Export for use in other modules
window.MusicPlayer = MusicPlayer;
