
/**
 * Panthers Schedule Editor (Mobile-Friendly)
 * - Loads JSON from a GitHub Gist (by ID + filename)
 * - Lets you edit a single event for a selected date
 * - Saves the updated JSON back to the same Gist file
 * Notes:
 * - Your token is only used in-memory for API calls (not stored).
 * - We preserve untouched JSON keys and only upsert the selected event.
 */

const els = {
  gistId: document.getElementById('gistId'),
  token: document.getElementById('token'),
  filename: document.getElementById('filename'),
  year: document.getElementById('year'),
  month: document.getElementById('month'),
  day: document.getElementById('day'),
  type: document.getElementById('type'),
  label: document.getElementById('label'),
  time: document.getElementById('time'),
  locationText: document.getElementById('locationText'),
  locationSelect: document.getElementById('locationSelect'),
  locationFieldText: document.getElementById('locationFieldText'),
  locationFieldPractice: document.getElementById('locationFieldPractice'),
  notes: document.getElementById('notes'),
  status: document.getElementById('status'),
  preview: document.getElementById('preview'),
  btnLoad: document.getElementById('btnLoad'),
  btnSave: document.getElementById('btnSave'),
  btnClear: document.getElementById('btnClear'),
};

let originalJson = null;   // parsed JSON currently loaded
let originalRaw = "";      // raw text of loaded JSON
let eventsPath = [];       // path to the events array inside JSON (computed)
let yearNow = new Date().getFullYear();

function pad(n){ return String(n).padStart(2, '0'); }
function ymd(y,m,d){ return `${y}-${pad(m)}-${pad(d)}`; }

// Initialize dropdowns
(function init(){
  // Years: current, current+1
  for (let y = yearNow - 1; y <= yearNow + 2; y++) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = String(y);
    if (y === yearNow) opt.selected = true;
    els.year.appendChild(opt);
  }
  // Months
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  months.forEach((m,i)=>{
    const opt = document.createElement('option');
    opt.value = String(i+1);
    opt.textContent = `${pad(i+1)} - ${m}`;
    els.month.appendChild(opt);
  });
  // Default to current month/day
  const now = new Date();
  els.month.value = String(now.getMonth() + 1);
  rebuildDays();
  els.day.value = String(now.getDate());

  // Wire up listeners
  els.month.addEventListener('change', ()=>{ rebuildDays(); loadEventForSelectedDate(); });
  els.day.addEventListener('change', loadEventForSelectedDate);
  els.year.addEventListener('change', loadEventForSelectedDate);
  els.type.addEventListener('change', toggleLocationByType);
  els.btnLoad.addEventListener('click', onLoad);
  els.btnSave.addEventListener('click', onSave);
  els.btnClear.addEventListener('click', onClear);

  toggleLocationByType(); // initialize location field visibility
})();

function rebuildDays(){
  const year = parseInt(els.year.value,10);
  const month = parseInt(els.month.value,10);
  const last = new Date(year, month, 0).getDate();
  els.day.innerHTML = '';
  for (let d=1; d<=last; d++){
    const opt = document.createElement('option');
    opt.value = String(d);
    opt.textContent = pad(d);
    els.day.appendChild(opt);
  }
}

function setStatus(msg){
  els.status.textContent = msg || '';
}

function toggleLocationByType(){
  const t = els.type.value;
  const practice = (t === 'practice');
  els.locationFieldPractice.classList.toggle('hidden', !practice);
  els.locationFieldText.classList.toggle('hidden', practice);
}

async function onLoad(){
  const gistId = els.gistId.value.trim();
  const filename = els.filename.value.trim();
  const token = els.token.value.trim();
  if (!gistId || !filename || !token){
    setStatus('Please enter Gist ID, Filename, and Token, then tap Load.');
    return;
  }
  setStatus('Loading gist…');
  try{
    const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok){
      const t = await res.text();
      throw new Error(`GitHub error: ${res.status} ${t}`);
    }
    const gist = await res.json();
    if (!gist.files || !gist.files[filename] || gist.files[filename].truncated){
      throw new Error('Could not find the specified filename in this Gist (or it is truncated).');
    }
    originalRaw = gist.files[filename].content;
    originalJson = JSON.parse(originalRaw);
    eventsPath = detectEventsPath(originalJson);
    setStatus('Loaded. Pick Month/Day to view or edit that date.');
    loadEventForSelectedDate(); // prefill if any
    renderPreview();
  }catch(err){
    console.error(err);
    setStatus(err.message);
  }
}

function detectEventsPath(obj){
  // Try common layouts:
  // { events: [...] }
  // { schedule: { events: [...] } }
  // [...] (array itself is the events)
  if (Array.isArray(obj)) return ['@root'];
  if (obj && Array.isArray(obj.events)) return ['events'];
  if (obj && obj.schedule && Array.isArray(obj.schedule.events)) return ['schedule','events'];
  // Fallback: create at root
  return ['events'];
}

