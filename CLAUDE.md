# CoachSync — CLAUDE.md

## Project Overview
CoachSync is a coach-athlete management platform with multilingual support.
The goal is to allow coaches and athletes to communicate and manage training
across language barriers.

**Stack**
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Next.js API Routes + TypeScript
- ORM: Prisma
- Database: PostgreSQL (Supabase)
- Auth: NextAuth.js v5 (JWT)
- Translation: DeepL API
- Visualization: Python FastAPI (separate service, Phase 4)
- Future: React Native / Expo (mobile, out of scope for now)

## Development Environment
- OS: Windows
- Shell: PowerShell / Command Prompt (not bash)
- Node.js: Windows native (not WSL)
- Package manager: npm
- Always use cross-env for environment variables in package.json scripts
- PGlite does NOT work on Windows — always use Supabase connection

## Feature Requirements & Progress

### Phase 1 — Auth & User Management ✅
- [x] Email/password signup and login
- [x] JWT-based auth (NextAuth.js v5)
- [x] Role-based access control (COACH / ATHLETE / ADMIN)
- [x] Coach-athlete relation (CoachAthleteRelation model)
- [x] Invite link for coach-athlete pairing
- [ ] Profile settings (name, language, profile image)

### Phase 2 — Training & Schedule ✅ (API only, no UI yet)
- [x] Training program CRUD (coach only for write)
- [x] Training session CRUD (nested under programs)
- [x] Athlete roster management (GET/POST/DELETE /api/athletes)
- [x] Frontend UI for programs and sessions
- [ ] Event/schedule management (matches, camps)
- [ ] Calendar view (month/week/day)
- [ ] Athlete personal records (PB tracking)
- [ ] Condition tracking (weight, RPE, sleep, mood)
- [ ] Pagination on list endpoints
- [ ] GET /api/coach (athlete-side coach info endpoint)

### Phase 3 — Feedback & Multilingual
- [ ] Feedback/comment system (coach → athlete)
- [ ] Chat-style message thread (1-to-1)
- [ ] DeepL API integration for auto-translation
- [ ] Per-user language preference
- [ ] Push notifications (PWA)

### Phase 4 — Data Visualization (Python)
- [ ] Python FastAPI service (separate Docker container)
- [ ] Performance trend charts (Pandas + Plotly)
- [ ] Fatigue/condition time-series charts
- [ ] Training volume heatmap
- [ ] PDF report generation (coach-facing)

### Phase 5 — Polish & Deploy
- [ ] Docker + docker-compose setup
- [ ] CI/CD (GitHub Actions)
- [ ] PWA support
- [ ] Security audit
- [ ] Performance optimization

## Architecture
- Feature-folder pattern: each feature has types, repository, service files
- Service layer returns discriminated unions: { ok: true, data } | { ok: false, status, error }
- All API routes check session and role before processing

## How to Work on This Project

At the start of each session:
1. Read this CLAUDE.md to understand current progress
2. Identify the next unchecked item in the feature list above
3. State what you are about to implement and confirm before starting

For each feature:
1. Implement the feature
2. Write a basic test (API route test or component test)
3. Run the test and confirm it passes
4. Update the checkbox in this CLAUDE.md
5. Append a log entry to DEVLOG.md in the following format:

---
## [YYYY-MM-DD] Session #N

### ✅ Implemented
-

### 🛠️ Commands used
```bash
```

### 🧪 Tests
- Test name:
- Result: PASS / FAIL
- Notes:

### 🚧 Issues & Solutions
**Problem:**
**Cause:**
**Fix:**

### 💡 Notes
-

### 📌 Next
- [ ]
---

## Current Priorities (in order)
1. Run migrations from Windows PowerShell: npx prisma generate && npx prisma migrate deploy
2. GET /api/coach endpoint (athlete-side)
3. Profile settings (name, language, profile image)
4. Condition tracking (RPE, sleep, mood, weight) — separate daily log feature
5. Calendar view (month/week/day) for sessions
