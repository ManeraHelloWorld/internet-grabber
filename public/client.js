const keywordInput = document.getElementById('keywordInput');
const searchBtn = document.getElementById('searchBtn');
const urlSection = document.getElementById('urlSection');
const urlListDiv = document.getElementById('urlList');
const downloadBtn = document.getElementById('downloadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const savedList = document.getElementById('savedList');
const contentView = document.getElementById('contentView');
const errorBox = document.getElementById('errorBox');

let selectedUrl = null;

function showError(msg) {
  errorBox.style.display = 'block';
  errorBox.textContent = msg;
  setTimeout(() => { errorBox.style.display = 'none'; }, 5000);
}

function clearError() {
  errorBox.style.display = 'none';
}

searchBtn.addEventListener('click', async () => {
  const keyword = keywordInput.value.trim();
  if (!keyword) {
    showError('Введите ключевое слово');
    return;
  }
  clearError();

  try {
    const res = await fetch(`/api/keywords?q=${encodeURIComponent(keyword)}`);
    if (!res.ok) {
      const errData = await res.json();
      showError(errData.error || 'Ошибка при поиске');
      urlSection.style.display = 'none';
      return;
    }
    const data = await res.json();
    renderUrlList(data.urls);
  } catch (err) {
    showError('Сетевая ошибка при запросе ключевых слов');
    console.error(err);
  }
});

function renderUrlList(urls) {
  urlListDiv.innerHTML = '';
  selectedUrl = null;
  downloadBtn.disabled = true;

  if (!urls.length) {
    urlListDiv.innerHTML = '<p>Нет доступных URL</p>';
    urlSection.style.display = 'block';
    return;
  }

  urls.forEach((url, index) => {
    const div = document.createElement('div');
    div.className = 'url-item';
    div.innerHTML = `
      <input type="radio" name="urlChoice" id="url${index}" value="${url}">
      <label for="url${index}">${url}</label>
    `;
    urlListDiv.appendChild(div);
  });

  document.querySelectorAll('input[name="urlChoice"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      selectedUrl = e.target.value;
      downloadBtn.disabled = !selectedUrl;
    });
  });

  urlSection.style.display = 'block';
}

downloadBtn.addEventListener('click', async () => {
  if (!selectedUrl) return;
  clearError();

  progressContainer.style.display = 'block';
  progressFill.style.width = '0%';
  progressText.textContent = 'Подготовка...';
  downloadBtn.disabled = true;

  try {
    const response = await fetch(`/api/download?url=${encodeURIComponent(selectedUrl)}`);

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `Ошибка ${response.status}`);
    }

    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (total && response.body) {
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;

        const percent = ((received / total) * 100).toFixed(1);
        progressFill.style.width = percent + '%';
        progressText.textContent = `Загружено: ${formatBytes(received)} из ${formatBytes(total)} (${percent}%)`;
      }

      const decoder = new TextDecoder('utf-8');
      let text = '';
      for (const chunk of chunks) {
        text += decoder.decode(chunk, { stream: true });
      }
      text += decoder.decode();

      saveToStorage(selectedUrl, text);
    } else {
      const text = await response.text();
      progressText.textContent = `Загружено: ${formatBytes(new Blob([text]).size)}`;
      saveToStorage(selectedUrl, text);
    }

    progressText.textContent = 'Готово!';
    setTimeout(() => {
      progressContainer.style.display = 'none';
      downloadBtn.disabled = false;
    }, 2000);

  } catch (err) {
    showError(err.message || 'Ошибка при скачивании');
    progressContainer.style.display = 'none';
    downloadBtn.disabled = false;
  }
});

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function saveToStorage(url, text) {
  const timestamp = new Date().toISOString();
  const entry = { url, text, timestamp };

  let saved = JSON.parse(localStorage.getItem('downloadedPages') || '[]');
  saved = saved.filter(item => item.url !== url);
  saved.unshift(entry);
  localStorage.setItem('downloadedPages', JSON.stringify(saved));
  renderSavedList();
}

function renderSavedList() {
  const saved = JSON.parse(localStorage.getItem('downloadedPages') || '[]');
  savedList.innerHTML = '';
  if (saved.length === 0) {
    savedList.innerHTML = '<li>Нет сохранённых страниц</li>';
    return;
  }
  saved.forEach((item, index) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = item.url;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showContent(item.text);
    });
    li.appendChild(link);
    const dateSpan = document.createElement('span');
    dateSpan.style.fontSize = '0.8em';
    dateSpan.style.color = '#666';
    dateSpan.textContent = ` (${new Date(item.timestamp).toLocaleString()})`;
    li.appendChild(dateSpan);
    savedList.appendChild(li);
  });
}

function showContent(text) {
  contentView.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '400px';
  iframe.sandbox = 'allow-same-origin';
  contentView.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(text);
  iframe.contentDocument.close();
}

renderSavedList();