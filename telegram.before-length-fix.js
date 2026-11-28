const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class TelegramStorage {
  constructor(config = {}) {
    this.name = 'telegram';
    this.updateConfig(config);
  }

  updateConfig(cfg = {}) {
    this.botToken = cfg.botToken || process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = cfg.chatId || process.env.TELEGRAM_CHAT_ID;
    this.apiUrl = (cfg.apiUrl || process.env.TELEGRAM_API_URL || 'https://api.telegram.org').replace(/\/+$/, '');
    this.ready = Boolean(this.botToken && this.chatId);
    this.localMode = this.apiUrl !== 'https://api.telegram.org';
    this.localWorkDir = '/var/lib/telegram-bot-api';
  }

  isConfigured() {
    return this.ready;
  }

  async api(method, params = {}) {
    if (!this.isConfigured()) {
      throw new Error('Telegram storage is not configured.');
    }

    const response = await axios.post(
      `${this.apiUrl}/bot${this.botToken}/${method}`,
      params,
      { timeout: 60000 }
    );

    if (!response.data?.ok) {
      throw new Error(response.data?.description || `Telegram ${method} failed`);
    }

    return response.data.result;
  }

  async upload(fileStream, filename, caption = '') {
    if (!this.isConfigured()) {
      throw new Error('Telegram storage is not configured.');
    }

    const form = new FormData();
    form.append('chat_id', this.chatId);
    form.append('caption', caption || filename);
    form.append('video', fileStream, {
      filename,
      contentType: 'video/mp4'
    });

    try {
      const response = await axios.post(
        `${this.apiUrl}/bot${this.botToken}/sendVideo`,
        form,
        {
          headers: form.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 0
        }
      );

      if (!response.data?.ok) {
        throw new Error(response.data?.description || 'Telegram upload failed');
      }

      const message = response.data.result;
      const video = message.video || message.document;

      if (!video?.file_id) {
        throw new Error('Telegram returned no file ID.');
      }

      return {
        fileId: video.file_id,
        fileUniqueId: video.file_unique_id,
        messageId: message.message_id,
        chatId: String(message.chat.id),
        size: video.file_size || 0,
        duration: video.duration || 0,
        width: video.width || 0,
        height: video.height || 0
      };
    } catch (err) {
      console.error('Telegram upload error:', err.response?.data || err.message);
      throw err;
    }
  }

  async resolveLocalFilePath(filePath) {
    const baseDir = await fs.promises.realpath(this.localWorkDir);

    const candidate = path.isAbsolute(filePath)
      ? path.resolve(filePath)
      : path.resolve(baseDir, filePath);

    const realPath = await fs.promises.realpath(candidate);
    const relative = path.relative(baseDir, realPath);

    if (
      !relative ||
      relative === '..' ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    ) {
      throw new Error('Unsafe Telegram file path rejected.');
    }

    const stat = await fs.promises.stat(realPath);

    if (!stat.isFile()) {
      throw new Error('Telegram file path is not a regular file.');
    }

    return realPath;
  }

  async getFilePath(fileId) {
    const result = await this.api('getFile', { file_id: fileId });

    if (!result?.file_path) {
      throw new Error('Telegram did not return a file path.');
    }

    if (this.localMode) {
      return this.resolveLocalFilePath(result.file_path);
    }

    return null;
  }

  async getFileDirectUrl(fileId) {
    const result = await this.api('getFile', { file_id: fileId });

    if (!result?.file_path) {
      throw new Error('Telegram did not return a file path.');
    }

    if (this.localMode) {
      return this.resolveLocalFilePath(result.file_path);
    }

    return `${this.apiUrl}/file/bot${this.botToken}/${result.file_path}`;
  }
  async getStream(fileId, range) {
    if (!this.isConfigured()) {
      throw new Error('Telegram storage is not configured.');
    }

    const filePath = await this.getFileDirectUrl(fileId);

    if (this.localMode && path.isAbsolute(filePath)) {
      const stat = await fs.promises.stat(filePath);

      if (!stat.isFile()) {
        throw new Error('Telegram file path is not a regular file.');
      }

      const size = stat.size;
      let start = 0;
      let end = size - 1;
      let statusCode = 200;

      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);

        if (!match || (!match[1] && !match[2])) {
          return {
            stream: null,
            statusCode: 416,
            headers: { 'Content-Range': `bytes */${size}` }
          };
        }

        if (!match[1]) {
          const suffixLength = Number(match[2]);
          if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
            return {
              stream: null,
              statusCode: 416,
              headers: { 'Content-Range': `bytes */${size}` }
            };
          }
          start = Math.max(0, size - suffixLength);
        } else {
          start = Number(match[1]);
          if (match[2]) end = Number(match[2]);
        }

        if (
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end) ||
          start < 0 ||
          start >= size ||
          end < start
        ) {
          return {
            stream: null,
            statusCode: 416,
            headers: { 'Content-Range': `bytes */${size}` }
          };
        }

        end = Math.min(end, size - 1);
        statusCode = 206;
      }

      const headers = {
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Content-Length': String(end - start + 1)
      };

      if (statusCode === 206) {
        headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
      }

      return {
        stream: fs.createReadStream(filePath, { start, end }),
        statusCode,
        headers
      };
    }

    const headers = {};
    if (range) headers.Range = range;

    const response = await axios.get(filePath, {
      headers,
      responseType: 'stream',
      validateStatus: status => status === 200 || status === 206 || status === 416
    });

    if (response.status === 416) {
      response.data.destroy();
      return {
        stream: null,
        statusCode: 416,
        headers: {
          'Content-Range': response.headers['content-range'] || 'bytes */*'
        }
      };
    }

    const responseHeaders = {
      'Content-Type': response.headers['content-type'] || 'video/mp4',
      'Accept-Ranges': response.headers['accept-ranges'] || 'bytes'
    };

    for (const header of ['content-range', 'content-length']) {
      if (response.headers[header]) {
        responseHeaders[header === 'content-range' ? 'Content-Range' : 'Content-Length'] =
          response.headers[header];
      }
    }

    return {
      stream: response.data,
      statusCode: response.status,
      headers: responseHeaders
    };
  }

  async deleteMessage(chatId, messageId) {
    if (!chatId || !messageId) {
      throw new Error('Telegram chat ID or message ID is missing.');
    }

    return this.api('deleteMessage', {
      chat_id: chatId,
      message_id: messageId
    });
  }
}

module.exports = TelegramStorage;

