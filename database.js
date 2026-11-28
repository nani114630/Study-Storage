
const { MongoClient } = require('mongodb');
require('./config'); // Loads .env before reading MONGODB_URI

const COLLECTION_NAME = 'app_state';
const STATE_ID = 'main';

class Database {
  constructor() {
    this.data = null;
    this.client = null;
    this.collection = null;
    this.saveQueue = Promise.resolve();
    this.ready = this.connectAndLoad();
  }

  async connectAndLoad() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        'MONGODB_URI is missing. Database startup stopped; no local fallback is allowed.'
      );
    }

    this.client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });

    try {
      await this.client.connect();

      const database = this.client.db();
      this.collection = database.collection(COLLECTION_NAME);

      const record = await this.collection.findOne({
        _id: STATE_ID
      });

      if (!record || !record.data || typeof record.data !== 'object') {
        throw new Error(
          `MongoDB ${database.databaseName}.${COLLECTION_NAME} record _id='${STATE_ID}' is missing or invalid. Startup stopped to protect existing data.`
        );
      }

      // Load existing Atlas data exactly as stored.
      // Do not seed, merge defaults, run legacy migrations,
      // or read/write local db.json.
      this.data = record.data;

      const requiredArrays = [
        'users',
        'videos',
        'subjects',
        'chapters',
        'topics',
        'notes'
      ];

      for (const key of requiredArrays) {
        if (!Array.isArray(this.data[key])) {
          throw new Error(
            `MongoDB app_state data is missing the expected '${key}' array. Startup stopped without changing Atlas data.`
          );
        }
      }

      if (!this.data.settings || typeof this.data.settings !== 'object') {
        throw new Error(
          'MongoDB app_state data is missing settings. Startup stopped without changing Atlas data.'
        );
      }

      console.log(
        `[DB] Connected to MongoDB Atlas; loaded ${this.data.users.length} users and ${this.data.videos.length} videos.`
      );

      return true;

    } catch (err) {
      if (this.client) {
        await this.client.close().catch(() => {});
      }

      this.client = null;
      this.collection = null;

      throw err;
    }
  }

  // Serialize writes so an older snapshot cannot overwrite a newer one.
  save() {
    if (!this.collection || !this.data) {
      throw new Error(
        'Database is not ready; refusing to save before Atlas state is loaded.'
      );
    }

    const snapshot = JSON.parse(JSON.stringify(this.data));

    this.saveQueue = this.saveQueue.then(async () => {
      const result = await this.collection.replaceOne(
        { _id: STATE_ID },
        { _id: STATE_ID, data: snapshot },
        { upsert: false }
      );

      if (result.matchedCount !== 1) {
        throw new Error(
          'MongoDB app_state record disappeared; refusing to recreate or overwrite data.'
        );
      }
    });

    return this.saveQueue;
  }

  // Routes must await this before sending success responses.
  async persist() {
    await this.saveQueue;
  }

  // =====================================================
  // USERS
  // =====================================================

  getUsers() {
    return this.data.users || [];
  }

  addUser(user) {
    if (!this.data.users) this.data.users = [];

    this.data.users.push(user);
    this.save();

    return user;
  }

  findUserByEmail(email) {
    return (this.data.users || []).find(u => u.email === email);
  }

  findUserByUsername(username) {
    return (this.data.users || []).find(u => u.username === username);
  }

  findUserById(id) {
    return (this.data.users || []).find(u => u.id === String(id));
  }

  updateUser(userId, updates) {
    const idx = (this.data.users || []).findIndex(
      u => u.id === String(userId)
    );

    if (idx !== -1) {
      this.data.users[idx] = {
        ...this.data.users[idx],
        ...updates
      };

      this.save();
      return this.data.users[idx];
    }

    return null;
  }

  updateUserLogin(userId) {
    const user = this.updateUser(userId, {
      lastLogin: Date.now()
    });

    return user;
  }

  deleteUser(userId) {
    const user = this.findUserById(userId);

    if (!user) return false;

    const userIdStr = String(userId);

    // Delete only videos explicitly owned by this user.
    const userVideos = (this.data.videos || []).filter(v =>
      v.userId === userIdStr || v.user_id === userIdStr
    );

    for (const video of userVideos) {
      this.deleteVideo(video.id);
    }

    // Preserve notes belonging to videos that still exist.
    this.data.notes = (this.data.notes || []).filter(n => {
      const video = (this.data.videos || []).find(
        v => v.id === n.videoId
      );

      return video !== undefined;
    });

    this.data.users = (this.data.users || []).filter(
      u => u.id !== userIdStr
    );

    this.save();

    return true;
  }

  // =====================================================
  // VIDEOS
  // =====================================================

  getVideos() {
    return this.data.videos || [];
  }

  getVideoById(id) {
    return (this.data.videos || []).find(v => v.id === id);
  }

  addVideo(video) {
    if (!this.data.videos) this.data.videos = [];

    this.data.videos.unshift(video);
    this.save();

    return video;
  }

  updateVideo(id, updates) {
    const idx = (this.data.videos || []).findIndex(
      v => v.id === id
    );

    if (idx !== -1) {
      this.data.videos[idx] = {
        ...this.data.videos[idx],
        ...updates,
        updatedAt: Date.now()
      };

      this.save();

      return this.data.videos[idx];
    }

    return null;
  }

  deleteVideo(id) {
    const initialLen = this.data.videos.length;

    this.data.videos = (this.data.videos || []).filter(
      v => v.id !== id
    );

    // Also delete associated notes.
    this.data.notes = (this.data.notes || []).filter(
      n => n.videoId !== id
    );

    this.save();

    return this.data.videos.length < initialLen;
  }

  // =====================================================
  // SUBJECTS
  // =====================================================

  getSubjects() {
    return this.data.subjects || [];
  }

  addSubject(subject) {
    if (!this.data.subjects) this.data.subjects = [];

    this.data.subjects.push(subject);
    this.save();

    return subject;
  }

  updateSubject(id, updates) {
    const idx = (this.data.subjects || []).findIndex(
      s => s.id === id
    );

    if (idx !== -1) {
      this.data.subjects[idx] = {
        ...this.data.subjects[idx],
        ...updates
      };

      this.save();

      return this.data.subjects[idx];
    }

    return null;
  }

  deleteSubject(id) {
    this.data.chapters = (this.data.chapters || []).filter(
      c => c.subjectId !== id
    );

    this.data.topics = (this.data.topics || []).filter(t => {
      const chapter = (this.data.chapters || []).find(
        c => c.id === t.chapterId
      );

      return chapter && chapter.subjectId !== id;
    });

    this.data.videos = this.data.videos.map(v => {
      if (v.subjectId === id) {
        return { ...v, subjectId: null };
      }

      return v;
    });

    this.data.subjects = (this.data.subjects || []).filter(
      s => s.id !== id
    );

    this.save();

    return true;
  }

  // =====================================================
  // CHAPTERS
  // =====================================================

  getChapters(subjectId = null) {
    let chapters = this.data.chapters || [];

    if (subjectId) {
      chapters = chapters.filter(
        c => c.subjectId === subjectId
      );
    }

    return chapters;
  }

  getChapterById(id) {
    return (this.data.chapters || []).find(
      c => c.id === id
    );
  }

  addChapter(chapter) {
    if (!this.data.chapters) this.data.chapters = [];

    this.data.chapters.push(chapter);
    this.save();

    return chapter;
  }

  updateChapter(id, updates) {
    const idx = (this.data.chapters || []).findIndex(
      c => c.id === id
    );

    if (idx !== -1) {
      this.data.chapters[idx] = {
        ...this.data.chapters[idx],
        ...updates
      };

      this.save();

      return this.data.chapters[idx];
    }

    return null;
  }

  deleteChapter(id) {
    this.data.topics = (this.data.topics || []).filter(
      t => t.chapterId !== id
    );

    this.data.videos = this.data.videos.map(v => {
      if (v.chapterId === id) {
        return {
          ...v,
          chapterId: null,
          chapter: ''
        };
      }

      return v;
    });

    this.data.chapters = (this.data.chapters || []).filter(
      c => c.id !== id
    );

    this.save();

    return true;
  }

  // =====================================================
  // TOPICS
  // =====================================================

  getTopics(chapterId = null) {
    let topics = this.data.topics || [];

    if (chapterId) {
      topics = topics.filter(
        t => t.chapterId === chapterId
      );
    }

    return topics;
  }

  getTopicById(id) {
    return (this.data.topics || []).find(
      t => t.id === id
    );
  }

  addTopic(topic) {
    if (!this.data.topics) this.data.topics = [];

    this.data.topics.push(topic);
    this.save();

    return topic;
  }

  updateTopic(id, updates) {
    const idx = (this.data.topics || []).findIndex(
      t => t.id === id
    );

    if (idx !== -1) {
      this.data.topics[idx] = {
        ...this.data.topics[idx],
        ...updates
      };

      this.save();

      return this.data.topics[idx];
    }

    return null;
  }

  deleteTopic(id) {
    this.data.videos = this.data.videos.map(v => {
      if (v.topicId === id) {
        return {
          ...v,
          topicId: null,
          topic: ''
        };
      }

      return v;
    });

    this.data.topics = (this.data.topics || []).filter(
      t => t.id !== id
    );

    this.save();

    return true;
  }

  // =====================================================
  // NOTES
  // =====================================================

  getNotes(videoId) {
    return (this.data.notes || [])
      .filter(n => n.videoId === videoId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  addNote(note) {
    if (!this.data.notes) this.data.notes = [];

    this.data.notes.push(note);
    this.save();

    return note;
  }

  deleteNote(id) {
    this.data.notes = (this.data.notes || []).filter(
      n => n.id !== id
    );

    this.save();
  }

  // =====================================================
  // SETTINGS
  // =====================================================

  getSettings() {
    return this.data.settings;
  }

  updateSettings(updates) {
    this.data.settings = {
      ...this.data.settings,
      ...updates
    };

    this.save();

    return this.data.settings;
  }
}

module.exports = new Database();
