const express = require('express');
const db = require('../database');
const { requireAuth } = require('./auth');

const router = express.Router();

// Get all subjects with lecture count and completion percentage
router.get('/', requireAuth, (req, res) => {
  const subjects = db.getSubjects();
  const userId = req.user.userId;
  const videos = db.getVideos().filter(v => v.userId === userId || v.user_id === userId);

  const subjectsWithStats = subjects.map(sub => {
    const subVideos = videos.filter(v => v.subjectId === sub.id);
    const completedCount = subVideos.filter(v => v.completed).length;
    const progress = subVideos.length > 0 ? Math.round((completedCount / subVideos.length) * 100) : 0;

    return {
      ...sub,
      videoCount: subVideos.length,
      completedCount,
      progress
    };
  });

  res.json({ success: true, subjects: subjectsWithStats });
});

// Get chapters for a subject
router.get('/:subjectId/chapters', requireAuth, (req, res) => {
  try {
    const chapters = db.getChapters(req.params.subjectId);
    res.json({ success: true, chapters });
  } catch (err) {
    console.error('Get chapters error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load chapters' });
  }
});

// Get topics for a chapter
router.get('/:subjectId/chapters/:chapterId/topics', requireAuth, (req, res) => {
  try {
    const topics = db.getTopics(req.params.chapterId);
    res.json({ success: true, topics });
  } catch (err) {
    console.error('Get topics error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load topics' });
  }
});

// Add new subject
router.post('/', requireAuth, async (req, res) => {  const { name, icon } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Subject name is required' });
  }

  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) + '_' + Date.now().toString(36);
  const newSubject = {
    id,
    name: name.trim(),
    icon: icon || '📚'
  };

db.addSubject(newSubject);
await db.persist();
res.json({ success: true, subject: newSubject });
});

// Add chapter
router.post('/:subjectId/chapters', requireAuth, async (req, res) => {  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Chapter name is required' });
  }

  const chapter = {
    id: 'ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    subjectId: req.params.subjectId,
    name: name.trim()
  };

  try {
const created = db.addChapter(chapter);
await db.persist();
res.json({ success: true, chapter: created });
  } catch (err) {
    console.error('Add chapter error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to add chapter' });
  }
});

// Update chapter
router.patch('/chapters/:id', requireAuth, async (req, res) => {  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Chapter name is required' });
  }

  try {
    const updated = db.updateChapter(req.params.id, { name: name.trim() });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }
await db.persist();
    res.json({ success: true, chapter: updated });
  } catch (err) {
    console.error('Update chapter error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update chapter' });
  }
});

// Delete chapter
router.delete('/chapters/:id', requireAuth, async (req, res) => {  try {
    const result = db.deleteChapter(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }
await db.persist();
    res.json({ success: true, message: 'Chapter deleted successfully' });
  } catch (err) {
    console.error('Delete chapter error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete chapter' });
  }
});

// Add topic
router.post('/:subjectId/chapters/:chapterId/topics', requireAuth, async (req, res) => {  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Topic name is required' });
  }

  const topic = {
    id: 'tp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    chapterId: req.params.chapterId,
    name: name.trim()
  };

  try {
const created = db.addTopic(topic);
await db.persist();
res.json({ success: true, topic: created });
  } catch (err) {
    console.error('Add topic error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to add topic' });
  }
});

// Update topic
router.patch('/:subjectId/topics/:id', requireAuth, async (req, res) => {  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Topic name is required' });
  }

  try {
    const updated = db.updateTopic(req.params.id, { name: name.trim() });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }
await db.persist();
    res.json({ success: true, topic: updated });
  } catch (err) {
    console.error('Update topic error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update topic' });
  }
});

// Delete topic
router.delete('/:subjectId/topics/:id', requireAuth, async (req, res) => {  try {
    const result = db.deleteTopic(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }
await db.persist();
    res.json({ success: true, message: 'Topic deleted successfully' });
  } catch (err) {
    console.error('Delete topic error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete topic' });
  }
});

module.exports = router;