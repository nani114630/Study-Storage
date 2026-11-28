// EduVault - High-Performance 2GB Video Uploader
class VideoUploader {
  constructor() {
    this.activeXhr = null;
    this.startTime = 0;
  }

  // Upload using streaming multipart/form-data directly to server or cloud
  uploadStream(file, metadata, onProgress, onSuccess, onError) {
    if (!file) {
      if (onError) onError('Please select a video file.');
      return;
    }

    // Check 2GB file limit
    const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > MAX_SIZE) {
      if (onError) onError('File exceeds the 2GB maximum limit.');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', metadata.title || file.name);
    formData.append('subjectId', metadata.subjectId || 'polity');
    formData.append('chapter', metadata.chapter || '');

    const xhr = new XMLHttpRequest();
    this.activeXhr = xhr;
    this.startTime = Date.now();

    xhr.open('POST', '/api/upload/stream', true);

    // Auth header
    const token = localStorage.getItem('eduvault_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        const elapsedSec = (Date.now() - this.startTime) / 1000;
        const bytesPerSec = elapsedSec > 0 ? e.loaded / elapsedSec : 0;
        const speedMB = (bytesPerSec / (1024 * 1024)).toFixed(1);

        const remainingBytes = e.total - e.loaded;
        const remainingSec = bytesPerSec > 0 ? Math.round(remainingBytes / bytesPerSec) : 0;

        onProgress({
          percent,
          loadedMB: (e.loaded / (1024 * 1024)).toFixed(1),
          totalMB: (e.total / (1024 * 1024)).toFixed(1),
          speedMB,
          remainingSec
        });
      }
    };

    xhr.onload = () => {
      this.activeXhr = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (onSuccess) onSuccess(res);
        } catch (err) {
          if (onError) onError('Failed to parse server response.');
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (onError) onError(errRes.message || 'Upload failed.');
        } catch (e) {
          if (onError) onError(`Upload error (${xhr.status})`);
        }
      }
    };

    xhr.onerror = () => {
      this.activeXhr = null;
      if (onError) onError('Network error occurred during upload.');
    };

    xhr.onabort = () => {
      this.activeXhr = null;
      if (onError) onError('Upload cancelled by user.');
    };

    xhr.send(formData);
  }

  cancel() {
    if (this.activeXhr) {
      this.activeXhr.abort();
      this.activeXhr = null;
    }
  }
}

window.videoUploader = new VideoUploader();
