const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'eduvault-super-secure-secret-key-2026',
  DATA_DIR: path.join(__dirname, 'data'),
  TEMP_UPLOAD_DIR: path.join(__dirname, 'temp_uploads'),
  DEFAULT_PASSWORD: process.env.ADMIN_PASSWORD || 'exam2026',
  DEFAULT_PIN: process.env.ADMIN_PIN || '1234',
  MAX_FILE_SIZE: 2000 * 1024 * 1024, // 2000 MB
  DEFAULT_SUBJECTS: [
    { id: 'polity', name: 'Indian Polity & Constitution', icon: 'scale' },
    { id: 'history', name: 'History & National Movement', icon: 'history' },
    { id: 'geography', name: 'Geography & Environment', icon: 'globe' },
    { id: 'economy', name: 'Indian Economy & Development', icon: 'trending-up' },
    { id: 'science', name: 'General Science & Tech', icon: 'atom' },
    { id: 'reasoning', name: 'Logical Reasoning & Mental Ability', icon: 'cpu' },
    { id: 'aptitude', name: 'Quantitative Aptitude & Math', icon: 'calculator' },
    { id: 'english', name: 'English Comprehension & Grammar', icon: 'book' },
    { id: 'current', name: 'Current Affairs & GK', icon: 'newspaper' }
  ]
};

