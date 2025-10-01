(() => {
  // URL-Parameter auslesen
  const params = new URLSearchParams(window.location.search);
  const diaryId = params.get('id');
  if (!diaryId) {
    alert('Kein Tagebuch ausgewählt.');
    window.location.href = 'index.html';
    return;
  }

  // DOM-Elemente
  const diaryTitleEl = document.getElementById('diaryTitle');
  const backBtn = document.getElementById('backBtn');
  const toggleThemeBtn = document.getElementById('toggleThemeBtn');

  // PIN Overlay
  const pinOverlay = document.getElementById('pinOverlay');
  const pinInput = document.getElementById('pinInput');
  const pinSubmitBtn = document.getElementById('pinSubmitBtn');

  // Textbereich
  const textEntry = document.getElementById('textEntry');
  const saveTextBtn = document.getElementById('saveTextBtn');

  // Canvas & Controls
  const canvas = document.getElementById('drawCanvas');
  const ctx = canvas.getContext('2d');
  const clearCanvasBtn = document.getElementById('clearCanvasBtn');
  const saveCanvasBtn = document.getElementById('saveCanvasBtn');

  // Multimedia
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const audioInput = document.getElementById('audioInput');
  const audioPreview = document.getElementById('audioPreview');

  // Einträge Liste
  const entriesList = document.getElementById('entriesList');

  // --- DARKMODE ---
  function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      toggleThemeBtn.textContent = '☀️';
    } else {
      document.body.classList.remove('dark-mode');
      toggleThemeBtn.textContent = '🌙';
    }
  }
  toggleThemeBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'light');
    } else {
      localStorage.setItem('theme', 'dark');
    }
    loadTheme();
  });
  loadTheme();

  // --- Tagebuch laden ---
  const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
  const diary = diaries.find(d => d.id === diaryId);
  if (!diary) {
    alert('Tagebuch nicht gefunden.');
    window.location.href = 'index.html';
    return;
  }
  diaryTitleEl.textContent = diary.title;
  document.title = diary.title;

  // PIN Check
  pinOverlay.style.display = 'flex';
  pinSubmitBtn.onclick = () => {
    if (pinInput.value === diary.pin) {
      pinOverlay.style.display = 'none';
      loadEntries();
      loadCanvasDrawing();
    } else {
      alert('Falscher PIN!');
      pinInput.value = '';
      pinInput.focus();
    }
  };

  // Zurück Button
  backBtn.onclick = () => {
    window.location.href = 'index.html';
  };

  // --- Datenstruktur für Einträge ---
  /*
  entries = [
    {
      id: string,
      type: 'text' | 'drawing' | 'image' | 'audio',
      content: string (text oder base64 Daten),
      createdAt: ISOString,
    }
  ]
  */

  // Alle Einträge für dieses Tagebuch speichern und laden
  function loadEntries() {
    const raw = localStorage.getItem(`entries_${diaryId}`);
    let entries = [];
    if (raw) {
      try {
        entries = JSON.parse(raw);
      } catch {}
    }
    renderEntries(entries);
    window.entries = entries; // global für debug
  }

  function saveEntries(entries) {
    localStorage.setItem(`entries_${diaryId}`, JSON.stringify(entries));
  }

  // --- Einträge anzeigen ---
  function renderEntries(entries) {
    entriesList.innerHTML = '';
    if (entries.length === 0) {
      entriesList.innerHTML = '<li>Keine Einträge vorhanden.</li>';
      return;
    }
    entries.forEach(entry => {
      const li = document.createElement('li');
      const time = new Date(entry.createdAt).toLocaleString();
      switch (entry.type) {
        case 'text':
          li.innerHTML = `<strong>Text</strong> <em>(${time})</em><br>${escapeHtml(entry.content).replace(/\n/g, '<br>')}`;
          break;
        case 'drawing':
          const img = document.createElement('img');
          img.src = entry.content;
          img.alt = 'Zeichnung';
          img.style.maxWidth = '100%';
          li.innerHTML = `<strong>Zeichnung</strong> <em>(${time})</em><br>`;
          li.appendChild(img);
          break;
        case 'image':
          const img2 = document.createElement('img');
          img2.src = entry.content;
          img2.alt = 'Bild';
          img2.style.maxWidth = '100%';
          li.innerHTML = `<strong>Bild</strong> <em>(${time})</em><br>`;
          li.appendChild(img2);
          break;
        case 'audio':
          const audio = document.createElement('audio');
          audio.controls = true;
          audio.src = entry.content;
          li.innerHTML = `<strong>Audio</strong> <em>(${time})</em><br>`;
          li.appendChild(audio);
          break;
      }
      entriesList.appendChild(li);
    });
  }

  // Escape HTML (für Text)
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- TEXT Eintrag speichern ---
  saveTextBtn.onclick = () => {
    const content = textEntry.value.trim();
    if (!content) {
      alert('Bitte Text eingeben.');
      return;
    }
    const entries = JSON.parse(localStorage.getItem(`entries_${diaryId}`) || '[]');
    entries.push({
      id: generateId(),
      type: 'text',
      content,
      createdAt: new Date().toISOString()
    });
    saveEntries(entries);
    renderEntries(entries);
    textEntry.value = '';
  };

  // --- ZEICHNEN ---
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) * (canvas.width / rect.width),
      y: (evt.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function getTouchPos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const touch = evt.touches[0];
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  canvas.addEventListener('mousedown', e => {
    drawing = true;
    const pos = getMousePos(canvas, e);
    lastX = pos.x;
    lastY = pos.y;
  });

  canvas.addEventListener('mousemove', e => {
    if (!drawing) return;
    const pos = getMousePos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  });

  canvas.addEventListener('mouseup', e => {
    drawing = false;
  });

  canvas.addEventListener('mouseleave', e => {
    drawing = false;
  });

  // Touch Events für mobile Geräte
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    drawing = true;
    const pos = getTouchPos(canvas, e);
    lastX = pos.x;
    lastY = pos.y;
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!drawing) return;
    const pos = getTouchPos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    drawing = false;
  });

  clearCanvasBtn.onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  saveCanvasBtn.onclick = () => {
    const dataUrl = canvas.toDataURL();
    if (dataUrl === canvasBlankDataUrl()) {
      alert('Die Zeichnung ist leer.');
      return;
    }
    const entries = JSON.parse(localStorage.getItem(`entries_${diaryId}`) || '[]');
    entries.push({
      id: generateId(),
      type: 'drawing',
      content: dataUrl,
      createdAt: new Date().toISOString()
    });
    saveEntries(entries);
    renderEntries(entries);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Hilfsfunktion: Prüfen, ob Canvas leer ist
  function canvasBlankDataUrl() {
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    return blank.toDataURL();
  }

  // --- MULTIMEDIA BILDER ---
  imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const entries = JSON.parse(localStorage.getItem(`entries_${diaryId}`) || '[]');

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        entries.push({
          id: generateId(),
          type: 'image',
          content: ev.target.result,
          createdAt: new Date().toISOString()
        });
        saveEntries(entries);
        renderEntries(entries);
      };
      reader.readAsDataURL(file);
    });

    // Reset input um mehrfaches Hochladen derselben Datei zu ermöglichen
    imageInput.value = '';
  });

  // --- MULTIMEDIA AUDIO ---
  audioInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const entries = JSON.parse(localStorage.getItem(`entries_${diaryId}`) || '[]');

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        entries.push({
          id: generateId(),
          type: 'audio',
          content: ev.target.result,
          createdAt: new Date().toISOString()
        });
        saveEntries(entries);
        renderEntries(entries);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    audioInput.value = '';
  });

  // Hilfsfunktion ID (wird aus index.js übernommen)
  function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }
})();
