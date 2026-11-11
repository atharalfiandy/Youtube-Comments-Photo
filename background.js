chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['ytPhotoComments'], (result) => {
    if (!result.ytPhotoComments) {
      chrome.storage.local.set({ ytPhotoComments: {} });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'save-photo-comment') {
    chrome.storage.local.get(['ytPhotoComments'], (result) => {
      const comments = result.ytPhotoComments || {};
      const key = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      comments[key] = {
        text: request.text || '',
        photos: request.photos || [],
        createdAt: Date.now()
      };

      chrome.storage.local.set({ ytPhotoComments: comments }, () => {
        sendResponse({ ok: true, key });
      });
    });
    return true;
  }

  if (request.type === 'get-photo-comments') {
    chrome.storage.local.get(['ytPhotoComments'], (result) => {
      sendResponse({ comments: result.ytPhotoComments || {} });
    });
    return true;
  }

  return false;
});
