# MemoPuzzle Project Handoff

Last updated: 2026-06-23

## Project Root

`/Users/Rosaone/Documents/Playground/story-game-backup-2026-03-25`

## Main Folders

- `frontend/`
  - Vue/Vite frontend source.
  - Main current visual/player route is `#/player-mobile`.

- `backend/`
  - Node.js/Express backend.
  - Handles room APIs, ASR, story/image generation, and Socket.io room state.

- `docs/`
  - Project handoff and development notes.

- `vercel.json`
  - Vercel deployment configuration.

- `RUNNING_NOTES.md`
  - Local running notes and recent development log.

## Local Run

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5181
```

Open:

```text
http://127.0.0.1:5181/#/player-mobile
```

Backend API:

```text
http://127.0.0.1:3000
```

Note: `http://127.0.0.1:3000/` is not the frontend page.

## Environment Variables

Use `backend/.env.example` as the deployment template.

Required services include:

- MongoDB
- Tencent Cloud ASR
- Ali image generation

Do not commit real `.env` files.

## Deployment Package

Current full server handoff package:

`/Users/Rosaone/Documents/Playground/MemoPuzzle-full-server-package-20260615`

Zip package:

`/Users/Rosaone/Documents/Playground/MemoPuzzle-full-server-package-20260615.zip`

Important: if the package is sent to a third party, remove any real `backend/.env` first unless the recipient is trusted.

## Recent Changes

- Added browser speech recognition fallback for the active player route.
- Added ASR diagnostics for local/Vercel checks.
- Fixed Tencent ASR request parameters.
- Updated image generation prompt to avoid collage, storyboard, panel grids, and built-in puzzle lines.

## Next Architecture Update

Planned feature: per-player mobile client.

Scope:

- Phone joins room with player identity.
- Phone records question/answer voice.
- Phone views current puzzle.
- Phone controls puzzle moves.
- Big screen syncs room, voice, question, and puzzle states in real time.

Suggested delivery:

- MVP: 5-8 workdays.
- Stable exhibition version: 10-15 workdays.
