# ClintRank – Finalized MVP Requirements & Claude Code Prompt

> **How to use this document:** Paste the contents of any section (or the entire document) into Claude Code to build the MVP. The sections are ordered by dependency — work through them top to bottom.

---

## Project Context

**Repo:** `clinttuttle/ClintRank-Coding-Challenges`  
**Stack:** React + Vite (frontend), Axios (HTTP client), Node.js/Express (backend), Sequelize ORM, PostgreSQL (database)  
**Purpose:** A HackerRank-style coding challenge platform for JavaScript students, with student and faculty roles.

The existing codebase has a working React + Vite frontend and a Node.js backend. This prompt builds on top of that foundation.

---

## CLAUDE CODE MASTER PROMPT

Paste this into Claude Code:

---

```
I am building ClintRank, a HackerRank-style JavaScript coding challenge platform for classroom use.
The repo is a React + Vite frontend with a Node.js/Express backend.

Please implement the following MVP features in full. Work through them in order, as each section
depends on the previous one.

────────────────────────────────────────────
1. DEPENDENCIES & ENVIRONMENT SETUP
────────────────────────────────────────────

Backend — install the following npm packages:
  - express (already installed)
  - pg                      # PostgreSQL driver (required by Sequelize)
  - pg-hstore               # Serializes hstore data (required by Sequelize)
  - sequelize               # ORM for model definitions, migrations, associations
  - sequelize-cli           # CLI for migrations and seeders (also: npm install -g sequelize-cli)
  - bcryptjs                # Password hashing
  - jsonwebtoken            # JWT auth
  - dotenv                  # Environment variable management
  - helmet                  # HTTP security headers
  - cors                    # CORS control
  - express-rate-limit      # Brute force / rate limiting
  - express-validator       # Input validation & sanitization
  - morgan                  # HTTP request logging

Frontend — install:
  - axios                   # HTTP client for all API calls to the backend
  - @codemirror/view
  - @codemirror/state
  - @codemirror/lang-javascript
  - @codemirror/theme-one-dark
  - @codemirror/commands     # needed for Tab key handling

Create a `.env` file at the project root (add it to .gitignore) with these variables:
  JWT_SECRET=<generate a random 64-char hex string>
  JWT_EXPIRES_IN=8h
  PORT=3001
  NODE_ENV=development
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=clintrank
  DB_USER=your_postgres_username
  DB_PASSWORD=your_postgres_password

────────────────────────────────────────────
2. DATABASE SCHEMA (PostgreSQL via Sequelize ORM)
────────────────────────────────────────────

Set up Sequelize with PostgreSQL. Create the following files:

A. backend/config/database.js  — Sequelize connection config
   Read all connection values from .env (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).
   Export a Sequelize instance. Call sequelize.authenticate() on startup and log success/failure.

B. backend/models/index.js  — barrel file that imports all models and sets up associations

C. Four Sequelize model files in backend/models/:

   User.js
     - id           INTEGER, primaryKey, autoIncrement
     - username     STRING(30), allowNull: false, unique: true
     - email        STRING, allowNull: false, unique: true, validate: isEmail
     - passwordHash STRING, allowNull: false    (field: 'password_hash')
     - role         ENUM('student','faculty'), allowNull: false, defaultValue: 'student'
     - lastLogin    DATE                        (field: 'last_login')
     - timestamps: true (createdAt, updatedAt managed by Sequelize)
     - Never return passwordHash in toJSON() — override toJSON to delete it

   Challenge.js
     - id           INTEGER, primaryKey, autoIncrement
     - title        STRING, allowNull: false
     - description  TEXT, allowNull: false
     - starterCode  TEXT, allowNull: false      (field: 'starter_code')
     - displayOrder INTEGER, allowNull: false, defaultValue: 0  (field: 'display_order')
     - isActive     BOOLEAN, allowNull: false, defaultValue: true  (field: 'is_active')
     - timestamps: true

   TestCase.js
     - id             INTEGER, primaryKey, autoIncrement
     - challengeId    INTEGER, allowNull: false  (field: 'challenge_id', FK to Challenge)
     - input          TEXT, allowNull: false
     - expectedOutput TEXT, allowNull: false     (field: 'expected_output')
     - displayOrder   INTEGER, defaultValue: 0   (field: 'display_order')
     - isHidden       BOOLEAN, defaultValue: false  (field: 'is_hidden')
     - timestamps: false

   UserChallengeProgress.js
     - id            INTEGER, primaryKey, autoIncrement
     - userId        INTEGER, allowNull: false   (field: 'user_id', FK to User)
     - challengeId   INTEGER, allowNull: false   (field: 'challenge_id', FK to Challenge)
     - status        ENUM('not_started','in_progress','complete'), defaultValue: 'not_started'
     - currentCode   TEXT                        (field: 'current_code')
     - submittedCode TEXT                        (field: 'submitted_code')
     - attempts      INTEGER, defaultValue: 0
     - completedAt   DATE                        (field: 'completed_at')
     - timestamps: true
     - unique constraint on [userId, challengeId]

D. Associations (defined in models/index.js):
   - User hasMany UserChallengeProgress (foreignKey: 'user_id')
   - Challenge hasMany UserChallengeProgress (foreignKey: 'challenge_id')
   - Challenge hasMany TestCase (foreignKey: 'challenge_id', onDelete: 'CASCADE')
   - UserChallengeProgress belongsTo User
   - UserChallengeProgress belongsTo Challenge

E. Migrations — use sequelize-cli to generate and run migrations for each model.
   Run migrations automatically on server startup with: await sequelize.sync({ alter: true })
   in development, and migrations only in production.

F. Seeders — create a sequelize-cli seeder file that inserts:
   - One faculty account: username=admin, email=admin@clintrank.com, password=Admin1234! 
     (hashed with bcryptjs at 12 rounds), role='faculty'
   - At least two sample JavaScript challenges with 2-3 test cases each so the UI is
     immediately testable. Example challenges:
       1. "Return the Sum" — write a function that returns the sum of two numbers
       2. "Reverse a String" — write a function that reverses a string
   Run seeders with: npx sequelize-cli db:seed:all

────────────────────────────────────────────
3. SECURITY — BACKEND
────────────────────────────────────────────

Apply these controls to the Express server (backend/server.js):

A. HTTP Security Headers
   - Use helmet() as the first middleware. Enable all defaults.

B. CORS
   - Allow only http://localhost:5173 in development and the production origin in production.
   - Allow credentials (for JWT in cookies or Authorization header).

C. Rate Limiting
   - Global: 100 requests per 15 minutes per IP.
   - Auth routes (/api/auth/*): stricter — 10 requests per 15 minutes per IP.
   - Apply using express-rate-limit.

D. Input Validation & Sanitization
   - Use express-validator on every POST/PUT route.
   - Validate and sanitize: email format, username (alphanumeric + underscore, 3–30 chars),
     password (min 8 chars, 1 uppercase, 1 number), and all text fields (trim, escape HTML).
   - Return 422 with a structured error list if validation fails.

E. Authentication — JWT
   - On login, issue a signed JWT containing { userId, role, username }.
   - Use RS256 or HS256 with the JWT_SECRET from .env.
   - Token expiry: 8 hours.
   - Store the token on the frontend in memory (not localStorage) using React Context.
   - Also set it as an httpOnly, Secure, SameSite=Strict cookie for defense in depth.
   - Create middleware `authenticateToken(req, res, next)` that validates the JWT.
   - Create middleware `requireRole('faculty')` that checks the role claim.

F. Password Security
   - Hash all passwords with bcryptjs at 12 rounds.
   - Never return password_hash in any API response.
   - Enforce password policy: minimum 8 characters, 1 uppercase letter, 1 number.

G. Code Execution Security (IMPORTANT)
   - Student code runs client-side using the Function constructor inside a try/catch.
   - Do NOT execute student code server-side (no eval, no vm module, no child_process).
   - The test runner should be a frontend utility that creates an isolated function
     from the student's code, calls it with each test input, catches any errors,
     and compares output to expected. Cap execution at 3 seconds using a timeout guard.
   - Never send raw student code to the server until the student explicitly submits.

H. General
   - Parse JSON bodies with a 50kb limit: express.json({ limit: '50kb' }).
   - Log all requests in development using morgan('dev').
   - Never expose stack traces in production error responses.

────────────────────────────────────────────
4. API ROUTES
────────────────────────────────────────────

AUTH ROUTES (no auth required)
  POST /api/auth/register
    Body: { username, email, password }
    - Validates input, hashes password, inserts user with role='student'
    - Returns 201 + JWT on success

  POST /api/auth/login
    Body: { email, password }
    - Validates credentials, updates last_login, returns JWT
    - On failure, return generic "Invalid credentials" (never reveal which field was wrong)

  POST /api/auth/logout
    - Clears the httpOnly cookie on the server side

STUDENT ROUTES (requires valid JWT)
  GET /api/challenges
    - Returns active challenges sorted by display_order ascending
    - For authenticated students, also returns their status for each challenge
      (join with user_challenge_progress)
    - Includes a top-level summary: { total, not_started, in_progress, complete, percent_complete }

  GET /api/challenges/:id
    - Returns a single challenge including visible test cases
    - Hidden test cases (is_hidden=1) are not returned

  POST /api/challenges/:id/run
    - Body: { code }
    - Server only validates input; actual code execution happens on the frontend
    - This route records the attempt (increment attempts, set status to 'in_progress' if not 'complete')
    - Returns 200 with { recorded: true }

  POST /api/challenges/:id/submit
    - Body: { code, allTestsPassed: true }
    - Server validates allTestsPassed cannot be trivially spoofed:
      re-run test cases server-side with a safe VM or verify logic before accepting
      (see note below on server-side verification alternative)
    - If valid, set status='complete', submitted_code=code, completed_at=NOW
    - Returns 200 with { success: true, message: 'Challenge complete!' }

    NOTE on verification: Since we are avoiding server-side eval, an acceptable
    MVP approach is to run the tests client-side, display all passes, and then
    trust the submission (this is a classroom tool, not a competitive platform).
    Add a TODO comment to add proper sandboxed server-side verification in v2.

  GET /api/progress
    - Returns the current user's progress across all challenges

FACULTY ROUTES (requires valid JWT + role='faculty')
  GET /api/admin/students
    - Returns list of all students (id, username, email, last_login, created_at)
    - Never return password_hash

  GET /api/admin/students/:id/progress
    - Returns a student's progress summary:
      { total, not_started, in_progress, complete, percent_complete, challenges[] }

  GET /api/admin/dashboard
    - Returns aggregate stats:
      { total_students, total_challenges, overall_not_started, overall_in_progress, overall_complete }

  CHALLENGE MANAGEMENT (faculty only)
  GET    /api/admin/challenges          -- list all (including inactive)
  POST   /api/admin/challenges          -- create new challenge
  PUT    /api/admin/challenges/:id      -- update challenge (title, description, starter_code, display_order, is_active)
  DELETE /api/admin/challenges/:id      -- soft delete (set is_active=0)

  GET    /api/admin/challenges/:id/tests       -- list test cases (including hidden ones)
  POST   /api/admin/challenges/:id/tests       -- add test case
  PUT    /api/admin/challenges/:id/tests/:tid  -- update test case
  DELETE /api/admin/challenges/:id/tests/:tid  -- delete test case

────────────────────────────────────────────
5. FRONTEND — AXIOS HTTP CLIENT SETUP
────────────────────────────────────────────

Create a shared Axios instance at src/lib/axios.js:

  import axios from 'axios';

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    withCredentials: true,   // sends the httpOnly cookie automatically
    timeout: 10000,
  });

  // Request interceptor — attach JWT from memory (AuthContext) if available
  // The token is injected by AuthContext after login; see below.
  api.interceptors.request.use((config) => {
    const token = window.__authToken;   // set by AuthContext on login
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Response interceptor — redirect to /login on 401
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  export default api;

Use this `api` instance for ALL frontend HTTP calls instead of raw fetch.
Example: api.get('/api/challenges'), api.post('/api/auth/login', { email, password })

Add VITE_API_URL=http://localhost:3001 to a .env.local file in the project root.

────────────────────────────────────────────
6. FRONTEND — AUTH & ROUTING
────────────────────────────────────────────

A. Auth Context (src/contexts/AuthContext.jsx)
   - Provide user, token, login(), logout(), isAuthenticated, isFaculty
   - On app load, check for a valid httpOnly cookie by calling GET /api/auth/me
     (add this backend route that returns the user from the JWT cookie)
   - Redirect to /login if not authenticated on protected routes

B. React Router Setup (src/App.jsx)
   Routes:
     /login                → LoginPage
     /register             → RegisterPage
     /                     → StudentDashboard (protected, student)
     /challenge/:id        → ChallengePage (protected, student)
     /admin                → AdminDashboard (protected, faculty)
     /admin/challenges     → AdminChallengesPage (protected, faculty)
     /admin/challenges/new → AdminChallengeEditPage (protected, faculty)
     /admin/challenges/:id → AdminChallengeEditPage (protected, faculty)
     /admin/students       → AdminStudentsPage (protected, faculty)

C. Login / Register Pages
   - Clean, centered form with email + password fields
   - Show/hide password toggle
   - Inline validation error messages (red text, no alert popups)
   - "Register" link on login page and vice versa
   - After login, redirect faculty to /admin and students to /

────────────────────────────────────────────
7. FRONTEND — STUDENT EXPERIENCE
────────────────────────────────────────────

A. Student Dashboard (src/pages/StudentDashboard.jsx)
   - Top banner: "Welcome, [username]"
   - Progress bar showing percentage of challenges completed
     e.g., "3 of 10 challenges complete (30%)"
   - Challenge list, sorted by display_order, showing:
       - Challenge title
       - Status badge: grey "Not Started" | yellow "In Progress" | green "Complete"
   - Clicking a challenge navigates to /challenge/:id

B. Challenge Page (src/pages/ChallengePage.jsx)
   Layout: two-column split
   - LEFT PANEL: Challenge description, test cases (visible ones only), Run button, Submit button
   - RIGHT PANEL: CodeMirror editor (see Section 7)

   Behavior:
   - On page load, pre-fill the editor with current_code (the student's last saved code)
     or starter_code if they haven't started yet
   - RUN button:
       - Executes student code client-side against all visible test cases
       - Shows pass/fail result for each test case inline
       - Marks status as 'in_progress' via POST /api/challenges/:id/run
       - Auto-saves current code to the backend on every run
   - SUBMIT button:
       - Disabled until ALL visible test cases pass on the most recent run
       - Calls POST /api/challenges/:id/submit
       - On success: shows a success modal/banner, updates status to 'complete'
       - Prevents re-submission if status is already 'complete' (show "Already completed")

   Test Result Display:
   - For each test case, show: input, expected output, actual output, PASS or FAIL label
   - Use green/red color coding
   - Show a runtime error message in red if the code throws an exception

────────────────────────────────────────────
8. FRONTEND — CODE EDITOR (CodeMirror 6)
────────────────────────────────────────────

Replace any plain <textarea> used for code editing with a CodeMirror 6 editor.

Create a reusable component: src/components/CodeEditor.jsx

Requirements:
  - Language support: JavaScript (use @codemirror/lang-javascript)
  - Theme: One Dark (@codemirror/theme-one-dark) — dark background, syntax highlighting
  - Line numbers enabled
  - Auto-closing brackets enabled
  - Tab key behavior: insert 2 spaces (do NOT move focus to next element)
    Use the indentWithTab keymap from @codemirror/commands and add it to the keymap extension
  - Font: monospace, 14px
  - Minimum height: 400px; expand to fill available space (use CSS flex-grow)
  - The component should accept props: value, onChange, readOnly (optional)

Example usage:
  <CodeEditor value={code} onChange={setCode} />

────────────────────────────────────────────
9. FRONTEND — FACULTY / ADMIN
────────────────────────────────────────────

A. Admin Dashboard (src/pages/AdminDashboard.jsx)
   - Summary cards at the top:
       Total Students | Not Started (aggregate) | In Progress | Complete
   - Percentage bar chart per student (if <20 students) or a summary table for larger classes
   - Quick links to manage challenges and view students

B. Admin Students Page (src/pages/AdminStudentsPage.jsx)
   - Table: Username | Email | Joined | Last Login | Not Started | In Progress | Complete | % Done
   - Click a student row to expand their per-challenge breakdown
   - Sort by any column (default: % complete descending)

C. Admin Challenges Page (src/pages/AdminChallengesPage.jsx)
   - Table listing all challenges: Display Order | Title | Active? | # Test Cases | Actions (Edit, Delete)
   - "Add New Challenge" button → navigates to /admin/challenges/new
   - Drag-to-reorder rows to change display_order (or use up/down arrows as simpler alternative)

D. Admin Challenge Edit Page (src/pages/AdminChallengeEditPage.jsx)
   - Fields: Title, Description (textarea), Starter Code (CodeMirror editor), Display Order, Active toggle
   - Test Cases section:
       - List of existing test cases: Input | Expected Output | Hidden? | Delete button
       - "Add Test Case" button appends a new editable row
       - The test cases list MUST have a scrollable container (max-height: 400px; overflow-y: auto)
         so the page doesn't grow infinitely when many test cases are added
   - Save and Cancel buttons
   - Validation: title and description required; at least one test case required before saving

────────────────────────────────────────────
10. UI / UX POLISH
────────────────────────────────────────────

- Navigation bar: show "ClintRank" logo/name on left; show username + role badge on right;
  Logout button; faculty users see an "Admin" link
- Consistent color scheme: dark navy header, white content area, green accent for success,
  red for errors, yellow for in-progress
- All forms show inline validation errors (no browser alert() calls)
- Loading spinners / skeleton states on all data-fetching components
- Mobile-responsive layout (flexbox/grid); the challenge page stacks vertically on narrow screens
- Favicon and page title: "ClintRank"
- Error boundary at the app root to catch unexpected React crashes gracefully

────────────────────────────────────────────
11. MISSING SECURITY CONTROLS CHECKLIST
────────────────────────────────────────────

Please also ensure the following are in place (these are commonly missed):

[ ] .env file is listed in .gitignore — NEVER commit secrets
[ ] JWT_SECRET is a minimum 32-character random string — warn in server startup if too short
[ ] All database queries go through Sequelize — never use raw string interpolation in sequelize.query() calls;
    always use replacements or bind parameters if raw SQL is ever needed
[ ] No raw string interpolation into SQL anywhere in the codebase
[ ] Password reset flow: out of scope for MVP, but add a TODO comment noting it's needed
[ ] Role is read from the DATABASE on each authenticated request, not solely trusted from the JWT
    (on token validation, optionally re-fetch user role from DB to prevent stale role escalation)
[ ] HTTP response never reveals whether an email exists during login (always "Invalid credentials")
[ ] Remove all console.log statements containing sensitive data before production
[ ] Set secure cookie flags: httpOnly: true, secure: true (in production), sameSite: 'strict'
[ ] Add a Content-Security-Policy header via helmet that restricts script sources
[ ] Dependency audit: run `npm audit` and resolve HIGH/CRITICAL vulnerabilities
[ ] Rate limit the /api/challenges/:id/submit endpoint to prevent spamming submissions

────────────────────────────────────────────
12. FILE STRUCTURE OVERVIEW
────────────────────────────────────────────

Organize the project as follows:

clintrank/
├── backend/
│   ├── server.js              # Express app setup + middleware
│   ├── config/
│   │   └── database.js        # Sequelize connection config
│   ├── models/
│   │   ├── index.js           # Associations barrel file
│   │   ├── User.js
│   │   ├── Challenge.js
│   │   ├── TestCase.js
│   │   └── UserChallengeProgress.js
│   ├── migrations/            # sequelize-cli migration files
│   ├── seeders/               # sequelize-cli seeder files
│   ├── routes/
│   │   ├── auth.js            # /api/auth/*
│   │   ├── challenges.js      # /api/challenges/* (student)
│   │   └── admin.js           # /api/admin/* (faculty)
│   └── middleware/
│       ├── authenticateToken.js
│       └── requireRole.js
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── components/
│   │   ├── CodeEditor.jsx     # CodeMirror wrapper
│   │   ├── Navbar.jsx
│   │   ├── ProgressBar.jsx
│   │   └── TestResultList.jsx
│   └── pages/
│       ├── LoginPage.jsx
│       ├── RegisterPage.jsx
│       ├── StudentDashboard.jsx
│       ├── ChallengePage.jsx
│       ├── AdminDashboard.jsx
│       ├── AdminStudentsPage.jsx
│       ├── AdminChallengesPage.jsx
│       └── AdminChallengeEditPage.jsx
├── public/
├── .env                       # NOT committed to git
├── .env.example               # Template with dummy values — DO commit this
├── .gitignore
├── package.json
└── vite.config.js

────────────────────────────────────────────
13. TESTING THE FINISHED BUILD
────────────────────────────────────────────

After building, verify the following manually:

1. Register a student account → see empty dashboard with all challenges as "Not Started"
2. Click a challenge → code editor loads with starter code, TAB key inserts spaces
3. Write a solution → click Run → see per-test-case pass/fail results
4. Submit button is disabled while any test fails
5. Pass all tests → Submit button enables → click it → challenge marked Complete
6. Return to dashboard → progress bar updates, badge shows "Complete"
7. Log in as admin → see student list with their progress counts
8. Create a new challenge with 3 test cases → verify scroll bar appears in test case list
9. Attempt to access /admin as a student → redirected away
10. Attempt to forge a submit without all tests passing → server rejects or frontend blocks

────────────────────────────────────────────
NOTES / DECISIONS FOR V2 (out of scope for MVP)
────────────────────────────────────────────
- Sandboxed server-side code execution (Docker/VM) for tamper-proof verification
- Password reset via email (nodemailer)
- Student-facing hint system
- Multiple programming language support
- Challenge categories / tags
- Leaderboard
- Export student grades to CSV (faculty)
```

---

## Quick Reference: What Was Added Beyond Your Original Requirements

| Area | What Was Added |
|---|---|
| Security | Rate limiting, input validation/sanitization, helmet headers, CSP, parameterized SQL, httpOnly cookies, role re-verification from DB, .env/.gitignore hygiene |
| Database | PostgreSQL + Sequelize ORM; model files with associations; sequelize-cli migrations + seeders; `is_active`, `is_hidden`, `attempts`, `last_login` fields |
| Frontend HTTP | Axios client with a shared instance (src/lib/axios.js) configured with baseURL and JWT interceptor to auto-attach Authorization header on every request |
| Student UX | Auto-save on run, pre-fill last saved code, success modal on completion, prevent re-submission of completed challenges |
| Code Execution | Client-side sandboxing guidance with 3-second timeout guard, no server-side eval |
| Faculty | Per-challenge breakdown per student, aggregate dashboard stats, soft-delete challenges |
| UI | Navbar with role badge, error boundary, loading states, mobile-responsive layout, `.env.example` file |
| Incomplete Req Fixed | "Make sure the interface..." — interpreted as: consistent design system, responsive layout, inline validation (no alert() popups), loading spinners |
