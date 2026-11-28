const express = require('express');
const db = require('../database');
const storageManager = require('../storage');
const { requireAuth } = require('./auth');
const config = require('../config');
const crypto = require('crypto');

const router = express.Router();

// Shared secret for signing launch tokens (must match vlc-launcher.js)
const LAUNCH_SECRET = process.env.VLC_LAUNCH_SECRET || 'studystorage-vlc-launch-secret-2026';

function generateLaunchToken(videoId) {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', LAUNCH_SECRET)
    .update(`${videoId}:${timestamp}`)
    .digest('hex');
  return `${videoId}:${timestamp}:${signature}`;
}

// List videos
router.get('/', requireAuth, (req, res) => {
  const { subject, search, completed } = req.query;
  let videos = db.getVideos();

  // Filter by user ID
  const userId = req.user.userId;
  videos = videos.filter(v => v.userId === userId || v.user_id === userId);

  if (subject && subject !== 'all') {
    videos = videos.filter(v => v.subjectId === subject);
  }

  if (search) {
    const q = search.toLowerCase();
    videos = videos.filter(v =>
      (v.title && v.title.toLowerCase().includes(q)) ||
      (v.chapter && v.chapter.toLowerCase().includes(q))
    );
  }

  if (completed !== undefined && completed !== '') {
    videos = videos.filter(v => Boolean(v.completed) === (completed === 'true'));
  }

  res.json({ success: true, videos });
});

// Get video details
router.get('/:id', requireAuth, (req, res) => {
  const video = db.getVideoById(req.params.id);

  if (!video) {
    return res.status(404).json({ success: false, message: 'Video not found' });
  }

  // Check ownership
  const userId = req.user.userId;
  if (video.userId !== userId && video.user_id !== userId) {
    return res.status(404).json({ success: false, message: 'Video not found' });
  }

  res.json({
    success: true,
    video,
    notes: db.getNotes(video.id)
  });
});

// Authenticated video streaming with HTTP Range support
router.get('/:id/stream', requireAuth, async (req, res) => {
  const video = db.getVideoById(req.params.id);

  if (!video) {
    return res.status(404).send('Video not found');
  }

  // Check ownership
  const userId = req.user.userId;
  if (video.userId !== userId && video.user_id !== userId) {
    return res.status(404).send('Video not found');
  }

  try {
    const result = await storageManager.getStream(video, req.headers.range);

    if (!result) {
      return res.status(404).send('Video stream could not be loaded');
    }

    if (result.isExternal && result.externalUrl) {
      return res.redirect(result.externalUrl);
    }

    if (result.statusCode === 416) {
      return res.status(416).set(result.headers || {}).end();
    }

    if (!result.stream) {
      return res.status(502).send('Video stream is unavailable');
    }

    res.writeHead(result.statusCode || 200, result.headers || {});

    result.stream.on('error', err => {
      console.error('Video stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).end('Video streaming failed');
      } else {
        res.destroy(err);
      }
    });

    res.on('close', () => {
      if (!res.writableEnded && result.stream && !result.stream.destroyed) {
        result.stream.destroy();
      }
    });

    result.stream.pipe(res);
  } catch (err) {
    console.error('Streaming error:', err.message);

    if (!res.headersSent) {
      res.status(500).send('Error streaming video');
    } else {
      res.destroy(err);
    }
  }
});

// Authenticated VLC playlist
router.get('/:id/vlc.m3u', requireAuth, (req, res) => {
  const video = db.getVideoById(req.params.id);

  if (!video) {
    return res.status(404).send('Video not found');
  }

  const token = req.query.token;

  if (!token) {
    return res.status(401).send('Authentication token required');
  }

  const host = req.get('host');
  const protocol = req.protocol;

  const streamUrl =
    video.storageProvider === 'external' && video.externalUrl
      ? video.externalUrl
      : `${protocol}://${host}/api/videos/${encodeURIComponent(video.id)}/stream?token=${encodeURIComponent(token)}`;

  const safeTitle = (video.title || 'Exam Lecture')
    .replace(/[\r\n]/g, ' ')
    .replace(/,/g, ' ');

  const content = `#EXTM3U\n#EXTINF:-1,${safeTitle}\n${streamUrl}\n`;
  const filename = (video.title || 'lecture')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  res.setHeader('Content-Type', 'audio/x-mpegurl');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.m3u"`);
  res.send(content);
});

