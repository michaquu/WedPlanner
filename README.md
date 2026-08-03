# Wedding Planner

A mobile-first progressive web app for organizing a wedding. It supports task
sections, costs, deadlines, notes, attachments, favorite tasks, and project
sharing through a project ID.

## Getting started

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm test
npm run lint
npm run build
```

Run tests continuously while developing:

```bash
npm run test:watch
```

## Technology stack

- React 19 and TypeScript
- Vite and `vite-plugin-pwa`
- Material UI
- Firebase Realtime Database
- dnd-kit

## Project structure

- `src/components/app` - application header, navigation, summary, and dialogs
- `src/components/dashboard` - independent dashboard panels
- `src/components/item-details` - task editing and note creation
- `src/components/planner` - search, deletion, and drag-and-drop previews
- `src/components/section` - section actions and dialogs
- `src/hooks` - project synchronization, planner operations, and persisted state
- `src/utils` - data transformations, CSV reporting, Firebase, and local storage

## Data storage

Project data is synchronized with Firebase. Interface preferences, including
hidden sections, item order, and search visibility, are stored locally in the
browser.

Dashboard reports are exported as semicolon-separated CSV files encoded as
UTF-8 with a byte order mark, which keeps them compatible with Excel.
