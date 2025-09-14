# Panthers Schedule Editor (Mobile-Friendly)
A single-file HTML+JS+CSS tool to **load/edit/save** your Panthers schedule JSON directly in a **GitHub Gist**.

## Features
- Mobile-first layout with big touch targets
- Month/Day/Year pickers to choose the exact date
- Fields: **Type**, **VS (Label)**, **Time**, **Location** (text or practice dropdown), **Notes**
- Gist settings: **Gist ID**, **GitHub Token**, **Filename** (defaults to `mount-morris-panthers-schedule.json`)
- **Load from Gist** and **Save to Gist** (PATCH)
- **Clear All** to reset pending changes (without touching the Gist)
- Auto-bumps `updatedAt` (object-root) when saving
- Tries to preserve your existing JSON structure and only updates/inserts the selected event

## JSON Expectations
The editor can handle common shapes:
- `{ "events": [...] }`
- `{ "schedule": { "events": [...] } }`
- Or directly an array `[...]` (it will upsert into the root array, but won’t add `updatedAt` there)

Each event includes:
```json
{
  "date": "YYYY-MM-DD",
  "type": "game|practice|meeting|other",
  "label": "string (VS label)",
  "time": "e.g. 6:00 PM",
  "time24": "HH:MM",
  "location": "text, or 'High School'/'Jr. High' for practice",
  "notes": "optional"
}
```

## Security
- The GitHub token you paste is only used in your browser’s memory for that session; it is **not stored** anywhere.
- Use a token with **gist** scope.
- Consider creating a fine-scoped token with expiration for safety.

## Usage
1. Open `index.html` in your browser.
2. Enter **Gist ID**, **GitHub Token**, and confirm the **Filename**.
3. Tap **Load from Gist**.
4. Pick **Month/Day/Year**; the form will try to load that date’s event if it exists.
5. Edit fields and tap **Save to Gist**. Done ✅

---
