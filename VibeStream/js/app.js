// ==================== Main Application Coordinator ====================
// Manages music and podcast players, UI state, and user interactions

class VibeStreamApp {
    constructor() {
        this.library = new LibraryManager();
        this.musicPlayer = null;
        this.podcastPlayer = null;
        this.activePlayer = null; // 'music' or 'podcast'
        this.currentMode = 'music'; // Default mode
        this.currentPlayingCardId = null; // Track currently playing card

        this.init();
    }

    async init() {
        try {
            // Initialize authentication
            if (!window.authManager) {
                window.authManager = new AuthManager();
                await window.authManager.init();
            }

            // Check if user is logged in
            if (!window.authManager.isAuthenticated()) {
                window.location.href = 'auth.html';
                return;
            }

            // Load library from JSON file
            await this.library.loadLibrary();

            // Load saved state from localStorage (user-specific)
            this.library.loadFromLocalStorage();

            // Initialize players
            this.musicPlayer = new MusicPlayer(this.library);
            this.podcastPlayer = new PodcastPlayer(this.library);

            // Set up player event handlers
            this.setupPlayerEvents();

            // Initialize UI
            this.initializeUI();
            this.bindEvents();

            // Display current user
            const user = window.authManager.getCurrentUser();
            if (user && this.elements.userName) {
                this.elements.userName.textContent = user.name;
            }

            // Load initial content
            await this.switchMode('music');

            console.log('VibeStream initialized successfully!');
        } catch (error) {
            console.error('Error initializing app:', error);
            alert('Error initializing aplikasi. Pastikan library.json tersedia.');
        }
    }

    setupPlayerEvents() {
        // Music player events
        this.musicPlayer.onTimeUpdate = () => this.updateProgress();
        this.musicPlayer.onMetadataLoaded = () => this.updateDuration();
        this.musicPlayer.onPlaybackEnded = () => this.onPlaybackEnded();
        this.musicPlayer.onPlaybackError = (e) => this.onPlaybackError(e);

        // Podcast player events
        this.podcastPlayer.onTimeUpdate = () => this.updateProgress();
        this.podcastPlayer.onMetadataLoaded = () => this.updateDuration();
        this.podcastPlayer.onPlaybackEnded = () => this.onPlaybackEnded();
        this.podcastPlayer.onPlaybackError = (e) => this.onPlaybackError(e);
    }

