const express = require('express');
const path = require('path');
const Busboy = require('busboy');
const db = require('../database');
const storageManager = require('../storage');
const { requireAuth } = require('./auth');
const config = require('../config');

const router = express.Router();

// Direct R2/S3 upload
router.post('/presign', requireAuth, async (req, res) => {
  try {
    const { filename, contentType, title, subjectId, chapter } = req.body || {};

    if (!filename) {
      return res.status(400).json({ success: false, message: 'Filename is required.' });
    }

    if (!storageManager.r2.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Cloudflare R2 is not configured.'
      });
    }

    const cleanExt = path.extname(filename) || '.mp4';
    const key = `videos/${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`;

    const uploadUrl = await storageManager.r2.getPresignedUploadUrl(
      key,
      contentType || 'video/mp4'
    );

    const video = {
      id: 'vid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title || path.basename(filename, cleanExt),
      subjectId: subjectId || 'general',
      chapter: chapter || '',
      storageProvider: 'r2',
      r2Key: key,
      size: 0,
      duration: 0,
      currentTime: 0,
      completed: false,
      createdAt: Date.now()
    };

    db.addVideo(video);

    res.json({ success: true, uploadUrl, key, video });
  } catch (err) {
    console.error('Presign error:', err.message);
    res.status(500).json({ success: false, message: 'Could not prepare upload.' });
  }
});

// Stream upload with size-limit and failure cleanup
router.post('/stream', requireAuth, (req, res) => {
  let busboy;

  try {
    busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: config.MAX_FILE_SIZE,
        files: 1,
        fields: 20,
        fieldSize: 1024 * 1024
      }
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid upload request.'
    });
  }

  const fields = {};
  let provider = null;
  let uploadPromise = null;
  let uploadedFileInfo = null;
  let fileReceived = false;
  let fileTooLarge = false;
  let clientAborted = false;
  let responseSent = false;
  let cleanupPromise = null;
  let uniqueName = null;
  let fileStream = null;

  const sendError = (status, message) => {
    if (clientAborted || responseSent || res.headersSent) return;
    responseSent = true;
    res.status(status).json({ success: false, message });
  };

  const cleanupUpload = () => {
    if (cleanupPromise) return cleanupPromise;

    cleanupPromise = (async () => {
      try {
        if (uploadedFileInfo?.storageProvider === 'telegram') {
          await provider.deleteMessage(
            uploadedFileInfo.telegramChatId,
            uploadedFileInfo.telegramMessageId
          );
          console.log('Incomplete Telegram upload removed.');
        } else if (provider?.name === 'local' && uniqueName) {
          await provider.delete(uniqueName);
          console.log('Incomplete local upload removed.');
        }
      } catch (err) {
        console.error('Upload cleanup failed:', err.message);
      }
    })();

    return cleanupPromise;
  };

  busboy.on('field', (name, value) => {
    fields[name] = value;
  });

  busboy.on('file', (fieldname, stream, info) => {
    if (fileReceived) {
      stream.resume();
      return;
    }

    fileReceived = true;
    fileStream = stream;

    const filename = path.basename(info.filename || 'video.mp4');
    const extension = path.extname(filename) || '.mp4';
    uniqueName =
      `${Date.now()}_${Math.random().toString(36).substring(2, 7)}${extension}`;

    stream.on('limit', () => {
      fileTooLarge = true;
      console.error('Upload exceeded the configured file-size limit.');
    });

    try {
      provider = storageManager.getActiveProvider();

      if (provider.name === 'telegram') {
        uploadPromise = provider.upload(stream, uniqueName, filename)
          .then(result => {
            uploadedFileInfo = {
              storageProvider: 'telegram',
              telegramFileId: result.fileId,
              telegramFileUniqueId: result.fileUniqueId,
              telegramMessageId: result.messageId,
              telegramChatId: result.chatId,
              size: result.size || 0,
              duration: result.duration || 0,
              width: result.width || 0,
              height: result.height || 0,
              storageKey: result.fileId
            };
          });
      } else if (provider.name === 'local') {
        uploadPromise = provider.save(stream, uniqueName)
          .then(result => {
            uploadedFileInfo = {
              storageProvider: 'local',
              filename: uniqueName,
              size: result.size || 0,
              storageKey: uniqueName
            };
          });
      } else {
        stream.resume();
        throw new Error(
          'Direct upload supports Telegram or local storage. Use R2 presigned upload for R2.'
        );
      }
    } catch (err) {
      uploadPromise = Promise.reject(err);
      stream.resume();
    }
  });

  busboy.on('filesLimit', () => {
    fileTooLarge = true;
  });

  busboy.on('error', err => {
    console.error('Upload parser error:', err.message);
    sendError(400, 'Upload stream could not be processed.');
  });

  req.on('aborted', () => {
    clientAborted = true;
    console.error('Client disconnected during upload.');

    if (fileStream && !fileStream.destroyed) {
      fileStream.destroy(new Error('Client disconnected.'));
    }

    if (uploadPromise) {
      uploadPromise
        .catch(() => {})
        .then(() => cleanupUpload());
    } else if (provider?.name === 'local' && uniqueName) {
      cleanupUpload();
    }
  });

  busboy.on('finish', async () => {
    try {
      if (!fileReceived) {
        return sendError(400, 'No video file was received.');
      }

      if (uploadPromise) {
        await uploadPromise;
      }

      if (clientAborted) {
        await cleanupUpload();
        return;
      }

      if (fileTooLarge) {
        await cleanupUpload();
        return sendError(
          413,
          'The video exceeds the configured upload size limit. No video was saved.'
        );
      }

      if (!uploadedFileInfo) {
        return sendError(500, 'The video could not be saved.');
      }

      const video = {
        id: 'vid_' + Date.now() + '_' +
          Math.random().toString(36).substring(2, 7),
        title: fields.title || 'Untitled Lecture',
        subjectId: fields.subjectId || 'general',
        chapter: fields.chapter || '',
        ...uploadedFileInfo,
        currentTime: 0,
        completed: false,
        createdAt: Date.now()
      };

      db.addVideo(video);

      if (!responseSent && !res.headersSent) {
        responseSent = true;
        res.json({
          success: true,
          message: 'Video uploaded successfully.',
          video
        });
      }
    } catch (err) {
      console.error('Upload processing failed:', err.message);

      await cleanupUpload();

      sendError(500, 'Upload failed. Incomplete uploaded data was cleaned up where possible.');
    }
  });

  req.pipe(busboy);
});
// Telegram storage status
router.get('/telegram-status', requireAuth, async (req, res) => {
  try {
    const settings = db.getSettings();
    const telegram = settings.telegram || {};
    const videos = db.getVideos();

    const telegramVideos = videos.filter(v =>
      v.storageProvider === 'telegram' || Boolean(v.telegramFileId)
    );

    const totalSize = telegramVideos.reduce((sum, video) => sum + (video.size || 0), 0);
    const useLocalBotApi =
      telegram.useLocalBotApi ||
      (telegram.apiUrl || '').replace(/\/+$/, '') !== 'https://api.telegram.org';

    res.json({
      success: true,
      storage: {
        type: 'telegram',
        configured: Boolean(telegram.botToken && telegram.chatId),
        useLocalBotApi,
        totalVideos: telegramVideos.length,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        maxFileSizeMB: useLocalBotApi ? 2000 : 50,
        notes: useLocalBotApi
          ? ['Using Local Bot API. Actual upload limits depend on Telegram server configuration.']
          : ['Using the standard Telegram Bot API.']
      }
    });
  } catch (err) {
    console.error('Telegram status error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get storage status.' });
  }
});

module.exports = router;

