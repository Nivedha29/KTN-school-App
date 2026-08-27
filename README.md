# KTN Digital Online School — React Version

This project converts the original single-file AI-generated HTML app into a maintainable React + JavaScript application using Vite.

## Run locally

1. Install Node.js 18+.
2. Open a terminal in this folder.
3. Run:

```bash
npm install
npm run dev
```

Vite will print the local development URL, usually `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

## Main source files

- `src/App.jsx` — app shell, navigation, staff login, local-storage state
- `src/components/Home.jsx` — home page
- `src/components/About.jsx` — school information and milestones
- `src/components/Classes.jsx` — timetable and grade filters
- `src/components/Teachers.jsx` — volunteer teacher directory
- `src/components/News.jsx` — announcements and staff posting controls
- `src/components/Apply.jsx` — admission request form
- `src/components/Staff.jsx` — staff admission-request view
- `src/data/schoolData.js` — timetable, teachers, news, milestones and asset paths
- `src/styles.css` — shared responsive styling
- `public/assets/` — logo, teacher photos and gallery images extracted from the original HTML

## Demo staff access

PIN: `1234`

News posts and admission requests currently use browser `localStorage`. For a real public school website, replace this with a backend/API and secure authentication before deployment.
