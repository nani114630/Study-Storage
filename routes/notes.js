const express = require('express');
const db = require('../database');
const { requireAuth } = require('./auth');

const router = express.Router();

// Get notes for a video
router.get('/:videoId', requireAuth, (req, res) => {
  const notes = db.getNotes(req.params.videoId);
  res.json({ success: true, notes });
});

// Add a note with timestamp
router.post('/', requireAuth, async (req, res) => {  const { videoId, timestamp, text } = req.body;

  if (!videoId || text === undefined) {
    return res.status(400).json({ success: false, message: 'videoId and text are required' });
  }

  const note = {
    id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    videoId,
    timestamp: parseFloat(timestamp) || 0,
    text: String(text).trim(),
    createdAt: Date.now()
  };

  db.addNote(note);
  await db.persist();
  res.json({ success: true, note });
});

// Delete a note
router.delete('/:id', requireAuth, async (req, res) => {  db.deleteNote(req.params.id);
await db.persist();
  res.json({ success: true, message: 'Note deleted' });
});

// Export all notes for a video as Markdown / Text for fast revision
router.get('/export/:videoId', requireAuth, (req, res) => {
  const video = db.getVideoById(req.params.videoId);
  if (!video) {
    return res.status(404).send('Video not found');
  }

  const notes = db.getNotes(video.id);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  let output = `# Study Notes: ${video.title}\n`;
  if (video.chapter) output += `Chapter: ${video.chapter}\n`;
  output += `Generated on: ${new Date().toLocaleDateString()}\n\n---\n\n`;

  if (notes.length === 0) {
    output += 'No notes added for this lecture yet.\n';
  } else {
    notes.forEach((n, i) => {
      output += `### [${formatTime(n.timestamp)}] Note #${i + 1}\n${n.text}\n\n`;
    });
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${video.title.replace(/[^a-zA-Z0-9]/g, '_')}_notes.txt"`);
  res.send(output);
});

module.exports = router;
