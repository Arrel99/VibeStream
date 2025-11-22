// ==================== Podcast Player Class ====================
// Handles podcast-specific playback and episode management

class PodcastPlayer {
    constructor(libraryManager) {
        this.library = libraryManager;
        this.audio = new Audio();
        this.currentEpisode = null;
        this.queue = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.progressSaveInterval = null;

        this.setupAudioEvents();
    }

    setupAudioEvents() {
        this.audio.addEventListener('ended', () => this.onEpisodeEnded());
        this.audio.addEventListener('error', (e) => this.onError(e));
        this.audio.addEventListener('timeupdate', () => {
            if (this.onTimeUpdate) this.onTimeUpdate();
        });
        this.audio.addEventListener('loadedmetadata', () => {
            if (this.onMetadataLoaded) this.onMetadataLoaded();
        });
        this.audio.addEventListener('play', () => {
            this.startProgressTracking();
        });
        this.audio.addEventListener('pause', () => {
            this.stopProgressTracking();
            this.saveProgress();
        });
    }

    // ==================== Playback Control ====================
    async playEpisode(episode, queue = null, startIndex = 0) {
        try {
            // Set queue if provided
            if (queue) {
                this.queue = queue;
                this.currentIndex = startIndex;
            }

            // Load audio from file path
            this.currentEpisode = episode;
            this.audio.src = episode.audioFile;
            this.audio.load();

            // Resume from saved progress if available
            if (episode.progress && episode.progress > 0) {
                this.audio.currentTime = episode.progress;
            }

            await this.audio.play();
            this.isPlaying = true;

            // Update play count
            this.library.incrementPlayCount(episode.id, 'podcast');

            return true;
        } catch (error) {
            console.error('Error playing episode:', error);
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

        this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        const nextEpisode = this.queue[this.currentIndex];
        await this.playEpisode(nextEpisode, this.queue, this.currentIndex);
        return nextEpisode;
    }

    async previous() {
        if (this.queue.length === 0) return null;

        // If current time > 3s, restart current episode
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return this.currentEpisode;
        }

        this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
        const prevEpisode = this.queue[this.currentIndex];
        await this.playEpisode(prevEpisode, this.queue, this.currentIndex);
        return prevEpisode;
    }

    seek(time) {
        this.audio.currentTime = time;
    }

    skipForward(seconds = 30) {
        this.audio.currentTime = Math.min(
            this.audio.currentTime + seconds,
            this.audio.duration
        );
    }

    skipBackward(seconds = 30) {
        this.audio.currentTime = Math.max(
            this.audio.currentTime - seconds,
            0
        );
    }

    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }

    getVolume() {
        return this.audio.volume;
    }

    setPlaybackSpeed(speed) {
        this.audio.playbackRate = speed;
    }

    getPlaybackSpeed() {
        return this.audio.playbackRate;
    }

    // ==================== Progress Tracking ====================
    startProgressTracking() {
        // Save progress every 5 seconds while playing
        this.progressSaveInterval = setInterval(() => {
            this.saveProgress();
        }, 5000);
    }

    stopProgressTracking() {
        if (this.progressSaveInterval) {
            clearInterval(this.progressSaveInterval);
            this.progressSaveInterval = null;
        }
    }

    saveProgress() {
        if (!this.currentEpisode || !this.audio.duration) return;

        const progress = this.audio.currentTime;
        const duration = this.audio.duration;
        const percentComplete = (progress / duration) * 100;

        // Update library
        this.library.updatePodcastProgress(
            this.currentEpisode.id,
            progress,
            percentComplete
        );
    }

    async onEpisodeEnded() {
        // Mark as completed
        if (this.currentEpisode) {
            this.library.updatePodcastProgress(
                this.currentEpisode.id,
                0,
                100
            );
        }

        // Auto-play next episode if available
        if (this.currentIndex < this.queue.length - 1) {
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
    getAllEpisodes() {
        return this.library.getAllPodcasts();
    }

    getEpisodesByShow(show) {
        return this.library.getPodcastsByShow(show);
    }

    getInProgressEpisodes() {
        return this.library.getInProgressPodcasts();
    }

    getNewEpisodes(limit = 6) {
        return this.library.getNewPodcasts(limit);
    }

    getRecentlyListened(limit = 6) {
        return this.library.getRecentlyListenedPodcasts(limit);
    }

    getAllShows() {
        return this.library.getAllShows();
    }

    searchEpisodes(query) {
        return this.library.searchPodcasts(query);
    }

    // ==================== Utility ====================
    getCurrentTime() {
        return this.audio.currentTime;
    }

    getDuration() {
        return this.audio.duration;
    }

    getProgressPercentage() {
        if (!this.audio.duration) return 0;
        return (this.audio.currentTime / this.audio.duration) * 100;
    }

    destroy() {
        this.stopProgressTracking();
        this.pause();
        this.audio.src = '';
    }
}

// Export for use in other modules
window.PodcastPlayer = PodcastPlayer;
