const fs = require('fs');
const path = require('path');
const config = require('../config');

const STORAGE_DIR = path.join(config.DATA_DIR, 'videos');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

module.exports = {
  name: 'local',

  async save(fileStream, filename) {
    const targetPath = path.join(STORAGE_DIR, filename);
    const writeStream = fs.createWriteStream(targetPath);

    return new Promise((resolve, reject) => {
      fileStream.pipe(writeStream);
      writeStream.on('finish', () => {
        const stats = fs.statSync(targetPath);
        resolve({
          filename,
          path: targetPath,
          size: stats.size
        });
      });
      writeStream.on('error', reject);
      fileStream.on('error', reject);
    });
  },

  getStream(filename, range) {
    const filePath = path.join(STORAGE_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });

      return {
        stream: file,
        statusCode: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4'
        }
      };
    } else {
      return {
        stream: fs.createReadStream(filePath),
        statusCode: 200,
        headers: {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4'
        }
      };
    }
  },

  async delete(filename) {
    const filePath = path.join(STORAGE_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
};
