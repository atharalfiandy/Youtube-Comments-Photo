document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['ytPhotoComments'], (result) => {
    const container = document.body;
    const comments = result.ytPhotoComments || {};
    const keys = Object.keys(comments).sort((a, b) => comments[b].createdAt - comments[a].createdAt);

    if (!keys.length) {
      container.innerHTML = '<p>No saved photo comments yet.</p>';
      return;
    }

    const list = document.createElement('div');
    keys.forEach((key) => {
      const data = comments[key];
      const item = document.createElement('div');
      item.innerHTML = `
        <h3>${data.text || 'Photo comment'}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:10px;">
          ${(data.photos || []).map((photo) => `<img src="${photo}" style="width:100%;height:110px;object-fit:cover;border-radius:10px;" />`).join('')}
        </div>
      `;
      list.appendChild(item);
    });

    container.appendChild(list);
  });
});
