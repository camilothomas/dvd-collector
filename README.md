# dvd-collector

A local web app for tracking my DVD collection — Criterion Collection, Arrow Video, and everything else.

## Stack

- Node.js + Express
- Vanilla HTML/CSS/JS
- JSON file storage (local only, not tracked in git)

## Setup

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

## Features

- Three lists: Criterion Collection, Arrow Video, Other
- Sorted alphabetically
- Green dot indicates a title has been watched
- Blue dot indicates notes are stored
- Click any title to edit watched status, add notes, or delete

## Data

Everything is stored in `db.json` in the project root. It's created automatically on first run and ignored by git — your collection stays local.
