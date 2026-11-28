const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const config = require('../config');
const db = require('../database');

const router = express.Router();

// Email transporter setup
let emailTransporter = null;
function getEmailTransporter() {
  if (!emailTransporter && process.env.SMTP_HOST) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return emailTransporter;
}

// Send email helper
async function sendEmail(to, subject, text, html) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log('Email not configured, skipping send:', { to, subject });
    return { skipped: true };
  }
  try {
    await transporter.sendMail({
      from: `StudyStorage <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });
    return { sent: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { error: err.message };
  }
}

// Middleware - JWT verification
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
};

// Generate JWT token
function generateToken(user, expiresIn = '30d') {
  return jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    config.JWT_SECRET,
    { expiresIn }
  );
}

// =====================================================
// SIGN UP
// =====================================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ success: false, message: 'Username must be 3-30 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Check existing users
    const existingEmail = db.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const existingUsername = db.findUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = jwt.sign(
      { email, username, purpose: 'verify-email' },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create user (unverified initially)
    const user = db.addUser({
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      username,
      email,
      passwordHash,
      isVerified: false,
      verificationToken,
      createdAt: Date.now()
    });

    // Generate access token for immediate login
    await db.persist();
    const token = generateToken(user);

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    await sendEmail(
      email,
      'Verify your StudyStorage account',
      `Welcome to StudyStorage! Please verify your email by clicking: ${verifyUrl}`,
      `<p>Welcome to <strong>StudyStorage</strong>!</p><p>Please verify your email address:</p><p><a href="${verifyUrl}">Verify Email</a></p>`
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      },
      message: 'Account created! Please check your email to verify your account.'
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================================================
// EMAIL VERIFICATION
// =====================================================
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send('Invalid verification link');
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.purpose !== 'verify-email') {
      return res.status(400).send('Invalid verification token');
    }

    const user = db.findUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).send('User not found');
    }

    if (user.verificationToken !== token) {
      return res.status(400).send('Invalid or expired verification link');
    }

    // Update user as verified
    db.updateUser(user.id, {
      isVerified: true,
      verificationToken: null
    });
    await db.persist();

    // Generate access token
    const accessToken = generateToken(user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?verified=true&token=${accessToken}`);
  } catch (err) {
    console.error('Email verification error:', err.message);
    res.status(400).send('Invalid or expired verification link');
  }
});

// =====================================================
// LOGIN
// =====================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user by email or username
    let user = db.findUserByEmail(email);
    if (!user) {
      user = db.findUserByUsername(email);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    db.updateUserLogin(user.id);
    await db.persist();

    // Generate token with longer expiry if rememberMe
    const expiresIn = rememberMe ? '90d' : '30d';
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      config.JWT_SECRET,
      { expiresIn }
    );

    // Send login notification email
    await sendEmail(
      user.email,
      'New login to your StudyStorage account',
      `Someone logged into your account. If this wasn't you, please change your password immediately.`,
      `<p>New login detected for <strong>StudyStorage</strong>.</p><p>If this wasn't you, please <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings">change your password</a> immediately.</p>`
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================================================
// FORGOT PASSWORD
// =====================================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = db.findUserByEmail(email);

    // Always return success to prevent email enumeration
    const response = { success: true, message: 'If the email exists, a reset link has been sent' };

    if (!user) {
      return res.json(response);
    }

    // Generate reset token (1 hour expiry)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'reset-password' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token in user record
    db.updateUser(user.id, { resetToken });
    await db.persist();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    await sendEmail(
      user.email,
      'StudyStorage Password Reset',
      `You requested a password reset. Click the link to reset: ${resetUrl}\nThis link expires in 1 hour.`,
      `<p>You requested a password reset for <strong>StudyStorage</strong>.</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link expires in 1 hour.</p>`
    );

    res.json(response);
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================================================
// CHANGE PASSWORD (authenticated user changing their own password)
// =====================================================
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation do not match' });
    }

    // Get user from database
    const user = db.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password against bcrypt hash
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password in database
    db.updateUser(user.id, { passwordHash });
    await db.persist();

    // Send confirmation email
    await sendEmail(
      user.email,
      'Password Changed - StudyStorage',
      'Your password has been successfully changed.',
      `<p>Your <strong>StudyStorage</strong> password has been changed.</p><p>If this wasn't you, please contact support immediately.</p>`
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================================================
// RESET PASSWORD (forgot password flow with JWT token)
// =====================================================
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.purpose !== 'reset-password') {
      return res.status(401).json({ success: false, message: 'Invalid reset token' });
    }

    const user = db.findUserById(decoded.userId);
    if (!user || user.resetToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    db.updateUser(user.id, { passwordHash, resetToken: null });
    await db.persist();

    // Send confirmation email
    await sendEmail(
      user.email,
      'Password Changed - StudyStorage',
      'Your password has been successfully changed.',
      `<p>Your <strong>StudyStorage</strong> password has been changed.</p><p>If this wasn't you, please contact support immediately.</p>`
    );

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================================================
// DELETE ACCOUNT
// =====================================================
router.delete('/delete-account', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verify user exists
    const user = db.findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete user and all associated data
    const deleted = db.deleteUser(userId);
    await db.persist();

    if (!deleted) {
      return res.status(500).json({ success: false, message: 'Failed to delete account' });
    }

    res.json({ success: true, message: 'Account deleted permanently' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================================================
// SESSION STATUS
// =====================================================
router.get('/status', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    res.json({ authenticated: true, user: decoded });
  } catch (err) {
    res.json({ authenticated: false });
  }
});

module.exports = { router, requireAuth };