const renderPreview = (images = []) => {
  const preview = document.getElementById('preview');
  if (!preview) {
    return;
  }

  preview.innerHTML = '';
  images.forEach((image) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.innerHTML = `<img src="${image}" alt="Selected comment photo" />`;
    preview.appendChild(item);
  });
};

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

let selectedFiles = [];

const photoInput = document.getElementById('photoInput');
const saveButton = document.getElementById('saveButton');
const status = document.getElementById('status');

photoInput.addEventListener('change', async (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) {
    return;
  }

  selectedFiles = [];
  for (const file of files) {
    selectedFiles.push(await readFile(file));
  }

  renderPreview(selectedFiles);
  status.textContent = `${selectedFiles.length} photo ready to save.`;
});

saveButton.addEventListener('click', () => {
  if (!selectedFiles.length) {
    status.textContent = 'Please choose at least one photo first.';
    return;
  }

  chrome.storage.local.set({ quickPhotos: selectedFiles }, () => {
    status.textContent = 'Saved. You can use the Photo button inside YouTube comments.';
  });
});

chrome.storage.local.get(['quickPhotos'], (result) => {
  renderPreview(result.quickPhotos || []);
  selectedFiles = result.quickPhotos || [];
});
