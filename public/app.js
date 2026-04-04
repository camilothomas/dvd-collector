let titles = [];
let activeId = null;
let activePublisher = null;

const overlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');

const PUBLISHER_LABELS = {
  criterion: 'CRITERION COLLECTION',
  arrow: 'ARROW VIDEO',
  other: 'OTHER'
};

// ── API ──────────────────────────────────────────────────────────────────────

async function fetchTitles() {
  const res = await fetch('/api/titles');
  titles = await res.json();
  renderAll();
}

async function apiAdd(title, publisher) {
  const res = await fetch('/api/titles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, publisher })
  });
  const entry = await res.json();
  titles.push(entry);
  renderAll();
  return entry;
}

async function apiUpdate(id, data) {
  const res = await fetch(`/api/titles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const updated = await res.json();
  const idx = titles.findIndex(t => t.id === id);
  if (idx !== -1) titles[idx] = updated;
  renderAll();
  return updated;
}

async function apiDelete(id) {
  await fetch(`/api/titles/${id}`, { method: 'DELETE' });
  titles = titles.filter(t => t.id !== id);
  renderAll();
}

// ── Render ───────────────────────────────────────────────────────────────────

function renderAll() {
  renderList('criterion');
  renderList('arrow');
  renderList('other');
}

function renderList(publisher) {
  const list = document.getElementById(`${publisher}-list`);
  const sorted = titles
    .filter(t => t.publisher === publisher)
    .sort((a, b) => a.title.localeCompare(b.title));

  list.innerHTML = '';
  sorted.forEach(t => {
    const li = document.createElement('li');
    li.className = 'title-item';
    li.innerHTML = `
      <span class="watched-dot${t.watched ? ' watched' : ''}"></span>
      <span class="title-text">${esc(t.title)}</span>
      <span class="notes-pip${t.notes ? ' has-notes' : ''}"></span>
    `;
    li.addEventListener('click', () => openEditModal(t.id));
    list.appendChild(li);
  });
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── Modal: Add ───────────────────────────────────────────────────────────────

function openAddModal(publisher) {
  activePublisher = publisher;

  modalContent.innerHTML = `
    <div class="modal-publisher-label">${PUBLISHER_LABELS[publisher]}</div>
    <input
      type="text"
      class="modal-title-input"
      id="modal-title-input"
      placeholder="Film title..."
      autocomplete="off"
    >
    <div class="modal-actions">
      <button class="btn-primary" id="modal-confirm">ADD</button>
      <button class="btn-ghost" id="modal-cancel">CANCEL</button>
    </div>
  `;

  const input = document.getElementById('modal-title-input');
  input.focus();

  async function submit() {
    const val = input.value.trim();
    if (!val) return;
    await apiAdd(val, activePublisher);
    closeModal();
  }

  document.getElementById('modal-confirm').addEventListener('click', submit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  document.getElementById('modal-cancel').addEventListener('click', closeModal);

  overlay.classList.add('open');
}

// ── Modal: Edit ──────────────────────────────────────────────────────────────

function openEditModal(id) {
  activeId = id;
  const t = titles.find(x => x.id === id);
  if (!t) return;

  let currentWatched = t.watched;

  modalContent.innerHTML = `
    <div class="modal-publisher-label">${PUBLISHER_LABELS[t.publisher]}</div>
    <div class="modal-title-display">${esc(t.title)}</div>
    <button class="watched-toggle-btn${t.watched ? ' is-watched' : ''}" id="watched-btn">
      <span class="toggle-dot"></span>
      <span id="watched-label">${t.watched ? 'WATCHED' : 'NOT WATCHED'}</span>
    </button>
    <div class="notes-label">NOTES</div>
    <textarea
      class="notes-textarea"
      id="notes-input"
      placeholder="Add notes about this title..."
    >${esc(t.notes || '')}</textarea>
    <div class="modal-actions">
      <button class="btn-primary" id="modal-save">SAVE</button>
      <button class="btn-ghost" id="modal-cancel">CANCEL</button>
      <button class="btn-danger" id="modal-delete">DELETE</button>
    </div>
  `;

  const watchedBtn = document.getElementById('watched-btn');
  watchedBtn.addEventListener('click', () => {
    currentWatched = !currentWatched;
    watchedBtn.classList.toggle('is-watched', currentWatched);
    document.getElementById('watched-label').textContent = currentWatched ? 'WATCHED' : 'NOT WATCHED';
  });

  document.getElementById('modal-save').addEventListener('click', async () => {
    const notes = document.getElementById('notes-input').value;
    await apiUpdate(activeId, { watched: currentWatched, notes });
    closeModal();
  });

  document.getElementById('modal-cancel').addEventListener('click', closeModal);

  document.getElementById('modal-delete').addEventListener('click', async () => {
    if (confirm(`Delete "${t.title}"?`)) {
      await apiDelete(activeId);
      closeModal();
    }
  });

  overlay.classList.add('open');
}

// ── Modal: Close ─────────────────────────────────────────────────────────────

function closeModal() {
  overlay.classList.remove('open');
  activeId = null;
  activePublisher = null;
}

overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.getElementById('modal-close').addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Random unwatched picker ───────────────────────────────────────────────────

function pickRandomUnwatched() {
  const unwatched = titles.filter(t => !t.watched);
  if (!unwatched.length) return;
  const pick = unwatched[Math.floor(Math.random() * unwatched.length)];
  openEditModal(pick.id);
}

document.getElementById('random-btn').addEventListener('click', pickRandomUnwatched);

// ── Add buttons ──────────────────────────────────────────────────────────────

document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', () => openAddModal(btn.dataset.publisher));
});

// ── Legend ───────────────────────────────────────────────────────────────────

document.body.insertAdjacentHTML('beforeend', `
  <div class="legend">
    <div class="legend-item">
      <span class="legend-dot" style="background: var(--watched)"></span>
      WATCHED
    </div>
    <div class="legend-item">
      <span class="legend-dot" style="background: var(--has-notes)"></span>
      HAS NOTES
    </div>
  </div>
`);

// ── Init ─────────────────────────────────────────────────────────────────────

fetchTitles();
