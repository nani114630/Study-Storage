// EduVault - Exam Video Player & Study Note Sync
class StudyPlayer {
  constructor() {
    this.videoEl = null;
    this.currentVideo = null;
    this.saveProgressInterval = null;
    this.notes = [];
  }

  init(videoElement) {
    this.videoEl = videoElement;
    this.setupEvents();
    this.setupKeyboardShortcuts();
  }

  loadVideo(video) {
    this.currentVideo = video;
    if (!this.videoEl) return;

    const token = localStorage.getItem('eduvault_token');
    let streamUrl = '';

    if (video.storageProvider === 'external' && video.externalUrl) {
      streamUrl = video.externalUrl;
    } else {
      streamUrl = `/api/videos/${video.id}/stream?token=${token}`;
    }

    this.videoEl.src = streamUrl;

    // Restore last saved watch progress
    this.videoEl.onloadedmetadata = () => {
      const savedTime = video.current_time ?? video.currentTime ?? 0;
      if (savedTime > 5 && (!video.duration || savedTime < video.duration - 10)) {
        this.videoEl.currentTime = savedTime;
      }
    };

    // Start auto progress saving every 6 seconds
    this.startProgressTracker();
  }

  setupEvents() {
    if (!this.videoEl) return;

    // When video completes or nears completion (>95%)
    this.videoEl.ontimeupdate = () => {
      if (this.currentVideo && this.videoEl.duration) {
        const percent = (this.videoEl.currentTime / this.videoEl.duration) * 100;
        if (percent > 95 && !this.currentVideo.completed) {
          this.currentVideo.completed = true;
          this.saveProgress(true);
        }
      }
    };
  }

  setSpeed(speed) {
    if (this.videoEl) {
      this.videoEl.playbackRate = speed;
      // Update UI active pill
      document.querySelectorAll('.speed-pill').forEach(pill => {
        pill.classList.toggle('active', parseFloat(pill.dataset.speed) === speed);
      });
    }
  }

  seekBy(seconds) {
    if (this.videoEl) {
      this.videoEl.currentTime = Math.max(0, Math.min(this.videoEl.duration || Infinity, this.videoEl.currentTime + seconds));
    }
  }

  seekTo(seconds) {
    if (this.videoEl) {
      this.videoEl.currentTime = seconds;
      this.videoEl.play().catch(() => {});
    }
  }

  togglePiP() {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else if (this.videoEl && document.pictureInPictureEnabled) {
      this.videoEl.requestPictureInPicture().catch(() => {});
    }
  }

  toggleFullscreen() {
    const container = document.querySelector('.study-modal');
    if (!document.fullscreenElement) {
      (container || this.videoEl).requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  startProgressTracker() {
    if (this.saveProgressInterval) clearInterval(this.saveProgressInterval);
    this.saveProgressInterval = setInterval(() => {
      this.saveProgress();
    }, 6000);
  }

  stopProgressTracker() {
    if (this.saveProgressInterval) {
      clearInterval(this.saveProgressInterval);
      this.saveProgressInterval = null;
    }
    this.saveProgress(); // Final save
  }

  saveProgress(isCompleted = null) {
    if (!this.currentVideo || !this.videoEl || isNaN(this.videoEl.currentTime)) return;

    const payload = {
      currentTime: Math.floor(this.videoEl.currentTime),
      duration: Math.floor(this.videoEl.duration || this.currentVideo.duration || 0)
    };

    if (isCompleted !== null) {
      payload.completed = isCompleted;
    }

    const token = localStorage.getItem('eduvault_token');
    fetch(`/api/videos/${this.currentVideo.id}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }).catch(err => console.error('Error saving progress:', err));
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing a note or input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      const modal = document.getElementById('studyModal');
      if (!modal || modal.style.display === 'none') return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (this.videoEl.paused) this.videoEl.play();
          else this.videoEl.pause();
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          this.seekBy(-10);
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          this.seekBy(10);
          break;
        case 'f':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'm':
          this.videoEl.muted = !this.videoEl.muted;
          break;
      }
    });
  }

  getCurrentTimeFormatted() {
    if (!this.videoEl) return '00:00';
    const totalSecs = Math.floor(this.videoEl.currentTime || 0);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

window.studyPlayer = new StudyPlayer();
