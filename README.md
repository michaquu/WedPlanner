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
npm run check
```

The combined check runs linting, all unit and component tests, strict TypeScript
compilation, and the production build. Each command can also be run separately.

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
- Web Push via VAPID and GitHub Actions

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

## Note reminders on iPhone

Note reminders use Web Push. The PWA must be installed on the iPhone home
screen, and the user must enable notifications from the app drawer. iOS 16.4
or newer is required.

Generate VAPID keys locally:

```bash
npx web-push generate-vapid-keys
```

Add the generated values as GitHub repository secrets:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (for example `mailto:your-email@example.com`)
- `FIREBASE_DATABASE_URL` (for example `https://wedding-planner-nm-default-rtdb.firebaseio.com`)

The public VAPID key must also be available to the frontend when building the
PWA as `VITE_VAPID_PUBLIC_KEY`. Configure it in the deployment environment or
in a local `.env` file based on `.env.example`. Never expose the private VAPID
key in frontend code.

Deploy the database rules after adding the push paths:

```bash
firebase deploy --only database
```

The workflow in `.github/workflows/send-note-reminders.yml` runs every five
minutes and can also be started manually from the GitHub Actions tab. It reads
notes with a configured reminder date, sends due notifications, and records
delivery IDs to avoid sending the same reminder repeatedly.
