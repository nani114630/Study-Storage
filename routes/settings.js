const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const db = require('../database');
const storageManager = require('../storage');
const { requireAuth } = require('./auth');

const router = express.Router();

const MASK = '••••••••';

// Get safe settings
router.get('/', requireAuth, (req, res) => {
  const settings = db.getSettings();

  res.json({
    success: true,
    settings: {
      activeStorage: settings.activeStorage || 'local',
      hasCustomPin: Boolean(settings.pin && settings.pin !== '1234'),
      telegram: {
        hasToken: Boolean(settings.telegram?.botToken),
        chatId: settings.telegram?.chatId || '',
        enabled: Boolean(settings.telegram?.enabled),
        apiUrl: settings.telegram?.apiUrl || ''
      },
      r2: {
        accountId: settings.r2?.accountId || '',
        bucketName: settings.r2?.bucketName || '',
        hasCredentials: Boolean(
          settings.r2?.accessKeyId && settings.r2?.secretAccessKey
        ),
        enabled: Boolean(settings.r2?.enabled)
      }
    }
  });
});

// Update PIN or password
router.post('/security', requireAuth, async (req, res) => {
  const { newPin, newPassword, currentPassword } = req.body || {};
  const updates = {};
  const userId = req.user.userId;

  // Get user for password update
  const user = db.findUserById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update PIN in settings (legacy - kept for reference)
  if (newPin !== undefined && String(newPin).trim().length >= 4) {
    updates.pin = String(newPin).trim();
  }

  // If newPassword provided, verify current password and hash new one
  if (newPassword !== undefined) {
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required'
      });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Verify current password against bcrypt hash
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash the new password with bcrypt and update user
    const passwordHash = await bcrypt.hash(newPassword, 12);
    db.updateUser(userId, { passwordHash });
  }

  if (!Object.keys(updates).length && !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'PIN must contain at least 4 characters and password at least 6.'
    });
  }

  // Update settings if PIN was provided
  if (Object.keys(updates).length > 0) {
    db.updateSettings(updates);
  }

    await db.persist();

  res.json({
    success: true,
    message: 'Security credentials updated successfully.'
  });
});

// Update storage configuration without returning secrets
router.post('/storage', requireAuth, async (req, res) => {  try {
    const { activeStorage, telegram, r2 } = req.body || {};
    const current = db.getSettings();
    const updates = {};

    if (activeStorage !== undefined) {
      if (!['local', 'telegram', 'r2'].includes(activeStorage)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid storage provider.'
        });
      }
      updates.activeStorage = activeStorage;
    }

    if (telegram) {
      const oldTelegram = current.telegram || {};

      updates.telegram = {
        ...oldTelegram,
        botToken:
          telegram.botToken && telegram.botToken !== MASK
            ? telegram.botToken
            : oldTelegram.botToken,
        chatId:
          telegram.chatId !== undefined
            ? telegram.chatId
            : oldTelegram.chatId,
        apiUrl:
          telegram.apiUrl !== undefined
            ? String(telegram.apiUrl).replace(/\/+$/, '')
            : oldTelegram.apiUrl,
        enabled:
          telegram.enabled !== undefined
            ? Boolean(telegram.enabled)
            : Boolean(oldTelegram.enabled)
      };
    }

    if (r2) {
      const oldR2 = current.r2 || {};

      updates.r2 = {
        ...oldR2,
        accountId: r2.accountId || oldR2.accountId,
        bucketName: r2.bucketName || oldR2.bucketName,
        accessKeyId:
          r2.accessKeyId && r2.accessKeyId !== MASK
            ? r2.accessKeyId
            : oldR2.accessKeyId,
        secretAccessKey:
          r2.secretAccessKey && r2.secretAccessKey !== MASK
            ? r2.secretAccessKey
            : oldR2.secretAccessKey,
        enabled:
          r2.enabled !== undefined
            ? Boolean(r2.enabled)
            : Boolean(oldR2.enabled)
      };
    }

    db.updateSettings(updates);
    await db.persist();
    storageManager.reloadConfig();

    const saved = db.getSettings();

    res.json({
      success: true,
      message: 'Storage settings saved successfully!',
      settings: {
        activeStorage: saved.activeStorage || 'local',
        telegram: {
          hasToken: Boolean(saved.telegram?.botToken),
          chatId: saved.telegram?.chatId || '',
          enabled: Boolean(saved.telegram?.enabled),
          apiUrl: saved.telegram?.apiUrl || ''
        },
        r2: {
          accountId: saved.r2?.accountId || '',
          bucketName: saved.r2?.bucketName || '',
          hasCredentials: Boolean(
            saved.r2?.accessKeyId && saved.r2?.secretAccessKey
          ),
          enabled: Boolean(saved.r2?.enabled)
        }
      }
    });
  } catch (err) {
    console.error('Storage settings error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Could not save storage settings.'
    });
  }
});

// Test configured Telegram API
router.post('/test-telegram', requireAuth, async (req, res) => {
  const settings = db.getSettings();
  const telegram = settings.telegram || {};

  const suppliedToken = req.body?.botToken;
  const token =
    suppliedToken && suppliedToken !== MASK
      ? suppliedToken
      : telegram.botToken;

  const apiUrl = (
    telegram.apiUrl ||
    process.env.TELEGRAM_API_URL ||
    'https://api.telegram.org'
  ).replace(/\/+$/, '');

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Bot Token is required.'
    });
  }

  try {
    const response = await axios.get(
      `${apiUrl}/bot${token}/getMe`,
      { timeout: 20000 }
    );

    if (response.data?.ok) {
      return res.json({
        success: true,
        message: `Connected successfully to bot: @${response.data.result.username}`
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Telegram did not confirm the bot connection.'
    });
  } catch (err) {
    console.error('Telegram connection test failed:', err.message);

    return res.status(400).json({
      success: false,
      message: 'Telegram connection failed. Check the saved API address and bot configuration.'
    });
  }
});

module.exports = router;
