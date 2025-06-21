// DOM Elements
const input = document.getElementById('markdown-input');
const preview = document.getElementById('preview');
const titleInput = document.getElementById('note-title');
const noteList = document.getElementById('note-list');
const langPicker = document.getElementById('lang-picker');
const API = '/api/notes';

let lastSavedContent = '';
let currentLang = 'cy';
let unsavedChanges = false;

const translations = {
  en: {
    title: "Nodi - Markdown Editor",
    save: "Save",
    saveToFile: "Save to File",
    loadFile: "Load from File",
    unsavedChanges: "Unsaved changes",
    savedChanges: "Changes saved",
    delete: "Delete",
    newNote: "New Note",
    titlePlaceholder: "Enter note title",
    bodyPlaceholder: "Write Markdown here...",
    saveSuccess: "Note saved!",
    saveFail: "Save failed",
    deleteConfirm: "Delete",
    deletePrompt: "Delete \"{title}\"?",
    deleteSuccess: "Deleted.",
    loadFail: "Failed to load note",
    noTitleAlert: "Title required",
    noDeleteTitle: "No title to delete",
    fileLoadFail: "Failed to load file",
  },
  cy: {
    title: "Nodi - Golygydd Markdown",
    save: "Cadw",
    saveToFile: "Islwytho .md",
    loadFile: "Uwchlwytho .md",
    unsavedChanges: "Newidiadau heb eu cadw",
    savedChanges: "Newidiadau wedi eu cadw",
    delete: "Dileu",
    newNote: "Nodyn newydd",
    titlePlaceholder: "Rhowch enw i'r nodyn",
    bodyPlaceholder: "Ysgrifennwch Markdown yma...",
    saveSuccess: "Nodyn wedi'i gadw",
    saveFail: "Gwall cadw",
    deleteConfirm: "Dileu",
    deletePrompt: "Hoffech chi ddileu \"{title}\"?",
    deleteSuccess: "Nodyn wedi'i ddileu.",
    loadFail: "Gwall llwytho",
    noTitleAlert: "Rhaid rhoi teitl",
    noDeleteTitle: "Does dim nodyn wedi'i ddewis i'w ddileu",
    fileLoadFail: "Gwall llwytho o ffeil",
  },
};

function getNotes() { 
  return JSON.parse(localStorage.getItem('markdownNotes') || '{}');
}

function setNotes(notes) {
  localStorage.setItem('markdownNotes', JSON.stringify(notes));
}

function localizeUI() {
  const t = translations[currentLang];
  if (!t) return;

  const saveBtn = document.getElementById('save-btn');
  const deleteBtn = document.getElementById('delete-btn');
  const newBtn = document.getElementById('new-btn');
  const loadBtn = document.getElementById('load-btn');
  const saveToFileBtn = document.getElementById('save-to-file-btn');
  const pageTitle = document.getElementById('title-i18n');

  if (saveBtn) document.getElementById('save-btn').setAttribute('data-tooltip', translations[currentLang].save);
  if (deleteBtn) document.getElementById('delete-btn').setAttribute('data-tooltip', translations[currentLang].delete);
  if (loadBtn) document.getElementById('load-btn').setAttribute('data-tooltip', translations[currentLang].loadFile);
  if (saveToFileBtn) document.getElementById('save-to-file-btn').setAttribute('data-tooltip', translations[currentLang].saveToFile);
  if (newBtn) newBtn.textContent = t.newNote;
  if (titleInput) titleInput.placeholder = t.titlePlaceholder;
  if (input) input.placeholder = t.bodyPlaceholder;
  if (pageTitle) pageTitle.textContent = t.title;
}

langPicker.addEventListener('change', () => {
  currentLang = langPicker.value;
  localStorage.setItem('preferredLang', currentLang);
  localizeUI();
});


input.addEventListener('input', () => {
  preview.innerHTML = marked.parse(input.value);
  unsavedChanges = (input.value !== lastSavedContent);
});


function refreshNoteList() {
  const notes = getNotes();
  noteList.innerHTML = '';
  Object.keys(notes).forEach(title => {
    const li = document.createElement('li');
    li.textContent = title;
    li.onclick = () => loadNote(title);
    noteList.appendChild(li);
  });
}