    initializeUI() {
        this.elements = {
            // Mode switching
            musicTab: document.getElementById('musicTab'),
            podcastTab: document.getElementById('podcastTab'),
            contentArea: document.getElementById('contentArea'),

            // User profile
            userName: document.getElementById('userName'),
            logoutBtn: document.getElementById('logoutBtn'),
            themeBtn: document.getElementById('themeBtn'),

            // Player controls
            playerTitle: document.getElementById('playerTitle'),
            playerArtist: document.getElementById('playerArtist'),
            playBtn: document.getElementById('playBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            shuffleBtn: document.getElementById('shuffleBtn'),
            repeatBtn: document.getElementById('repeatBtn'),

            // Progress
            progressBar: document.getElementById('progressBar'),
            progressFill: document.getElementById('progressFill'),
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime'),

            // Volume
            volumeSlider: document.getElementById('volumeSlider'),

            // Podcast specific
            speedBtn: document.getElementById('speedBtn'),
            skipBackBtn: document.getElementById('skipBackBtn'),
            skipForwardBtn: document.getElementById('skipForwardBtn'),

            // Now Playing Modal
            nowPlayingModal: document.getElementById('nowPlayingModal'),
            closeNowPlaying: document.getElementById('closeNowPlaying'),
            playerBar: document.getElementById('playerBar'),

            // Disk Animation
            disk: document.getElementById('disk'),
            diskCover: document.getElementById('diskCover'),
            mainContentLeft: document.getElementById('mainContentLeft'),

            // Now Playing  elements
            npCover: document.getElementById('nowPlayingCover'),
            npVideo: document.getElementById('nowPlayingVideo'),
            npDisk: document.getElementById('npDisk'),
            npDiskCover: document.getElementById('npDiskCover'),
            npMedia: document.getElementById('nowPlayingMediaContainer'),
            npTitle: document.getElementById('nowPlayingTitle'),
            npArtist: document.getElementById('nowPlayingArtist'),
            npPlayBtn: document.getElementById('npPlayBtn'),
            npPrevBtn: document.getElementById('npPrevBtn'),
            npNextBtn: document.getElementById('npNextBtn'),
            npShuffleBtn: document.getElementById('npShuffleBtn'),
            npRepeatBtn: document.getElementById('npRepeatBtn'),
            npProgressBar: document.getElementById('npProgressBar'),
            npProgressFill: document.getElementById('npProgressFill'),
            npCurrentTime: document.getElementById('npCurrentTime'),
            npTotalTime: document.getElementById('npTotalTime'),
            npVolumeSlider: document.getElementById('npVolumeSlider'),
            npSkipBackBtn: document.getElementById('npSkipBackBtn'),
            npSkipForwardBtn: document.getElementById('npSkipForwardBtn'),
            npSpeedBtn: document.getElementById('npSpeedBtn'),
        };
    }

    bindEvents() {
        // Tab switching
        this.elements.musicTab.addEventListener('click', () => this.switchMode('music'));
        this.elements.podcastTab.addEventListener('click', () => this.switchMode('podcast'));

        // Logout
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.logout();
                }
            });
        }

        // Theme Toggle
        if (this.elements.themeBtn) {
            this.elements.themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Player controls
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.prevBtn.addEventListener('click', () => this.previous());
        this.elements.nextBtn.addEventListener('click', () => this.next());
        this.elements.shuffleBtn?.addEventListener('click', () => this.toggleShuffle());
        this.elements.repeatBtn?.addEventListener('click', () => this.toggleRepeat());

        // Progress bar
        this.elements.progressBar.addEventListener('click', (e) => this.seekTo(e));

        // Volume
        this.elements.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.getActivePlayerInstance().setVolume(volume);
        });

        // Podcast specific controls
        this.elements.speedBtn?.addEventListener('click', () => this.cycleSpeed());
        this.elements.skipBackBtn?.addEventListener('click', () => this.skipBackward());
        this.elements.skipForwardBtn?.addEventListener('click', () => this.skipForward());

        // Now Playing Modal
        this.elements.playerBar?.addEventListener('click', (e) => {
            // Don't open if clicking on buttons
            if (!e.target.closest('button') && !e.target.closest('input')) {
                this.openNowPlaying();
            }
        });

        this.elements.closeNowPlaying?.addEventListener('click', () => this.closeNowPlaying());

        // Now Playing controls
        this.elements.npPlayBtn?.addEventListener('click', () => this.togglePlay());
        this.elements.npPrevBtn?.addEventListener('click', () => this.previous());
        this.elements.npNextBtn?.addEventListener('click', () => this.next());
        this.elements.npShuffleBtn?.addEventListener('click', () => this.toggleShuffle());
        this.elements.npRepeatBtn?.addEventListener('click', () => this.toggleRepeat());
        this.elements.npProgressBar?.addEventListener('click', (e) => this.seekToNP(e));
        this.elements.npVolumeSlider?.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.getActivePlayerInstance().setVolume(volume);
            this.elements.volumeSlider.value = e.target.value; // Sync
        });
        this.elements.npSkipBackBtn?.addEventListener('click', () => this.skipBackward());
        this.elements.npSkipForwardBtn?.addEventListener('click', () => this.skipForward());
        this.elements.npSpeedBtn?.addEventListener('click', () => this.cycleSpeed());
    }

    // ==================== Mode Switching ====================
    async switchMode(mode) {
        this.currentMode = mode;
        this.activePlayer = mode;

        // Update tab UI
        this.elements.musicTab.classList.toggle('active', mode === 'music');
        this.elements.podcastTab.classList.toggle('active', mode === 'podcast');

        // Update player controls visibility
        const podcastControls = document.querySelectorAll('.podcast-only');
        podcastControls.forEach(el => {
            el.style.display = mode === 'podcast' ? 'flex' : 'none';
        });

        const musicControls = document.querySelectorAll('.music-only');
        musicControls.forEach(el => {
            el.style.display = mode === 'music' ? 'flex' : 'none';
        });

        // Load content
        await this.loadContent(mode);
    }

    async loadContent(mode) {
        const container = this.elements.mainContentLeft || this.elements.contentArea;
        container.innerHTML = ''; // Clear current content

        if (mode === 'music') {
            const musicData = await this.library.getAllMusic();
            const popular = this.library.getPopularMusic();
            const newReleases = this.library.getNewMusic();
            this.renderMusic({ popular, newReleases, all: musicData }, container);
        } else {
            const podcastData = await this.library.getAllPodcasts();
            const episodes = this.library.getNewPodcasts();
            this.renderPodcasts({ episodes }, container);
        }

        this.bindCardEvents();
    }

    renderMusic(data, container) {
        if ((!data.popular || data.popular.length === 0) && (!data.newReleases || data.newReleases.length === 0)) {
            container.innerHTML = '<div class="empty">No music available</div>';
            return;
        }

        // Popular Section
        if (data.popular && data.popular.length > 0) {
            const popularSection = document.createElement('div');
            popularSection.className = 'content-section';
            popularSection.innerHTML = '<h2>Popular</h2><div class="grid"></div>';
            const grid = popularSection.querySelector('.grid');

            data.popular.forEach(track => {
                grid.innerHTML += this.createMusicCard(track);
            });

            container.appendChild(popularSection);
        }

        // New Releases Section
        if (data.newReleases && data.newReleases.length > 0) {
            const newSection = document.createElement('div');
            newSection.className = 'content-section';
            newSection.innerHTML = '<h2>New Releases</h2><div class="grid"></div>';
            const grid = newSection.querySelector('.grid');

            data.newReleases.forEach(track => {
                grid.innerHTML += this.createMusicCard(track);
            });

            container.appendChild(newSection);
        }
    }

    renderPodcasts(data, container) {
        if (!data.episodes || data.episodes.length === 0) {
            container.innerHTML = '<div class="empty">No podcasts available</div>';
            return;
        }

        const section = document.createElement('div');
        section.className = 'content-section';
        section.innerHTML = '<h2>Latest Episodes</h2><div class="grid"></div>';
        const grid = section.querySelector('.grid');

        data.episodes.forEach(episode => {
            grid.innerHTML += this.createPodcastCard(episode);
        });

        container.appendChild(section);
    }

    // ==================== Card Creation ====================
    createMusicCard(track) {
        const isPlaying = this.currentPlayingCardId === track.id;
        return `
            <div class="card ${isPlaying ? 'playing' : ''}" data-id="${track.id}" data-type="music">
                <div class="card-cover">
                    ${track.coverFile ? `<img src="${track.coverFile}" alt="${track.title}">` : '<div class="placeholder">♪</div>'}
                    ${isPlaying ? '<div class="equalizer"><div class="equalizer-bar"></div><div class="equalizer-bar"></div><div class="equalizer-bar"></div><div class="equalizer-bar"></div></div>' : ''}
                </div>
                <div class="card-info">
                    <div class="card-title">${this.escapeHtml(track.title)}</div>
                    <div class="card-subtitle">${this.escapeHtml(track.artist)}</div>
                </div>
            </div>
        `;
    }

    createPodcastCard(episode) {
        const progress = episode.percentComplete || 0;
        const isPlaying = this.currentPlayingCardId === episode.id;
        return `
            <div class="card ${isPlaying ? 'playing' : ''}" data-id="${episode.id}" data-type="podcast">
                <div class="card-cover">
                    ${episode.coverFile ? `<img src="${episode.coverFile}" alt="${episode.title}">` : '<div class="placeholder">🎙️</div>'}
                    ${progress > 0 && progress < 100 ? `<div class="progress-indicator" style="width: ${progress}%"></div>` : ''}
                    ${isPlaying ? '<div class="equalizer"><div class="equalizer-bar"></div><div class="equalizer-bar"></div><div class="equalizer-bar"></div><div class="equalizer-bar"></div></div>' : ''}
                </div>
                <div class="card-info">
                    <div class="card-title">${this.escapeHtml(episode.title)}</div>
                    <div class="card-subtitle">${this.escapeHtml(episode.show)}</div>
                </div>
            </div>
        `;
    }

    bindCardEvents() {
        // Bind click events
        const container = this.elements.mainContentLeft || this.elements.contentArea;
        const cards = container.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('click', async () => {
                const id = card.dataset.id;
                const type = card.dataset.type;

                if (type === 'music') {
                    const track = this.library.getMusicById(id);
                    const allTracks = this.library.getAllMusic(); // Use all tracks for queue
                    const index = allTracks.findIndex(t => t.id === id);
                    await this.playMusic(track, allTracks, index);
                } else {
                    const episode = this.library.getPodcastById(id);
                    const allEpisodes = this.library.getAllPodcasts();
                    const index = allEpisodes.findIndex(e => e.id === id);
                    await this.playPodcast(episode, allEpisodes, index);
                }
            });
        });
    }

    // ==================== Playback Methods ====================
    async playMusic(track, queue, index) {
        try {
            await this.musicPlayer.playTrack(track, queue, index);
            this.currentPlayingCardId = track.id;
            this.updateNowPlaying(track);
            this.updatePlayButton(true);
            // Reload content to update card states
            await this.loadContent(this.currentMode);

            // Scroll to top to show disk animation
            if (this.elements.contentArea) {
                this.elements.contentArea.scrollTop = 0;
            }

            // Open Now Playing Modal
            this.openNowPlaying();
        } catch (error) {
            alert('Error playing music: ' + error.message);
        }
    }

    async playPodcast(episode, queue, index) {
        try {
            await this.podcastPlayer.playEpisode(episode, queue, index);
            this.currentPlayingCardId = episode.id;
            this.updateNowPlaying(episode);
            this.updatePlayButton(true);
            // Reload content to update card states
            await this.loadContent(this.currentMode);

            // Scroll to top to show disk animation
            if (this.elements.contentArea) {
                this.elements.contentArea.scrollTop = 0;
            }

            // Open Now Playing Modal
            this.openNowPlaying();
        } catch (error) {
            alert('Error playing podcast: ' + error.message);
        }
    }

    togglePlay() {
        this.getActivePlayerInstance().togglePlay();
        this.updatePlayButton(this.getActivePlayerInstance().isPlaying);
    }

    async next() {
        const player = this.getActivePlayerInstance();
        if (this.currentMode === 'music') {
            const nextTrack = await player.next();
            if (nextTrack) this.updateNowPlaying(nextTrack);
        } else {
            const nextEpisode = await player.next();
            if (nextEpisode) this.updateNowPlaying(nextEpisode);
        }
    }

    async previous() {
        const player = this.getActivePlayerInstance();
        if (this.currentMode === 'music') {
            const prevTrack = await player.previous();
            if (prevTrack) this.updateNowPlaying(prevTrack);
        } else {
            const prevEpisode = await player.previous();
            if (prevEpisode) this.updateNowPlaying(prevEpisode);
        }
    }

    toggleShuffle() {
        const isActive = this.musicPlayer.toggleShuffle();
        this.elements.shuffleBtn.classList.toggle('active', isActive);
    }

    toggleRepeat() {
        const isActive = this.musicPlayer.toggleRepeat();
        this.elements.repeatBtn.classList.toggle('active', isActive);
    }

    seekTo(e) {
        const rect = e.target.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.getActivePlayerInstance().seekTo(percent);
    }

    cycleSpeed() {
        const speed = this.podcastPlayer.cycleSpeed();
        this.elements.speedBtn.textContent = `${speed}x`;
    }

    skipBackward() {
        this.podcastPlayer.skipBackward();
    }

    skipForward() {
        this.podcastPlayer.skipForward();
    }

    // ==================== UI Updates ====================
    updateNowPlaying(item) {
        this.elements.playerTitle.textContent = item.title;
        if (this.currentMode === 'music') {
            this.elements.playerArtist.textContent = item.artist;
        } else {
            this.elements.playerArtist.textContent = item.show;
        }

        // Update Disk Cover
        if (this.elements.diskCover) {
            this.elements.diskCover.src = item.coverFile || '';
        }

        // Update Now Playing Modal View if active
        if (this.elements.nowPlayingModal && this.elements.nowPlayingModal.classList.contains('active')) {
            this.updateNowPlayingView();
        }
    }

    updatePlayButton(isPlaying) {
        this.elements.playBtn.textContent = isPlaying ? '⏸' : '▶';
        if (this.elements.npPlayBtn) {
            this.elements.npPlayBtn.textContent = isPlaying ? '⏸' : '▶';
        }

        // Update Disk Animation (Main)
        if (this.elements.disk) {
            if (isPlaying) {
                this.elements.disk.classList.add('playing');
                this.elements.disk.classList.remove('paused');
            } else {
                this.elements.disk.classList.add('paused');
            }
        }

        // Update Modal Disk Animation
        if (this.elements.npDisk && this.elements.npMedia) {
            if (isPlaying) {
                this.elements.npDisk.classList.add('playing');
                this.elements.npDisk.classList.remove('paused');
                this.elements.npMedia.classList.add('playing'); // Slide out
            } else {
                this.elements.npDisk.classList.add('paused');
                this.elements.npMedia.classList.remove('playing'); // Slide back
            }
        }
    }

    updateProgress() {
        const player = this.getActivePlayerInstance();
        const current = player.getCurrentTime();
        const duration = player.getDuration();

        this.elements.currentTime.textContent = this.formatTime(current);
        const percent = duration > 0 ? (current / duration) * 100 : 0;
        this.elements.progressFill.style.width = `${percent}%`;

        // Update Now Playing progress
        if (this.elements.npCurrentTime) {
            this.elements.npCurrentTime.textContent = this.formatTime(current);
            this.elements.npProgressFill.style.width = `${percent}%`;
        }
    }

    updateDuration() {
        const player = this.getActivePlayerInstance();
        const duration = player.getDuration();
        this.elements.totalTime.textContent = this.formatTime(duration);

        // Update Now Playing duration
        if (this.elements.npTotalTime) {
            this.elements.npTotalTime.textContent = this.formatTime(duration);
        }
    }

    toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        body.setAttribute('data-theme', newTheme);
        this.elements.themeBtn.textContent = newTheme === 'light' ? '🌙' : '☀';

        // Save preference
        localStorage.setItem('vibestream_theme', newTheme);
    }


    // ==================== Utility Methods ====================
    getActivePlayerInstance() {
        return this.currentMode === 'music' ? this.musicPlayer : this.podcastPlayer;
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== Event Handlers ====================
    onPlaybackEnded() {
        this.next();
    }

    onPlaybackError(error) {
        console.error('Playback error:', error);
        alert('Error during playback: ' + error.message);
    }

    // ==================== Now Playing Modal ====================
    openNowPlaying() {
        if (!this.elements.nowPlayingModal) return;

        this.elements.nowPlayingModal.classList.add('active');
        this.updateNowPlayingView();
    }

    closeNowPlaying() {
        if (!this.elements.nowPlayingModal) return;
        this.elements.nowPlayingModal.classList.remove('active');
    }

    updateNowPlayingView() {
        const player = this.getActivePlayerInstance();
        let currentItem;

        if (this.currentMode === 'music') {
            currentItem = this.musicPlayer.currentTrack;
        } else {
            currentItem = this.podcastPlayer.currentEpisode;
        }

        if (!currentItem) return;

        // Update cover/video (for now just cover, video support next)
        this.elements.npCover.src = currentItem.coverFile || '';
        this.elements.npCover.style.display = 'block';
        this.elements.npVideo.style.display = 'none';

        // Update Disk Cover
        if (this.elements.npDiskCover) {
            this.elements.npDiskCover.src = currentItem.coverFile || '';
        }

        // Update info
        this.elements.npTitle.textContent = currentItem.title;
        if (this.currentMode === 'music') {
            this.elements.npArtist.textContent = currentItem.artist;
        } else {
            this.elements.npArtist.textContent = currentItem.show;
        }

        // Update button states
        this.updatePlayButton(player.isPlaying);

        // Sync volume
        this.elements.npVolumeSlider.value = this.elements.volumeSlider.value;

        // Update shuffle/repeat state (music only)
        if (this.currentMode === 'music' && this.elements.npShuffleBtn) {
            this.elements.npShuffleBtn.classList.toggle('active', this.musicPlayer.isShuffled);
            this.elements.npRepeatBtn.classList.toggle('active', this.musicPlayer.isRepeating);
        }
    }

    seekToNP(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const player = this.getActivePlayerInstance();
        const duration = player.getDuration();
        player.seek(duration * percent);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VibeStreamApp();
});
