// EduVault - Main Application Logic
const App = {
  token: localStorage.getItem('eduvault_token') || '',
  activeSubject: 'all',
  currentFilter: 'all',
  searchQuery: '',
  videos: [],
  subjects: [],
  enteredPin: '',

  init() {
    this.bindAuthEvents();
    this.checkSession();
  },

  // ----------------------------------------------------
  // AUTHENTICATION & LOGIN
  // ----------------------------------------------------
  bindAuthEvents() {
    // PIN pad digits - removed, keeping only email/password
    // Clear PIN
    // Login Form Submit (Email + Password)
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('emailInput').value;
      const password = document.getElementById('passwordInput').value;
      this.submitLogin(email, password);
    });

    // Forgot Password link on login form
    document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('forgotPasswordModal').style.display = 'flex';
      document.getElementById('loginForm').style.display = 'none';
    });

    // Show Login from Forgot Password
    document.getElementById('showLoginFromForgotBtn')?.addEventListener('click', () => {
      document.getElementById('forgotPasswordModal').style.display = 'none';
      document.getElementById('loginForm').style.display = 'block';
    });

    // Open Register Modal
    document.getElementById('openRegisterModalBtn')?.addEventListener('click', () => {
      document.getElementById('registerModal').style.display = 'flex';
    });

    // Close Register Modal
    document.getElementById('closeRegisterBtn')?.addEventListener('click', () => {
      document.getElementById('registerModal').style.display = 'none';
    });

    // Register Form Submit
    document.getElementById('registerForm')?.addEventListener('submit', (e) => {
      this.register(e);
    });

    // Open Settings Modal
    document.getElementById('openSettingsBtn')?.addEventListener('click', () => {
      this.openSettingsModal();
    });

    // Open Profile Modal
    document.getElementById('openProfileBtn')?.addEventListener('click', () => {
      this.openProfileModal();
    });

    // Close Profile Modal
    document.getElementById('closeProfileBtn')?.addEventListener('click', () => {
      document.getElementById('profileModal').style.display = 'none';
    });

    // Close Settings Modal
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'none';
    });

    // Close Change Password Modal
    document.getElementById('closeChangePasswordBtn')?.addEventListener('click', () => {
      document.getElementById('changePasswordModal').style.display = 'none';
    });

    // Close Forgot Password Modal
    document.getElementById('closeForgotPasswordBtn')?.addEventListener('click', () => {
      document.getElementById('forgotPasswordModal').style.display = 'none';
    });

    // Change Password Form Submit
    document.getElementById('changePasswordForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.changePassword();
    });

    // Forgot Password Form Submit
    document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.forgotPassword();
    });

    // Register Form Submit
    document.getElementById('registerForm')?.addEventListener('submit', (e) => {
      this.register(e);
    });

    // Open Settings Modal
    document.getElementById('openSettingsBtn')?.addEventListener('click', () => {
      this.openSettingsModal();
    });

    // Open Profile Modal
    document.getElementById('openProfileBtn')?.addEventListener('click', () => {
      this.openProfileModal();
    });

    // Close Profile Modal
    document.getElementById('closeProfileBtn')?.addEventListener('click', () => {
      document.getElementById('profileModal').style.display = 'none';
    });

    // Close Settings Modal
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'none';
    });

    // Close Change Password Modal
    document.getElementById('closeChangePasswordBtn')?.addEventListener('click', () => {
      document.getElementById('changePasswordModal').style.display = 'none';
    });

    // Close Forgot Password Modal
    document.getElementById('closeForgotPasswordBtn')?.addEventListener('click', () => {
      document.getElementById('forgotPasswordModal').style.display = 'none';
    });

    // Change Password Form Submit
    document.getElementById('changePasswordForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.changePassword();
    });

    // Forgot Password Form Submit
    document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.forgotPassword();
    });

    // Show Login from Forgot Password
    document.getElementById('showLoginFromForgotBtn')?.addEventListener('click', () => {
      document.getElementById('forgotPasswordModal').style.display = 'none';
      document.getElementById('loginForm').style.display = 'block';
    });

    // Register Form Submit
    document.getElementById('registerForm')?.addEventListener('submit', (e) => {
      this.register(e);
    });

    // Open Settings Modal
    document.getElementById('openSettingsBtn')?.addEventListener('click', () => {
      this.openSettingsModal();
    });

    // Open Profile Modal
    document.getElementById('openProfileBtn')?.addEventListener('click', () => {
      this.openProfileModal();
    });

    // Close Profile Modal
    document.getElementById('closeProfileBtn')?.addEventListener('click', () => {
      document.getElementById('profileModal').style.display = 'none';
    });

    // Close Settings Modal
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'none';
    });

    // Close Change Password Modal
    document.getElementById('closeChangePasswordBtn')?.addEventListener('click', () => {
      document.getElementById('changePasswordModal').style.display = 'none';
    });

    // Close Forgot Password Modal
    document.getElementById('closeForgotPasswordBtn')?.addEventListener('click', () => {
      document.getElementById('forgotPasswordModal').style.display = 'none';
    });

    // Change Password Form Submit
    document.getElementById('changePasswordForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.changePassword();
    });

    // Forgot Password Form Submit
    document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.forgotPassword();
    });

    // Show Login from Forgot Password
    document.getElementById('showLoginFromForgotBtn')?.addEventListener('click', () => {
      document.getElementById('forgotPasswordModal').style.display = 'none';
      document.getElementById('loginForm').style.display = 'block';
    });

    // Register Form Submit
    document.getElementById('registerForm')?.addEventListener('submit', (e) => {
      this.register(e);
    });

    // Open Settings Modal
    document.getElementById('openSettingsBtn')?.addEventListener('click', () => {
      this.openSettingsModal();
    });

    // Open Profile Modal
    document.getElementById('openProfileBtn')?.addEventListener('click', () => {
      this.openProfileModal();
    });

    // Close Profile Modal
    document.getElementById('closeProfileBtn')?.addEventListener('click', () => {
      document.getElementById('profileModal').style.display = 'none';
    });

    // Close Settings Modal
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'none';
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      this.logout();
    });
  },

  updatePinDots() {
    // PIN pad removed - keeping for reference
  },

  async submitPin(pin) {
    // PIN submission removed
  },

  async submitLogin(email, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        this.setSession(data.token, data.user);
      } else {
        this.showToast(data.message || 'Invalid email or password', 'error');
      }
    } catch (err) {
      this.showToast('Login error. Please try again.', 'error');
    }
  },

  updateProfileIcon() {
    const initial = this.user?.username ? this.user.username.charAt(0).toUpperCase() : 'U';
    const avatarEl = document.getElementById('profileAvatar');
    const avatarModalEl = document.getElementById('profileAvatarDisplay');
    if (avatarEl) avatarEl.textContent = initial;
    if (avatarModalEl) avatarModalEl.textContent = initial;
  },

  setSession(token, user = null) {
    this.token = token;
    this.user = user;
    localStorage.setItem('eduvault_token', token);
    if (user) {
      localStorage.setItem('eduvault_user', JSON.stringify(user));
    }
    document.getElementById('authView').style.display = 'none';
    document.getElementById('appView').style.display = 'block';
    this.updateProfileIcon();
    this.loadDashboard();
  },

  async checkSession() {
    if (!this.token) {
      // Restore storage provider from localStorage if available
      const savedStorage = localStorage.getItem('eduvault_active_storage');
      if (savedStorage) {
        // Settings will be loaded from database when needed
      }
      // Restore user from localStorage if available
      const savedUser = localStorage.getItem('eduvault_user');
      if (savedUser) {
        try {
          this.user = JSON.parse(savedUser);
        } catch (err) {
          console.error('Error parsing saved user:', err);
        }
      }
      this.showAuthView();
      return;
    }

    try {
      const res = await fetch('/api/auth/status', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!res.ok) {
        // Token validation failed (network error, 401, 403, etc.)
        this.showAuthView();
        return;
      }

      const data = await res.json();

      if (data.authenticated) {
        // Restore storage provider from localStorage before loading dashboard
        const savedStorage = localStorage.getItem('eduvault_active_storage');
        if (savedStorage) {
          const storageModeSelect = document.getElementById('storageModeSelect');
          if (storageModeSelect) {
            storageModeSelect.value = savedStorage;
          }
        }

        // Restore user from localStorage if available
        const savedUser = localStorage.getItem('eduvault_user');
        if (savedUser) {
          try {
            this.user = JSON.parse(savedUser);
          } catch (err) {
            console.error('Error parsing saved user:', err);
          }
        }

        document.getElementById('authView').style.display = 'none';
        document.getElementById('appView').style.display = 'block';
        this.updateProfileIcon();
        this.loadDashboard();
      } else {
        this.showAuthView();
      }
    } catch (err) {
      // Network error - don't show login popup for network issues
      // Just show auth view without error message
      this.showAuthView();
    }
  },

  showAuthView() {
    this.token = '';
    localStorage.removeItem('eduvault_token');
    document.getElementById('authView').style.display = 'flex';
    document.getElementById('appView').style.display = 'none';
    this.enteredPin = '';
    this.updatePinDots();
  },

  logout() {
    this.showAuthView();
    this.showToast('Logged out safely.', 'info');
  },

  async register(e) {
    e?.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!username || !email || !password) {
      this.showToast('Please fill all fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        this.setSession(data.token, data.user);
        document.getElementById('registerSection').style.display = 'none';
        this.showToast('Account created! Welcome!', 'success');
      } else {
        this.showToast(data.message || 'Registration failed', 'error');
      }
    } catch (err) {
      this.showToast('Registration error. Please try again.', 'error');
    }
  },

  showLoginForm() {
    document.getElementById('registerSection').style.display = 'block';
    document.getElementById('pinArea').style.display = 'block';
    document.getElementById('passArea').style.display = 'none';
  },

  // ----------------------------------------------------
  // DASHBOARD & DATA LOADING
  // ----------------------------------------------------
  async loadDashboard() {
    await this.loadSubjects();
    await this.loadVideos();
    this.bindDashboardEvents();
    window.studyPlayer.init(document.getElementById('mainVideoPlayer'));
  },

  async loadSubjects() {
    try {
      const res = await fetch('/api/subjects', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();

      if (data.success) {
        this.subjects = data.subjects;
        this.renderSubjectBar();
        this.populateSubjectDropdowns();
      }
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  },

  async loadVideos() {
    try {
      let url = '/api/videos?';
      if (this.activeSubject !== 'all') url += `subject=${this.activeSubject}&`;
      if (this.currentFilter === 'completed') url += `completed=true&`;
      if (this.currentFilter === 'in_progress') url += `completed=false&`;
      if (this.searchQuery) url += `search=${encodeURIComponent(this.searchQuery)}&`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();

      if (data.success) {
        this.videos = data.videos;
        this.renderVideos();
        this.updateStats();
      }
    } catch (err) {
      console.error('Error loading videos:', err);
    }
  },

  renderSubjectBar() {
    const container = document.getElementById('subjectsBar');
    if (!container) return;

    let html = `
      <div class="subject-chip ${this.activeSubject === 'all' ? 'active' : ''}" data-subject="all">
        <span>📚 All Subjects</span>
        <span class="subject-count">${this.videos.length}</span>
      </div>
    `;

    this.subjects.forEach(sub => {
      const isActive = this.activeSubject === sub.id;
      html += `
        <div class="subject-chip ${isActive ? 'active' : ''}" data-subject="${sub.id}">
          <span>${sub.name}</span>
          <span class="subject-count">${sub.videoCount || 0}</span>
        </div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.subject-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.activeSubject = chip.dataset.subject;
        this.renderSubjectBar();
        this.loadVideos();
      });
    });
  },

  populateSubjectDropdowns() {
    const uploadSelect = document.getElementById('uploadSubject');
    const linkSelect = document.getElementById('linkSubject');

    let options = '';
    this.subjects.forEach(s => {
      options += `<option value="${s.id}">${s.name}</option>`;
    });

    if (uploadSelect) uploadSelect.innerHTML = options;
    if (linkSelect) linkSelect.innerHTML = options;
  },

  renderVideos() {
    const grid = document.getElementById('videosGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    if (this.videos.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    let html = '';
    this.videos.forEach(v => {
      const subject = this.subjects.find(s => s.id === (v.subject_id || v.subjectId)) || { name: 'General' };
      const savedTime = v.current_time ?? v.currentTime ?? 0;
      const percent = (savedTime && v.duration) ? Math.min(100, Math.round((savedTime / v.duration) * 100)) : 0;
      const formattedDuration = this.formatSeconds(v.duration || 0);

      html += `
        <div class="video-card" data-id="${v.id}">
          <div class="video-thumb" onclick="App.openVideoPlayer('${v.id}')">
            <div class="play-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
            ${formattedDuration ? `<span class="video-duration">${formattedDuration}</span>` : ''}
            <div class="video-progress-bar">
              <div class="video-progress-fill" style="width: ${percent}%;"></div>
            </div>
          </div>
          <div class="video-info">
            <div class="video-tags">
              <span class="badge-subject">${subject.name}</span>
              ${v.chapter ? `<span class="badge-chapter">${v.chapter}</span>` : ''}
            </div>
            <h4 class="video-title" title="${v.title}">${v.title}</h4>
            <div class="video-footer">
              <label class="completed-toggle">
                <input type="checkbox" ${v.completed ? 'checked' : ''} onchange="App.toggleCompleted('${v.id}', this.checked)">
                <span>${v.completed ? 'Done' : 'Mark Done'}</span>
              </label>
              <div style="display:flex; align-items:center; gap:6px;">
                <button class="btn-vlc" title="Play in VLC Media Player" onclick="event.stopPropagation(); App.openInVlc('${v.id}')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>VLC</span>
                </button>
                <button class="btn-icon" title="Copy VLC Stream Link (Ctrl+N in VLC)" onclick="event.stopPropagation(); App.copyVlcLink('${v.id}')" style="width:30px; height:30px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button class="btn-icon" title="Delete Lecture" onclick="event.stopPropagation(); App.deleteVideo('${v.id}')" style="width:30px; height:30px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
  },

  updateStats() {
    const totalLecturesEl = document.getElementById('totalLecturesCount');
    const completedCountEl = document.getElementById('completedLecturesCount');
    const syllabusProgressEl = document.getElementById('syllabusProgressPercent');

    const total = this.videos.length;
    const completed = this.videos.filter(v => v.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (totalLecturesEl) totalLecturesEl.innerText = total;
    if (completedCountEl) completedCountEl.innerText = completed;
    if (syllabusProgressEl) syllabusProgressEl.innerText = `${percent}%`;
  },

  formatSeconds(totalSecs) {
    if (!totalSecs || totalSecs <= 0) return '';
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = Math.floor(totalSecs % 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  // ----------------------------------------------------
  // VLC MEDIA PLAYER INTEGRATION (DIRECT PLAY - NO FILE SAVED)
  // ----------------------------------------------------
  async openInVlc(videoId) {
    if (!videoId && window.studyPlayer?.currentVideo) {
      videoId = window.studyPlayer.currentVideo.id;
    }
    if (!videoId) return;

    const token = this.token;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isWindows = /Windows/i.test(navigator.userAgent);
    const vlcPlaylistUrl = `${window.location.origin}/api/videos/${encodeURIComponent(videoId)}/vlc.m3u?token=${encodeURIComponent(token)}`;

    if (isMobile) {
      if (isAndroid) {
        const cleanHostPath = vlcPlaylistUrl.replace(/^https?:\/\//, '');
        window.location.href = `intent://${cleanHostPath}#Intent;scheme=http;type=video/*;package=org.videolan.vlc;end`;
      } else if (isIOS) {
        window.location.href = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(vlcPlaylistUrl)}`;
      } else {
        window.location.href = `vlc://${vlcPlaylistUrl}`;
      }
      this.showToast('Opening video in VLC app...', 'info');
      return;
    }

    // Windows: Use local VLC launcher helper (no .m3u download)
    if (isWindows) {
      this.showToast('Launching VLC Media Player...', 'info');
      try {
        console.log('[VLC Launch] Step 1: Requesting launch token from server...');
        // Request launch token from server
        const response = await fetch(`${window.location.origin}/api/videos/${encodeURIComponent(videoId)}/launch-vlc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('[VLC Launch] Step 1: Server response status:', response.status);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error('[VLC Launch] Step 1: Server error:', errData);
          throw new Error(errData.message || `Launch request failed (HTTP ${response.status})`);
        }

        const data = await response.json();
        console.log('[VLC Launch] Step 1: Server response data:', { success: data.success, hasLaunchToken: !!data.launchToken, videoId: data.videoId, title: data.title });
        if (!data.success || !data.launchToken) {
          throw new Error(data.message || 'Failed to generate launch token');
        }

        // Call local VLC launcher helper
        console.log('[VLC Launch] Step 2: Calling local VLC launcher helper...');
        const launcherResponse = await fetch('http://127.0.0.1:3002/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            launchToken: data.launchToken,
            token: token,
            videoId: videoId,
            title: data.title
          })
        });

        console.log('[VLC Launch] Step 2: Helper response status:', launcherResponse.status);
        if (!launcherResponse.ok) {
          const errData = await launcherResponse.json().catch(() => ({}));
          console.error('[VLC Launch] Step 2: Helper error:', errData);
          throw new Error(errData.message || `VLC launcher failed (HTTP ${launcherResponse.status})`);
        }

        const result = await launcherResponse.json();
        console.log('[VLC Launch] Step 2: Helper response data:', result);
        if (result.success) {
          this.showToast('VLC launched successfully!', 'success');
        } else {
          throw new Error(result.message || 'VLC launcher returned error');
        }
      } catch (err) {
        console.error('Direct VLC launch failed:', err);
        // Fallback: copy link to clipboard
        this.showToast('Could not launch VLC directly. Copying stream link...', 'warning');
        this.copyVlcLink(videoId);
      }
      return;
    }

    // Mac/Linux: try vlc:// protocol handler
    window.location.href = `vlc://${vlcPlaylistUrl}`;
    this.showToast('Opening video in VLC...', 'info');
  },

  copyVlcLink(videoId) {
    if (!videoId && window.studyPlayer?.currentVideo) {
      videoId = window.studyPlayer.currentVideo.id;
    }
    if (!videoId) return;

    const token = this.token;
    const streamUrl = `${window.location.origin}/api/videos/${videoId}/stream?token=${encodeURIComponent(token)}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(streamUrl).then(() => {
        this.showToast('VLC Link copied! In VLC: Media -> Open Network Stream (Ctrl+N) & paste.', 'success');
      }).catch(() => {
        prompt('Copy this link and paste into VLC (Media -> Open Network Stream):', streamUrl);
      });
    } else {
      prompt('Copy this link and paste into VLC (Media -> Open Network Stream):', streamUrl);
    }
  },

  // ----------------------------------------------------
  // VIDEO PLAYER & STUDY MODE
  // ----------------------------------------------------
  async openVideoPlayer(videoId) {
    const video = this.videos.find(v => v.id === videoId);
    if (!video) return;

    document.getElementById('studyVideoTitle').innerText = video.title;
    document.getElementById('studyModal').style.display = 'flex';

    window.studyPlayer.loadVideo(video);
    await this.loadNotes(videoId);

    // Update Speed Pills
    document.querySelectorAll('.speed-pill').forEach(pill => {
      pill.classList.toggle('active', parseFloat(pill.dataset.speed) === 1);
    });
  },

  closeVideoPlayer() {
    window.studyPlayer.stopProgressTracker();
    const videoEl = document.getElementById('mainVideoPlayer');
    if (videoEl) {
      videoEl.pause();
      videoEl.src = '';
    }
    document.getElementById('studyModal').style.display = 'none';
    this.loadVideos();
  },

  async toggleCompleted(videoId, isChecked) {
    try {
      await fetch(`/api/videos/${videoId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ completed: isChecked })
      });
      const v = this.videos.find(item => item.id === videoId);
      if (v) v.completed = isChecked;
      this.updateStats();
    } catch (err) {
      console.error('Error toggling completion:', err);
    }
  },

  async deleteVideo(videoId) {
    if (!confirm('Are you sure you want to remove this video from your cloud?')) return;

    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('Video removed successfully', 'success');
        this.loadVideos();
        this.loadSubjects();
      } else {
        this.showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      this.showToast('Network error while deleting', 'error');
    }
  },

  // ----------------------------------------------------
  // STUDY NOTES
  // ----------------------------------------------------
  async loadNotes(videoId) {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;

    try {
      const res = await fetch(`/api/notes/${videoId}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();

      if (data.success) {
        if (data.notes.length === 0) {
          notesList.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px 10px; font-size:13px;">No study notes yet. Capture formulas, definitions, and key concepts here!</div>`;
          return;
        }

        let html = '';
        data.notes.forEach(note => {
          const timeFormatted = this.formatSeconds(note.timestamp) || '00:00';
          html += `
            <div class="note-item" id="note_${note.id}">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="note-timestamp" onclick="window.studyPlayer.seekTo(${note.timestamp})">
                  ⏱️ ${timeFormatted}
                </span>
                <button class="btn-icon" style="width:24px; height:24px;" onclick="App.deleteNote('${note.id}', '${videoId}')">
                  &times;
                </button>
              </div>
              <p class="note-text">${this.escapeHtml(note.text)}</p>
            </div>
          `;
        });
        notesList.innerHTML = html;
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  },

  async addCurrentNote() {
    const video = window.studyPlayer.currentVideo;
    if (!video) return;

    const textarea = document.getElementById('newNoteText');
    const text = textarea.value.trim();
    if (!text) {
      this.showToast('Please type a note first.', 'warning');
      return;
    }

    const timestamp = Math.floor(window.studyPlayer.videoEl?.currentTime || 0);

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          videoId: video.id,
          timestamp,
          text
        })
      });
      const data = await res.json();
      if (data.success) {
        textarea.value = '';
        this.loadNotes(video.id);
        this.showToast('Note saved with timestamp!', 'success');
      }
    } catch (err) {
      this.showToast('Failed to save note.', 'error');
    }
  },

  async deleteNote(noteId, videoId) {
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      this.loadNotes(videoId);
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  },

  exportNotes() {
    const video = window.studyPlayer.currentVideo;
    if (!video) return;
    window.open(`/api/notes/export/${video.id}?token=${this.token}`, '_blank');
  },

  // ----------------------------------------------------
  // UPLOAD & LINK MODALS
  // ----------------------------------------------------
  bindDashboardEvents() {
    // Search input with debounce
    let searchTimer = null;
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        this.searchQuery = e.target.value;
        this.loadVideos();
      }, 500);
    });

    // Upload Modal toggles
    document.getElementById('openUploadBtn')?.addEventListener('click', () => {
      document.getElementById('uploadModal').style.display = 'flex';
    });

    document.getElementById('closeUploadBtn')?.addEventListener('click', () => {
      document.getElementById('uploadModal').style.display = 'none';
      window.videoUploader.cancel();
      this.resetUploadForm();
    });

    // Link Modal toggles
    document.getElementById('openLinkModalBtn')?.addEventListener('click', () => {
      document.getElementById('linkModal').style.display = 'flex';
    });

    document.getElementById('closeLinkModalBtn')?.addEventListener('click', () => {
      document.getElementById('linkModal').style.display = 'none';
    });

    // Link Form Submit
    document.getElementById('linkForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('linkTitle').value;
      const url = document.getElementById('linkUrl').value;
      const subjectId = document.getElementById('linkSubject').value;
      const chapter = document.getElementById('linkChapter').value;

      try {
        const res = await fetch('/api/videos/link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify({ title, url, subjectId, chapter })
        });
        const data = await res.json();

        if (data.success) {
          this.showToast('Lecture linked successfully!', 'success');
          document.getElementById('linkModal').style.display = 'none';
          document.getElementById('linkForm').reset();
          this.loadVideos();
          this.loadSubjects();
        } else {
          this.showToast(data.message || 'Failed to add link', 'error');
        }
      } catch (err) {
        this.showToast('Network error adding link', 'error');
      }
    });

    // Settings Modal
    document.getElementById('openSettingsBtn')?.addEventListener('click', () => {
      this.openSettingsModal();
    });

    // Storage mode change handler
    document.getElementById('storageModeSelect')?.addEventListener('change', (e) => {
      this.updateStorageConfigVisibility(e.target.value);
    });

    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'none';
    });

    // Close Study Mode
    document.getElementById('closeStudyModalBtn')?.addEventListener('click', () => {
      this.closeVideoPlayer();
    });

    // Speed Controls
    document.querySelectorAll('.speed-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        window.studyPlayer.setSpeed(parseFloat(pill.dataset.speed));
      });
    });

    // Note Submissions
    document.getElementById('saveNoteBtn')?.addEventListener('click', () => {
      this.addCurrentNote();
    });
    document.getElementById('exportNotesBtn')?.addEventListener('click', () => {
      this.exportNotes();
    });

    // Drag and Drop Upload file
    this.setupDropzone();
  },

  setupDropzone() {
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('uploadFileInput');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        this.handleFileSelected(fileInput.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        this.handleFileSelected(e.dataTransfer.files[0]);
      }
    });

    // Start Upload Button
    document.getElementById('startUploadBtn')?.addEventListener('click', () => {
      const file = fileInput.files[0];
      if (!file) {
        this.showToast('Please select a video file first.', 'warning');
        return;
      }

      const metadata = {
        title: document.getElementById('uploadTitle').value.trim() || file.name,
        subjectId: document.getElementById('uploadSubject').value,
        chapter: document.getElementById('uploadChapter').value.trim()
      };

      this.startUpload(file, metadata);
    });
  },

  handleFileSelected(file) {
    const titleInput = document.getElementById('uploadTitle');
    if (titleInput && !titleInput.value) {
      titleInput.value = file.name.replace(/\.[^/.]+$/, "");
    }
    const dropText = document.getElementById('dropzoneText');
    if (dropText) {
      dropText.innerHTML = `<strong>Selected:</strong> ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
    }
  },

  startUpload(file, metadata) {
    const progressContainer = document.getElementById('uploadProgressContainer');
    const progressBar = document.getElementById('uploadProgressBar');
    const percentText = document.getElementById('uploadPercentText');
    const metaText = document.getElementById('uploadMetaText');
    const startBtn = document.getElementById('startUploadBtn');

    progressContainer.style.display = 'block';
    startBtn.disabled = true;
    startBtn.innerText = 'Uploading to Cloud...';

    window.videoUploader.uploadStream(
      file,
      metadata,
      (progress) => {
        progressBar.style.width = `${progress.percent}%`;
        percentText.innerText = `${progress.percent}%`;
        metaText.innerText = `${progress.loadedMB} MB of ${progress.totalMB} MB | ${progress.speedMB} MB/s | ~${progress.remainingSec}s remaining`;
      },
      (success) => {
        this.showToast('Video uploaded and saved to cloud!', 'success');
        document.getElementById('uploadModal').style.display = 'none';
        this.resetUploadForm();
        this.loadVideos();
        this.loadSubjects();
      },
      (error) => {
        this.showToast(error, 'error');
        startBtn.disabled = false;
        startBtn.innerText = 'Retry Upload';
      }
    );
  },

  resetUploadForm() {
    const fileInput = document.getElementById('uploadFileInput');
    if (fileInput) fileInput.value = '';
    const form = document.getElementById('uploadForm');
    if (form) form.reset();
    const progressContainer = document.getElementById('uploadProgressContainer');
    if (progressContainer) progressContainer.style.display = 'none';
    const startBtn = document.getElementById('startUploadBtn');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerText = 'Upload Video to Cloud';
    }
    const dropText = document.getElementById('dropzoneText');
    if (dropText) {
      dropText.innerHTML = `Drag & drop your lecture video here, or <span style="color:var(--accent-color);">browse</span><br><small style="color:var(--text-muted);">Supports MP4, MKV, WebM up to 2 GB</small>`;
    }
  },

  async openProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'flex';

    // Update profile info
    if (this.user?.username) {
      document.getElementById('profileUsername').textContent = this.user.username;
      document.getElementById('profileEmail').textContent = this.user.email || 'No email set';
    }
    this.updateProfileIcon();

    // Update storage type display from settings
    try {
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        const storageType = data.settings.storage?.type || data.settings.activeStorage || 'local';
        const storageEl = document.getElementById('profileStorageType');
        if (storageEl) {
          storageEl.textContent = `Storage: ${storageType.charAt(0).toUpperCase() + storageType.slice(1)}`;
        }
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  },
  // ----------------------------------------------------
  // SETTINGS & CLOUD CONFIG
  // ----------------------------------------------------
  async openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'flex';

    try {
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        const s = data.settings;
        document.getElementById('storageModeSelect').value = s.activeStorage || 'local';
        document.getElementById('tgTokenInput').value = s.telegram?.botToken || '';
        document.getElementById('tgChatIdInput').value = s.telegram?.chatId || '';
        // R2 fields
        document.getElementById('r2AccountIdInput').value = s.r2?.accountId || '';
        document.getElementById('r2AccessKeyInput').value = s.r2?.accessKeyId || '';
        document.getElementById('r2SecretKeyInput').value = s.r2?.secretAccessKey || '';
        document.getElementById('r2BucketInput').value = s.r2?.bucketName || '';
        // Show/hide config sections based on selected storage
        this.updateStorageConfigVisibility(s.activeStorage || 'local');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  },

  updateStorageConfigVisibility(activeStorage) {
    const tgSection = document.getElementById('tgConfigSection');
    const r2Section = document.getElementById('r2ConfigSection');
    if (tgSection) tgSection.style.display = activeStorage === 'telegram' ? 'block' : 'none';
    if (r2Section) r2Section.style.display = activeStorage === 'r2' ? 'block' : 'none';
  },

  openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.style.display = 'flex';
    // Reset form fields
    document.getElementById('currentPasswordInput').value = '';
    document.getElementById('newPasswordInput2').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    // Prevent form submission (we handle it via changePassword function)
    const form = document.getElementById('changePasswordForm');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.changePassword();
      };
    }
  },

  closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) modal.style.display = 'none';
  },

  async saveStorageSettings() {
    const storageModeSelect = document.getElementById('storageModeSelect');
    if (storageModeSelect) {
      storageModeSelect.addEventListener('change', (e) => {
        this.updateStorageConfigVisibility(e.target.value);
      });
    }

    const activeStorage = document.getElementById('storageModeSelect').value;
    const tgToken = document.getElementById('tgTokenInput').value.trim();
    const tgChatId = document.getElementById('tgChatIdInput').value.trim();

    // R2 fields - handle null values safely
    const r2AccountIdInput = document.getElementById('r2AccountIdInput');
    const r2AccessKeyInput = document.getElementById('r2AccessKeyInput');
    const r2SecretKeyInput = document.getElementById('r2SecretKeyInput');
    const r2BucketInput = document.getElementById('r2BucketInput');

    const r2AccountId = r2AccountIdInput ? r2AccountIdInput.value.trim() : '';
    const r2AccessKey = r2AccessKeyInput ? r2AccessKeyInput.value.trim() : '';
    const r2SecretKey = r2SecretKeyInput ? r2SecretKeyInput.value.trim() : '';
    const r2Bucket = r2BucketInput ? r2BucketInput.value.trim() : '';

    const payload = {
      activeStorage,
      telegram: {
        botToken: tgToken || undefined,
        chatId: tgChatId,
        enabled: Boolean(tgToken && tgChatId)
      },
      r2: {
        accountId: r2AccountId || undefined,
        accessKeyId: r2AccessKey || undefined,
        secretAccessKey: r2SecretKey || undefined,
        bucketName: r2Bucket || undefined,
        enabled: Boolean(r2AccountId && r2Bucket)
      }
    };

    try {
      const res = await fetch('/api/settings/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('Cloud storage settings saved!', 'success');
        // Cache the storage provider selection for persistence
        localStorage.setItem('eduvault_active_storage', activeStorage);
      } else {
        this.showToast(data.message || 'Error saving settings', 'error');
      }
    } catch (err) {
      this.showToast('Network error saving settings', 'error');
    }
  },

  // ----------------------------------------------------
  // DELETE ACCOUNT
  // ----------------------------------------------------
  async deleteAccount() {
    // Show confirmation dialog
    const confirmed = confirm(
      '⚠️ DANGER ZONE ⚠️\n\n' +
      'This will PERMANENTLY delete your account and ALL your data:\n' +
      '• All uploaded videos and their Telegram messages\n' +
      '• All study notes and progress\n' +
      '• Your account credentials\n\n' +
      'This action CANNOT be undone.\n\n' +
      'Type "DELETE" to confirm:'
    );

    if (!confirmed) return;

    // Double confirmation with text input
    const typed = prompt('Type "DELETE" to permanently delete your account:');
    if (typed !== 'DELETE') {
      this.showToast('Deletion cancelled - confirmation text did not match', 'info');
      return;
    }

    const btn = document.querySelector('button[onclick="App.deleteAccount()"]');
    const originalText = btn?.innerHTML || '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Deleting...';
    }

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        this.showToast('Account deleted permanently', 'success');
        // Log out and redirect to login
        this.logout();
        // Clear any remaining storage
        localStorage.clear();
      } else {
        this.showToast(data.message || 'Failed to delete account', 'error');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      this.showToast('Network error - please try again', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  },

  async updatePassword() {
    const currentPass = document.getElementById('settingsCurrentPasswordInput').value;
    const newPass = document.getElementById('settingsNewPasswordInput').value.trim();

    if (!currentPass) {
      this.showToast('Please enter your current password', 'error');
      return;
    }

    if (!newPass || newPass.length < 6) {
      this.showToast('Password must be at least 6 characters', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/settings/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('Password updated successfully!', 'success');
        document.getElementById('settingsCurrentPasswordInput').value = '';
        document.getElementById('settingsNewPasswordInput').value = '';
      } else {
        this.showToast(data.message || 'Failed to update password', 'error');
      }
    } catch (err) {
      this.showToast('Error updating password', 'error');
    }
  },

  // ----------------------------------------------------
  // FORGOT PASSWORD
  // ----------------------------------------------------
  async forgotPassword() {
    const email = document.getElementById('forgotEmailInput').value.trim();

    if (!email) {
      this.showToast('Please enter your email address', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (data.success) {
        this.showToast(data.message || 'Reset instructions sent!', 'success');
        // In development, show the reset URL for testing
        if (data.resetUrl) {
          console.log('Reset URL (dev only):', data.resetUrl);
        }
        document.getElementById('forgotPasswordModal').style.display = 'none';
        document.getElementById('forgotEmailInput').value = '';
      } else {
        this.showToast(data.message || 'Failed to send reset link', 'error');
      }
    } catch (err) {
      this.showToast('Network error - please try again', 'error');
    }
  },

  async changePassword() {
    const currentPass = document.getElementById('currentPasswordInput').value;
    const newPass = document.getElementById('newPasswordInput2').value;
    const confirmPass = document.getElementById('confirmPasswordInput').value;
    const submitBtn = document.querySelector('#changePasswordForm button[type="submit"]');

    if (!currentPass) {
      this.showToast('Please enter your current password', 'error');
      return;
    }

    if (!newPass || newPass.length < 6) {
      this.showToast('New password must be at least 6 characters', 'error');
      return;
    }

    if (newPass !== confirmPass) {
      this.showToast('New password and confirmation do not match', 'error');
      return;
    }

    // Disable button to prevent duplicate submissions
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Changing...';
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass, confirmPassword: confirmPass })
      });
      const data = await res.json();

      if (data.success) {
        this.showToast('Password changed successfully!', 'success');
        document.getElementById('changePasswordModal').style.display = 'none';
        document.getElementById('changePasswordForm').reset();
      } else {
        this.showToast(data.message || 'Failed to change password', 'error');
      }
    } catch (err) {
      this.showToast('Network error - please try again', 'error');
    } finally {
      // Re-enable button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Update Password';
      }
    }
  },

  async resetPassword(token) {
    const newPass = document.getElementById('resetNewPasswordInput').value;
    const confirmPass = document.getElementById('resetConfirmPasswordInput').value;

    if (!newPass || newPass.length < 6) {
      this.showToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (newPass !== confirmPass) {
      this.showToast('Passwords do not match', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: newPass })
      });
      const data = await res.json();

      if (data.success) {
        this.showToast('Password reset successfully!', 'success');
        window.location.href = '/';
      } else {
        this.showToast(data.message || 'Reset failed', 'error');
      }
    } catch (err) {
      this.showToast('Network error - please try again', 'error');
    }
  },

  // ----------------------------------------------------
  // UTILITIES & TOAST
  // ----------------------------------------------------
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }
};

// Expose App globally for inline onclick handlers
window.App = App;

// Initialize App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();

  // Register Service Worker for PWA / Mobile app installation
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});