function loadNote(title) { 
  const notes = getNotes();
  if (!notes[title]) {
    alert(translations[currentLang].loadFail);
    return;
  }
  titleInput.value = title;
  input.value = notes[title];
  preview.innerHTML = marked.parse(notes[title]);
  lastSavedContent = notes[title];
  unsavedChanges = false;
  localStorage.setItem('openNoteTitle', title);
}


// Save a note
function saveNote() {
  const title = titleInput.value.trim();
  if (!title) return alert(translations[currentLang].noTitleAlert);

  const notes = getNotes();
  notes[title] = input.value;
  setNotes(notes);
  lastSavedContent = input.value;
  unsavedChanges = false;
  localStorage.setItem('openNoteTitle', title);
  alert(translations[currentLang].saveSuccess);
  refreshNoteList();
}

// Delete a note
function deleteNote() { // CHANGED: Now deletes from localStorage
  const title = titleInput.value.trim();
  if (!title) return alert(translations[currentLang].noDeleteTitle);

  if (!confirm(translations[currentLang].deletePrompt.replace('{title}', title))) return;

  const notes = getNotes();
  delete notes[title];
  setNotes(notes);
  titleInput.value = '';
  input.value = '';
  preview.innerHTML = '';
  unsavedChanges = false;
  refreshNoteList();
  alert(translations[currentLang].deleteSuccess);
  localStorage.removeItem('openNoteTitle');
}


function newNote() {
  titleInput.value = '';
  input.value = '';
  preview.innerHTML = '';
  unsavedChanges = false;
}

document.getElementById('file-loader').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    input.value = e.target.result;
    preview.innerHTML = marked.parse(input.value);
    titleInput.value = file.name.replace('.md', '');
    unsavedChanges = true;
  };
  reader.readAsText(file);
});

function saveToFile() {
  const title = titleInput.value.trim() || 'untitled';
  const blob = new Blob([input.value], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// Resizer

const resizer = document.getElementById('resizer');
const editorPane = document.getElementById('markdown-input');
const previewPane = document.getElementById('preview');
let isDragging = false;

resizer.addEventListener('mousedown', () => {
  isDragging = true;
  document.body.style.cursor = 'ew-resize';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const container = resizer.parentElement;
  const totalWidth = container.offsetWidth;
  const offsetLeft = e.clientX - container.getBoundingClientRect().left;
  const leftPercent = Math.min(90, Math.max(10, (offsetLeft / totalWidth) * 100));
  editorPane.style.width = `${leftPercent}%`;
  previewPane.style.width = `${100 - leftPercent}%`;
  localStorage.setItem('editorPreviewRatio', leftPercent);
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
});

// Auto-save status

const saveStatus = document.getElementById('save-status');
function updateSaveStatus() {
  if (unsavedChanges) {
    saveStatus.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${translations[currentLang].unsavedChanges}`;
    return;
  } else {
    saveStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${translations[currentLang].savedChanges}`;
}
}

// Auto-save
function autoSave() { 
  if (!unsavedChanges) return;
  const title = titleInput.value.trim();
  if (!title) return;
  const notes = getNotes();
  notes[title] = input.value;
  setNotes(notes);
  lastSavedContent = input.value;
  unsavedChanges = false;
  localStorage.setItem('openNoteTitle', title);
  console.log(`Auto-saved "${title}"`);
  refreshNoteList();
}


setInterval(autoSave, 10000);
setInterval(updateSaveStatus, 100);

window.addEventListener('beforeunload', () => {
  if (unsavedChanges) {
    autoSave();
  }
}
);


// Initialization

window.onload = async () => {
  const savedLang = localStorage.getItem('preferredLang');
  if (savedLang && translations[savedLang]) {
    currentLang = savedLang;
    langPicker.value = savedLang;
  }
  localizeUI();

  await refreshNoteList();

  const lastNote = localStorage.getItem('openNoteTitle');
  if (lastNote) {
    await loadNote(lastNote);
  } else {
    const res = await fetch(API);
    if (res.ok) {
      const notes = await res.json();
      if (notes.length > 0) {
        await loadNote(notes[0]);
      }
    }
  }

  const savedRatio = localStorage.getItem('editorPreviewRatio');
  if (savedRatio) {
    editorPane.style.width = `${savedRatio}%`;
    previewPane.style.width = `${100 - savedRatio}%`;
  }
};
