(() => {
  const STORAGE_KEY = 'ytPhotoComments';
  const state = {};

  const escapeHtml = (value = '') =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const readAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const getActiveCommentRoot = () => {
    const root = document.querySelector('ytd-commentbox, ytd-comment-simplebox-renderer, #commentbox, #comment-dialog');
    if (!root) {
      return null;
    }

    const editor = root.querySelector('[contenteditable="true"], textarea, #contenteditable-root');
    return { root, editor };
  };

  const getCommentTextFromEditor = (editor) => {
    if (!editor) {
      return '';
    }

    if (editor.tagName === 'TEXTAREA') {
      return editor.value.trim();
    }

    return editor.innerText ? editor.innerText.trim() : editor.textContent.trim();
  };

  const buildCommentMarkup = (text, photos) => {
    const textMarkup = text ? `<div class="yt-photo-comment-text">${escapeHtml(text)}</div>` : '';
    const photoMarkup = photos && photos.length
      ? `<div class="yt-photo-comment-gallery">${photos
          .map((photo) => `<img src="${photo}" alt="Photo comment" class="yt-photo-comment-image" />`)
          .join('')}</div>`
      : '';

    return `
      <div class="yt-photo-comment-item">
        <div class="yt-photo-comment-header">
          <span class="yt-photo-comment-avatar">Y</span>
          <span class="yt-photo-comment-author">You</span>
        </div>
        ${textMarkup}
        ${photoMarkup}
      </div>
    `;
  };

  const renderPreview = (previewEl, photos) => {
    if (!previewEl) {
      return;
    }

    previewEl.innerHTML = '';
    if (!photos.length) {
      return;
    }

    const fragment = document.createDocumentFragment();
    photos.forEach((photo) => {
      const item = document.createElement('div');
      item.className = 'yt-photo-preview-thumb';
      item.innerHTML = `<img src="${photo}" alt="Selected photo" />`;
      fragment.appendChild(item);
    });
    previewEl.appendChild(fragment);
  };

  const attachComposer = () => {
    const { root, editor } = getActiveCommentRoot();
    if (!root || !editor) {
      return;
    }

    if (root.dataset.ytPhotoInjected === 'true') {
      return;
    }

    const composerState = {
      photos: [],
      editor,
      root,
      preview: null,
      picker: null
    };

    const toolbar = document.createElement('div');
    toolbar.className = 'yt-photo-toolbar';
    toolbar.innerHTML = `
      <button class="yt-photo-btn" type="button">
        <span class="yt-photo-icon">📷</span>
        <span>Photo</span>
      </button>
      <input class="yt-photo-file-input" type="file" accept="image/*" multiple />
      <div class="yt-photo-preview"></div>
    `;

    composerState.picker = toolbar.querySelector('.yt-photo-file-input');
    composerState.preview = toolbar.querySelector('.yt-photo-preview');

    const button = toolbar.querySelector('.yt-photo-btn');
    button.addEventListener('click', () => composerState.picker.click());

    composerState.picker.addEventListener('change', async (event) => {
      const files = Array.from(event.target.files || []);
      const results = [];

      for (const file of files) {
        try {
          results.push(await readAsDataURL(file));
        } catch (error) {
          console.warn('Could not load photo for YouTube comment', error);
        }
      }

      if (!results.length) {
        return;
      }

      composerState.photos = [...composerState.photos, ...results];
      renderPreview(composerState.preview, composerState.photos);
      event.target.value = '';
    });

    const submitButton =
      root.querySelector('button[aria-label*="Comment"], #submit-button, tp-yt-paper-button, yt-button-renderer button') ||
      root.querySelector('button');

    if (submitButton) {
      submitButton.addEventListener('click', () => {
        const text = getCommentTextFromEditor(composerState.editor);
        if (!composerState.photos.length) {
          return;
        }

        const targetList = document.querySelector('ytd-comments #contents, ytd-item-section-renderer #contents, #comments .item-section');
        const markup = buildCommentMarkup(text || '📷 Photo comment', composerState.photos);

        if (targetList) {
          const inserted = document.createElement('div');
          inserted.className = 'yt-photo-injected-comment';
          inserted.innerHTML = markup;
          targetList.insertBefore(inserted, targetList.firstChild);
        }

        chrome.runtime.sendMessage({
          type: 'save-photo-comment',
          text: text || '📷 Photo comment',
          photos: composerState.photos
        });

        composerState.photos = [];
        composerState.editor.innerHTML = '';
        renderPreview(composerState.preview, []);
      });
    }

    root.dataset.ytPhotoInjected = 'true';
    state[root] = composerState;
    root.appendChild(toolbar);
  };

  const cleanup = () => {
    const nodes = document.querySelectorAll('ytd-commentbox, ytd-comment-simplebox-renderer, #commentbox, #comment-dialog');
    nodes.forEach((node) => {
      if (!node.dataset.ytPhotoInjected) {
        return;
      }
      const toolbar = node.querySelector('.yt-photo-toolbar');
      if (toolbar) {
        toolbar.remove();
      }
      node.dataset.ytPhotoInjected = 'false';
    });
  };

  const checkForComposer = () => {
    const root = document.querySelector('ytd-commentbox, ytd-comment-simplebox-renderer, #commentbox, #comment-dialog');
    if (!root) {
      return;
    }

    if (root.dataset.ytPhotoInjected === 'true') {
      return;
    }

    attachComposer();
  };

  const observer = new MutationObserver(() => {
    checkForComposer();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.addEventListener('load', () => {
    setTimeout(checkForComposer, 300);
  });

  setInterval(() => {
    checkForComposer();
  }, 2000);
})();