// Generate launch token for Windows VLC helper
router.post('/:id/launch-vlc', requireAuth, (req, res) => {
  const video = db.getVideoById(req.params.id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found'
    });
  }

  // Check ownership
  const userId = req.user.userId;
  if (video.userId !== userId && video.user_id !== userId) {
    return res.status(404).json({
      success: false,
      message: 'Video not found'
    });
  }

  // Generate a signed launch token for the local VLC helper
  const launchToken = generateLaunchToken(video.id);

  res.json({
    success: true,
    launchToken,
    videoId: video.id,
    title: video.title,
    message: 'Launch token generated. Use with local VLC launcher.'
  });
});

// Update playback progress
router.patch('/:id/progress', requireAuth, async (req, res) => {
  try {  const video = db.getVideoById(req.params.id);

  if (!video) {
    return res.status(404).json({ success: false, message: 'Video not found' });
  }

  // Check ownership
  const userId = req.user.userId;
  if (video.userId !== userId && video.user_id !== userId) {
    return res.status(404).json({ success: false, message: 'Video not found' });
  }

  const { currentTime, duration, completed } = req.body;
  const updates = {};

  if (currentTime !== undefined) {
    const value = Number(currentTime);
    if (!Number.isFinite(value) || value < 0) {
      return res.status(400).json({ success: false, message: 'Invalid playback position' });
    }
    updates.currentTime = value;
  }

  if (duration !== undefined) {
    const value = Number(duration);
    if (!Number.isFinite(value) || value < 0) {
      return res.status(400).json({ success: false, message: 'Invalid video duration' });
    }
    updates.duration = value;
  }

  if (completed !== undefined) {
    updates.completed = Boolean(completed);
  }

  if (
    updates.currentTime !== undefined &&
    updates.duration > 0 &&
    updates.currentTime / updates.duration > 0.95
  ) {
    updates.completed = true;
  }

  const updated = db.updateVideo(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Video not found' });
  }

  await db.persist();

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Video not found' });
  }

   res.json({ success: true, video: updated });
  } catch (err) {
    console.error('Playback progress error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save playback progress' });
  }
});

// Add external video link
router.post('/link', requireAuth, async (req, res) => {
  try {  const { title, url, subjectId, chapter, duration } = req.body;

  if (!title || !url) {
    return res.status(400).json({
      success: false,
      message: 'Title and URL are required'
    });
  }

  let finalUrl = url.trim();

  if (!/^https?:\/\//i.test(finalUrl)) {
    return res.status(400).json({
      success: false,
      message: 'Only HTTP and HTTPS video links are supported'
    });
  }

  if (finalUrl.includes('drive.google.com')) {
    const match =
      finalUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      finalUrl.match(/id=([a-zA-Z0-9_-]+)/);

    if (match && match[1]) {
      finalUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }

  const video = {
    id: 'vid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title,
    subjectId: subjectId || 'general',
    chapter: chapter || '',
    storageProvider: 'external',
    externalUrl: finalUrl,
    duration: duration ? Number(duration) : 0,
    currentTime: 0,
    completed: false,
    createdAt: Date.now(),
    userId: req.user.userId
  };

  db.addVideo(video);
  await db.persist();
  res.json({ success: true, video });
  } catch (err) {
    console.error('Add video link error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save video link' });
  }
});

// Delete video: remove remote storage first, then metadata
router.delete('/:id', requireAuth, async (req, res) => {
  const video = db.getVideoById(req.params.id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found'
    });
  }

  // Check ownership
  const userId = req.user.userId;
  if (video.userId !== userId && video.user_id !== userId) {
    return res.status(404).json({
      success: false,
      message: 'Video not found'
    });
  }

  try {
    await storageManager.delete(video);
    db.deleteVideo(video.id);
    await db.persist();

    res.json({
      success: true,
      message: 'Video removed successfully'
    });
  } catch (err) {
    console.error('Delete video error:', err.response ? err.response.data : err.message);

    res.status(500).json({
      success: false,
      message: err.message || 'Failed to delete video. The video record was retained.'
    });
  }
});

module.exports = router;