function getEventsRef(createIfMissing = true){
  if (!originalJson) return null;
  if (eventsPath[0] === '@root'){
    if (!Array.isArray(originalJson) && createIfMissing) originalJson = [];
    return originalJson;
  }
  let ref = originalJson;
  for (let i=0; i<eventsPath.length; i++){
    const k = eventsPath[i];
    if (i === eventsPath.length-1){
      if (!Array.isArray(ref[k])){
        if (!createIfMissing) return null;
        ref[k] = [];
      }
      return ref[k];
    }else{
      if (!ref[k]){
        if (!createIfMissing) return null;
        ref[k] = {};
      }
      ref = ref[k];
    }
  }
  return null;
}

function loadEventForSelectedDate(){
  if (!originalJson) {
    setStatus('Tip: Load your Gist first. Editing without loading will create a new JSON if you choose to save.');
    return;
  }
  const date = ymd(parseInt(els.year.value,10), parseInt(els.month.value,10), parseInt(els.day.value,10));
  const events = getEventsRef(true);
  const found = events.find(e => (e && (e.date === date || e?.date?.startsWith?.(date))));
  if (found){
    els.type.value = found.type || '';
    els.label.value = found.label || found.vs || '';
    els.time.value = (found.time24 || found.time || '').slice(0,5); // HH:MM
    if ((found.type || '') === 'practice'){
      els.locationSelect.value = (found.location === 'High School' || found.location === 'Jr. High') ? found.location : '';
      els.locationText.value = found.location && !(found.location === 'High School' || found.location === 'Jr. High') ? found.location : '';
    } else {
      els.locationText.value = found.location || '';
      els.locationSelect.value = '';
    }
    els.notes.value = found.notes || '';
  } else {
    // clear
    els.type.value = '';
    els.label.value = '';
    els.time.value = '';
    els.locationText.value = '';
    els.locationSelect.value = '';
    els.notes.value = '';
  }
  toggleLocationByType();
  renderPreview();
}

function onClear(){
  els.type.value = '';
  els.label.value = '';
  els.time.value = '';
  els.locationText.value = '';
  els.locationSelect.value = '';
  els.notes.value = '';
  setStatus('Cleared pending fields.');
  renderPreview();
}

function buildEventFromForm(){
  const year = parseInt(els.year.value,10);
  const month = parseInt(els.month.value,10);
  const day = parseInt(els.day.value,10);
  const date = ymd(year, month, day);
  const type = (els.type.value || '').trim();
  const label = (els.label.value || '').trim();
  const time = (els.time.value || '').trim(); // "HH:MM"
  const location = type === 'practice'
    ? (els.locationSelect.value || els.locationText.value || '').trim()
    : (els.locationText.value || '').trim();
  const notes = (els.notes.value || '').trim();

  // also provide a 12h time display if HH:MM present
  let time12 = '';
  if (time && /^\d{2}:\d{2}$/.test(time)){
    let [h, m] = time.split(':').map(n=>parseInt(n,10));
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h===0) h = 12;
    time12 = `${h}:${String(m).padStart(2,'0')} ${ampm}`;
  }

  return {
    date,
    type,
    label, // alias for VS
    time: time12 || time, // keep a human friendly time
    time24: time,         // canonical HH:MM
    location,
    notes
  };
}

function renderPreview(){
  const ev = buildEventFromForm();
  const sample = {
    ...ev,
    "_note": "This shows how the single selected event will look before saving"
  };
  els.preview.textContent = JSON.stringify(sample, null, 2);
}

async function onSave(){
  const gistId = els.gistId.value.trim();
  const filename = els.filename.value.trim();
  const token = els.token.value.trim();
  if (!gistId || !filename || !token){
    setStatus('Please enter Gist ID, Filename, and Token.');
    return;
  }

  // If user didn't load, start from minimal structure
  if (!originalJson){
    originalJson = { events: [] };
    eventsPath = ['events'];
  }

  const events = getEventsRef(true);
  const ev = buildEventFromForm();

  // Upsert by exact date match (YYYY-MM-DD)
  const idx = events.findIndex(e => e && (e.date === ev.date || e?.date?.startsWith?.(ev.date)));
  if (idx >= 0) {
    events[idx] = { ...events[idx], ...ev };
  } else {
    events.push(ev);
  }

  // bump updatedAt
  if (Array.isArray(originalJson)) {
    // array root: attach metadata object? Safer: do nothing. (App likely reads updatedAt at object root.)
  } else {
    originalJson.updatedAt = new Date().toISOString();
  }

  const newRaw = JSON.stringify(originalJson, null, 2);

  setStatus('Saving to Gist…');
  try{
    const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [filename]: { content: newRaw }
        }
      })
    });
    if (!res.ok){
      const t = await res.text();
      throw new Error(`GitHub error: ${res.status} ${t}`);
    }
    originalRaw = newRaw;
    originalJson = JSON.parse(newRaw);
    setStatus('Saved ✅ Your schedule file has been updated.');
    renderPreview();
  }catch(err){
    console.error(err);
    setStatus(err.message);
  }
}
