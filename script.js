// Hilfsfunktion: Zufällige ID generieren
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// --- DARKMODE HANDLING ---
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
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

// Tagebücher aus localStorage laden
function loadDiaries() {
  const diariesJson = localStorage.getItem('diaries');
  if (!diariesJson) return [];
  try {
    return JSON.parse(diariesJson);
  } catch {
    return [];
  }
}

// Tagebücher speichern
function saveDiaries(diaries) {
  localStorage.setItem('diaries', JSON.stringify(diaries));
}

// Neues Tagebuch erstellen
function createDiary(title, color, pin) {
  const diaries = loadDiaries();

  if (!title) {
    alert("Bitte Titel eingeben.");
    return;
  }

  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    alert("Bitte gültigen 4-stelligen PIN eingeben.");
    return;
  }

  // Prüfen, ob Titel schon existiert
  if (diaries.some(d => d.title.toLowerCase() === title.toLowerCase())) {
    alert("Ein Tagebuch mit diesem Titel existiert bereits.");
    return;
  }

  const newDiary = {
    id: generateId(),
    title,
    color,
    pin,
    createdAt: new Date().toISOString(),
  };

  diaries.push(newDiary);
  saveDiaries(diaries);
  renderDiaryList();
}

// Tagebuchliste anzeigen
function renderDiaryList() {
  const diaries = loadDiaries();
  const list = document.getElementById('diaryList');
  list.innerHTML = '';

  diaries.forEach(diary => {
    const li = document.createElement('li');
    li.className = 'diaryItem';

    const colorBox = document.createElement('div');
    colorBox.className = 'diaryColor';
    colorBox.style.backgroundColor = diary.color;

    const titleSpan = document.createElement('span');
    titleSpan.textContent = diary.title;

    li.appendChild(colorBox);
    li.appendChild(titleSpan);

    // PIN Eingabe Container
    const pinContainer = document.createElement('div');
    pinContainer.className = 'pinInputContainer';

    const pinInput = document.createElement('input');
    pinInput.type = 'password';
    pinInput.maxLength = 4;
    pinInput.placeholder = 'PIN';

    const pinBtn = document.createElement('button');
    pinBtn.textContent = 'Öffnen';
    pinBtn.className = 'pinSubmitBtn';

    pinBtn.onclick = () => {
      if (pinInput.value === diary.pin) {
        // Tagebuch öffnen - weiterleiten mit ID
        window.location.href = `diary.html?id=${diary.id}`;
      } else {
        alert('Falscher PIN!');
      }
    };

    pinContainer.appendChild(pinInput);
    pinContainer.appendChild(pinBtn);

    li.appendChild(pinContainer);

    li.onclick = () => {
      if (pinContainer.style.display === 'block') {
        pinContainer.style.display = 'none';
      } else {
        pinContainer.style.display = 'block';
        pinInput.focus();
      }
    };

    list.appendChild(li);
  });
}

// Eventlistener für Erstellen Button
document.getElementById('createDiaryBtn').addEventListener('click', () => {
  const title = document.getElementById('diaryTitle').value.trim();
  const color = document.getElementById('diaryColor').value;
  const pin = document.getElementById('diaryPin').value;

  createDiary(title, color, pin);

  // Eingabefelder zurücksetzen
  document.getElementById('diaryTitle').value = '';
  document.getElementById('diaryPin').value = '';
  document.getElementById('diaryColor').value = '#ff0000';
});

// Initial render
renderDiaryList();
