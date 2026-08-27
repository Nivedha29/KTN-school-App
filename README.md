# KTN Digital Online School

A modern, responsive web application for **KTN Digital Online School**, built with **React, JavaScript, and Vite**.

The component-based architecture makes it easier to update school information, manage content, add new features, and prepare the application for future deployment.

## Features

The current version includes:

* Responsive school website interface
* Home page with school information and highlights
* About section with school milestones
* Class timetable with grade-based filtering
* Volunteer teacher directory
* School news and announcements
* Staff login interface
* Staff controls for publishing announcements
* Online student admission request form
* Staff view for reviewing admission requests
* Browser-based data persistence using `localStorage`
* Responsive design for desktop, tablet, and mobile devices

## Technology Stack

* **React** — Component-based user interface
* **JavaScript** — Application logic
* **Vite** — Development server and production build tool
* **CSS** — Responsive layout and styling
* **LocalStorage** — Temporary browser-side data persistence

## Getting Started

### Prerequisites

Install **Node.js 18 or later** before running the application.

Verify your installation:

```bash
node --version
npm --version
```

### Installation

Clone the repository or open a terminal inside the project directory.

Install the required dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will display the local development address in the terminal, typically:

```text
http://localhost:5173
```

Open this address in your web browser to access the application.

## Production Build

Create an optimized production build with:

```bash
npm run build
```

The production files will be generated in the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
KTN-school-App/
├── public/
│   └── assets/
│       ├── logo
│       ├── teacher photos
│       └── gallery images
│
├── src/
│   ├── components/
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Classes.jsx
│   │   ├── Teachers.jsx
│   │   ├── News.jsx
│   │   ├── Apply.jsx
│   │   └── Staff.jsx
│   │
│   ├── data/
│   │   └── schoolData.js
│   │
│   ├── App.jsx
│   └── styles.css
│
├── index.html
├── package.json
└── README.md
```

## Main Source Files

| File                          | Purpose                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `src/App.jsx`                 | Main application shell, navigation, staff authentication, and shared application state    |
| `src/components/Home.jsx`     | School homepage and introductory content                                                  |
| `src/components/About.jsx`    | School information, background, and milestones                                            |
| `src/components/Classes.jsx`  | Class timetable and grade filtering                                                       |
| `src/components/Teachers.jsx` | Volunteer teacher directory                                                               |
| `src/components/News.jsx`     | School announcements and staff news-posting controls                                      |
| `src/components/Apply.jsx`    | Student admission request form                                                            |
| `src/components/Staff.jsx`    | Staff interface for reviewing admission requests                                          |
| `src/data/schoolData.js`      | Centralized school data, including teachers, timetable, news, milestones, and asset paths |
| `src/styles.css`              | Shared responsive application styling                                                     |
| `public/assets/`              | School logo, teacher photographs, gallery images, and other static assets                 |

## Staff Access

A demonstration staff login is included for development and testing.

```text
Demo PIN: 1234
```

> **Important:** The current PIN-based authentication is intended only for demonstration purposes and should not be used as a production authentication system.

## Current Data Storage

The application currently uses browser `localStorage` to store dynamic information such as:

* School news and announcements
* Student admission requests
* Other locally persisted application state

This approach is suitable for demonstration and local development, but data is stored only in the user's browser and is not synchronized between devices.

## Production Considerations

Before deploying the application as a public school platform, the following improvements are recommended:

* Implement secure user and staff authentication
* Replace `localStorage` with a backend database
* Add a server-side API
* Protect administrative routes and operations
* Store passwords and credentials securely
* Add role-based access control
* Add server-side validation for admission requests
* Implement secure management of student information
* Add appropriate privacy and data-retention policies
* Configure production logging, monitoring, and backups

## Future Development

The React architecture allows the platform to be expanded with features such as:

* Student and parent accounts
* Teacher accounts
* Student dashboards
* Online class management
* Attendance tracking
* Assignment and homework management
* Academic progress tracking
* Email notifications
* Admission application status tracking
* Administrative dashboard
* Cloud database integration
* Secure file and document uploads

## Development Workflow

After making changes, test the application locally:

```bash
npm run dev
```

Then create a production build to verify that the project compiles successfully:

```bash
npm run build
```

Commit and push the changes to GitHub:

```bash
git add .
git commit -m "Update project documentation"
git push
```

## Project Status

**Current Stage:** React application development and testing

The application is functional as a front-end prototype. Backend services, production authentication, and centralized database storage are planned for future development.
