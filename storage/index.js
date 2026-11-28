
const db = require('../database');
const localStorage = require('./local');
const R2Storage = require('./r2');
const TelegramStorage = require('./telegram');

class StorageManager {
  constructor() {
    // Initialize providers only after MongoDB has loaded.
    this.r2 = null;
    this.telegram = null;
    this.local = localStorage;
  }

  initialize() {
    if (this.r2 && this.telegram) return;

    const settings = db.getSettings();

    this.r2 = new R2Storage(settings.r2 || {});
    this.telegram = new TelegramStorage(settings.telegram || {});
  }

  reloadConfig() {
    this.initialize();

    const settings = db.getSettings();
    this.r2.updateConfig(settings.r2 || {});
    this.telegram.updateConfig(settings.telegram || {});
  }

  getActiveProviderName() {
    this.initialize();

    const settings = db.getSettings();
    return settings.activeStorage || 'local';
  }

  getActiveProvider() {
    this.initialize();

    const providerName = this.getActiveProviderName();

    if (providerName === 'telegram') {
      if (!this.telegram.isConfigured()) {
        throw new Error('Telegram storage is selected but not configured.');
      }
      return this.telegram;
    }

    if (providerName === 'r2') {
      if (!this.r2.isConfigured()) {
        throw new Error('R2 storage is selected but not configured.');
      }
      return this.r2;
    }

    if (providerName === 'local') {
      return this.local;
    }

    throw new Error(`Unsupported storage provider: ${providerName}`);
  }

  async getStream(video, range) {
    this.initialize();

    if (!video) return null;

    if (video.storageProvider === 'external' || video.externalUrl) {
      return {
        externalUrl: video.externalUrl,
        isExternal: true
      };
    }

    if (video.storageProvider === 'telegram' || video.telegramFileId) {
      if (!this.telegram.isConfigured()) {
        throw new Error('Telegram storage is not configured.');
      }

      const fileId = video.telegramFileId || video.storageKey;
      if (!fileId) throw new Error('Telegram file ID is missing.');

      return this.telegram.getStream(fileId, range);
    }

    if (video.storageProvider === 'r2' || video.r2Key) {
      if (!this.r2.isConfigured()) {
        throw new Error('R2 storage is not configured.');
      }

      const key = video.r2Key || video.storageKey;
      return this.r2.getStream(key, range);
    }

    if (video.storageProvider === 'local' || !video.storageProvider) {
      return this.local.getStream(video.filename || video.storageKey, range);
    }

    throw new Error(`Unsupported video storage provider: ${video.storageProvider}`);
  }

  async delete(video) {
    this.initialize();

    if (!video) return false;

    if (video.storageProvider === 'telegram' || video.telegramFileId) {
      if (!this.telegram.isConfigured()) {
        throw new Error('Telegram storage is not configured.');
      }

      const messageId = video.telegramMessageId || video.messageId;
      const chatId = video.telegramChatId || video.chatId || this.telegram.chatId;

      if (!messageId) {
        throw new Error('Telegram message ID is missing; video was not deleted.');
      }

      return this.telegram.deleteMessage(chatId, messageId);
    }

    if (video.storageProvider === 'r2') {
      return this.r2.delete(video.r2Key || video.storageKey);
    }

    if (video.storageProvider === 'local') {
      return this.local.delete(video.filename || video.storageKey);
    }

    if (video.storageProvider === 'external') {
      return true;
    }

    throw new Error('Unknown video storage provider.');
  }
}

module.exports = new StorageManager();
