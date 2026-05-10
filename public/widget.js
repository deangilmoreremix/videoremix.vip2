(function() {
  'use strict';

  const defaultConfig = {
    personalizerUrl: window.location.origin,
    appId: 'videoremix-vip',
    mode: 'cold-email',
    userId: null,
    projectId: null,
    theme: {
      primary: '#8B5CF6',
      secondary: '#06B6D4'
    }
  };

  // User-friendly error messages
  const ERROR_MESSAGES = {
    'Unauthorized': 'Please sign in to continue.',
    'Rate limit exceeded': 'Too many requests. Please wait a minute and try again.',
    'default': 'An error occurred. Please try again.'
  };

  function getErrorMessage(error) {
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (error.includes(key)) return message;
    }
    return ERROR_MESSAGES['default'];
  }

  class VideoRemixPersonalizer {
    constructor() {
      this.config = { ...defaultConfig };
      this.iframe = null;
      this.callbacks = {};
      this.messageHandler = null;
    }

    init(config = {}) {
      this.config = { ...this.config, ...config };
      return this;
    }

    open(config = {}) {
      const finalConfig = { ...this.config, ...config };

      // Validate inputs
      if (finalConfig.appId && typeof finalConfig.appId !== 'string') {
        console.error('VideoRemixPersonalizer: appId must be a string');
        return this;
      }
      if (finalConfig.mode && typeof finalConfig.mode !== 'string') {
        console.error('VideoRemixPersonalizer: mode must be a string');
        return this;
      }

      const params = new URLSearchParams({
        app: finalConfig.appId,
        mode: finalConfig.mode,
        ...(finalConfig.userId && { userId: finalConfig.userId }),
        ...(finalConfig.projectId && { projectId: finalConfig.projectId })
      });

      const url = `${finalConfig.personalizerUrl}/new?${params.toString()}`;

      this.iframe = document.createElement('iframe');
      this.iframe.src = url;
      this.iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:rgba(0,0,0,0.8);';
      this.iframe.setAttribute('title', 'VideoRemix AI Personalizer');
      document.body.appendChild(this.iframe);

      // Store reference to handler for cleanup
      this.messageHandler = (event) => {
        try {
          const origin = new URL(finalConfig.personalizerUrl).origin;
          if (event.origin !== origin) return;

          if (event.data.type === 'PERSONALIZER_CLOSE') {
            this.close();
          }
          if (event.data.type === 'PERSONALIZER_COMPLETE') {
            this.callbacks.onComplete?.(event.data.output);
          }
          if (event.data.type === 'PERSONALIZER_ERROR') {
            const message = getErrorMessage(event.data.error || 'default');
            this.callbacks.onError?.(new Error(message));
          }
        } catch (err) {
          console.error('VideoRemixPersonalizer message handler error:', err);
        }
      };

      window.addEventListener('message', this.messageHandler);

      return this;
    }

    close() {
      if (this.iframe && this.iframe.parentNode) {
        document.body.removeChild(this.iframe);
        this.iframe = null;
      }
      // Cleanup event listener
      if (this.messageHandler) {
        window.removeEventListener('message', this.messageHandler);
        this.messageHandler = null;
      }
      return this;
    }

    generate(payload) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      // Validate payload
      if (!payload || typeof payload !== 'object') {
        this.callbacks.onError?.(new Error('Invalid payload'));
        return this;
      }

      fetch(`${this.config.personalizerUrl}/api/personalizer/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
        .then(res => {
          clearTimeout(timeout);
          if (!res.ok) {
            return res.json().then(data => {
              throw new Error(data.error || `HTTP ${res.status}`);
            });
          }
          return res.json();
        })
        .then(data => this.callbacks.onComplete?. (data))
        .catch(err => {
          clearTimeout(timeout);
          if (err.name !== 'AbortError') {
            const message = getErrorMessage(err.message || 'default');
            this.callbacks.onError?. (new Error(message));
          }
        });

      return this;
    }

    on(event, callback) {
      this.callbacks[event] = callback;
      return this;
    }
  }

  // Expose to window only if not already defined
  if (!window.VideoRemixPersonalizer) {
    window.VideoRemixPersonalizer = new VideoRemixPersonalizer();
  }
})();
