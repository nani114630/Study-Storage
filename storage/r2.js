const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class R2Storage {
  constructor(config = {}) {
    this.name = 'r2';
    this.updateConfig(config);
  }

  updateConfig(cfg) {
    this.accountId = cfg.accountId || process.env.R2_ACCOUNT_ID;
    this.accessKeyId = cfg.accessKeyId || process.env.R2_ACCESS_KEY_ID;
    this.secretAccessKey = cfg.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = cfg.bucketName || process.env.R2_BUCKET_NAME;
    this.publicUrl = cfg.publicUrl || process.env.R2_PUBLIC_URL;

    if (this.accessKeyId && this.secretAccessKey && this.accountId) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey
        }
      });
      this.ready = true;
    } else {
      this.client = null;
      this.ready = false;
    }
  }

  isConfigured() {
    return this.ready && Boolean(this.bucketName);
  }

  // Generate presigned upload URL for direct client-to-cloud upload (Up to 5TB, bypasses local disk completely!)
  async getPresignedUploadUrl(key, contentType = 'video/mp4') {
    if (!this.isConfigured()) {
      throw new Error('Cloudflare R2 storage is not configured.');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType
    });

    // 2 hours expiry for large 2GB uploads
    const url = await getSignedUrl(this.client, command, { expiresIn: 7200 });
    return url;
  }

  // Stream video with HTTP Range header for instant seek and mobile streaming
  async getStream(key, range) {
    if (!this.isConfigured()) return null;

    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      if (range) {
        params.Range = range;
      }

      const response = await this.client.send(new GetObjectCommand(params));

      const headers = {
        'Content-Type': response.ContentType || 'video/mp4',
        'Accept-Ranges': 'bytes'
      };

      if (response.ContentLength !== undefined) {
        headers['Content-Length'] = response.ContentLength;
      }
      if (response.ContentRange) {
        headers['Content-Range'] = response.ContentRange;
      }

      return {
        stream: response.Body,
        statusCode: range ? 206 : 200,
        headers
      };
    } catch (err) {
      console.error('R2 getStream error:', err.message);
      return null;
    }
  }

  async delete(key) {
    if (!this.isConfigured()) return false;
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      }));
      return true;
    } catch (err) {
      console.error('R2 delete error:', err.message);
      return false;
    }
  }
}

module.exports = R2Storage;
