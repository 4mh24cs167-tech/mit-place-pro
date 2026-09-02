# ðŸŽ“ UdyogaMITra

<div align="center">

### Intelligent Campus Placement Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000?logo=vercel)](https://mitm-placepro.vercel.app)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://mitm-placepro.onrender.com)

**A full-stack, multi-role placement management platform built for MITM (Maharaja Institute of Technology Mysore) to streamline campus placements, assessments, and recruitment workflows.**

[Live Demo](https://mitm-placepro.vercel.app) Â· [Architecture](ARCHITECTURE.md) Â· [Security](SECURITY.md)

</div>

---

## ðŸ“‹ Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Features by Dashboard](#-features-by-dashboard)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Roles & Permissions](#-roles--permissions)
- [Related Documentation](#-related-documentation)

---

## ðŸ”­ Overview

UdyogaMITra digitizes the entire campus placement lifecycle â€” from student onboarding to final selection â€” replacing manual spreadsheets and email chains with a modern, real-time web application. It connects three key stakeholders:

| Role | Portal | Description |
|------|--------|-------------|
| ðŸ›¡ï¸ **Admin** | `/admin/*` | Placement officers managing students, companies, drives, assessments, email campaigns, meetings, and feedback |
| ðŸŽ“ **Student** | `/student/*` | Students building profiles, discovering jobs, registering for drives, viewing assessments & credentials |
| ðŸ¢ **Company** | `/company/*` | Recruiters posting jobs, scheduling multi-round drives, tracking candidates, and scheduling meetings |

---

## ðŸ› ï¸ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.6 | React framework with App Router & Turbopack |
| React | 19.1 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling with CSS custom properties |
| Lucide React | 0.514 | 1000+ SVG icons |
| Radix UI | 1.2 | Accessible component primitives (`react-slot`) |
| class-variance-authority | 0.7 | Component variant system |
| xlsx | 0.18 | Client-side Excel/CSV file parsing |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | 11.1 | Node.js framework with decorators, DI, and modules |
| TypeORM | 0.3 | PostgreSQL ORM with entity decorators and query builder |
| PostgreSQL | (Neon) | Cloud-native serverless database |
| Passport | 0.7 | Authentication middleware |
| passport-jwt | 4.0 | JWT extraction and validation strategy |
| @nestjs/jwt | 11.0 | JWT signing (7-day expiry) |
| bcrypt | 6.0 | Password hashing (10 salt rounds) |
| Nodemailer | 7.0 | SMTP email delivery (via Brevo) |
| Multer | 1.4.5 | Multipart file upload handling |
| class-validator | 0.14 | Request body validation |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting with edge CDN, auto-deploy from GitHub |
| **Render** | Backend hosting (Node.js, free tier) |
| **Neon** | Serverless PostgreSQL with SSL |
| **Brevo** | Transactional SMTP email relay (port 2525) |

---

## âœ¨ Features by Dashboard

### ðŸ›¡ï¸ Admin Dashboard (`/admin/*`)

#### Dashboard (`/admin/dashboard`)
- **Real-time stats cards**: Total Students, Total Companies, Active Drives, Placement Rate (%)
- **Department-wise placement chart**: Bar chart showing placed vs total per department
- **Recent activity feed**: Latest registrations, placements, and drive events
- **Quick action buttons**: Create student, company, or drive

#### Student Management (`/admin/students`)
- **Search**: Real-time search by name, USN, or email (ILIKE query)
- **Filters**: Department dropdown, Batch dropdown, Placement Status (unplaced/placed/opted-out)
- **Student table**: Photo, USN, Name, Department, Batch, CGPA, Status, Actions
- **Bulk upload**: Drag-and-drop CSV/XLSX upload â€” upserts by email (creates new or updates existing)
- **Create student**: Full form with all 25+ profile fields
- **Per-student actions**: Edit profile (modal), Reset password (to `USN@2025`), Delete, Upload photo
- **Pagination**: Page number selector + items per page (default 50)
- **Photo management**: Click avatar to upload/change; stored as Base64

#### Company Management (`/admin/companies`)
- **Company grid**: Cards showing logo, name, industry, location, contact person, verification badge
- **Create company**: Modal â€” company name, email, password, website, industry, location, contact info
- **Actions**: Delete company, Reset password (to `Company@123`)

#### Drive Management (`/admin/drives`)
- **Drive cards**: Title, company, CTC, drive date, status badge, eligible department tags
- **Create drive**: Full form â€” title, description, company, CTC, stipend, role, location, type, dates, departments (multi-select), eligibility criteria (min CGPA, max backlogs)
- **Drive detail** (expandable):
  - Registration count & status breakdown
  - **Round management**: Add/edit/complete rounds (Aptitude, Technical, Coding, GD, HR, Managerial, Final)
  - **Registered students table**: With attendance marking (checkboxes)
  - **Round result submission**: Pass/Fail per student per round
  - **Shortlist action**: Bulk-shortlist by min CGPA and department
- **Status lifecycle**: Draft â†’ Published â†’ Ongoing â†’ Completed
- **Publish trigger**: Auto-creates notifications + registrations for all eligible students

#### Assessment System (`/admin/assessments`)
- **Assessment list**: Cards with title, type badges (Aptitude/Technical/Coding/Interview), status, deadline, score
- **Create assessment**: Title, description, types (multi-select), departments, batches, status, deadline, max score
- **Assessment detail panel** (expandable):
  - **Links section**: Add/remove resource links (title, URL, platform, instructions)
  - **Sub-assessments section**:
    - Add sub-items: title, type, description, schedule date/time, 24-hour flag
    - **Department-specific**: Multi-department selector â€” only those students see the sub-assessment
    - Nested links per sub-assessment
    - Department filter tabs (multi-select) to filter view
  - **Batch schedules section**:
    - Add batch slots: label, departments, date, start/end time, venue, USN range (startâ€“end)
    - Auto-assigns students to schedule by USN number range
  - **Credential upload section**:
    - Upload .xlsx/.csv with Email, Password, LoginID columns
    - **Preview-before-save flow**: Parses file â†’ shows matched students table (USN, Name, Dept, Password) + not-found emails + warning if replacing existing â†’ Confirm & Save or Cancel
    - Re-upload **replaces all** previous credentials for that assessment
  - **Submissions table**: All assigned students with USN, Name, Department, Status, Score, filtered by selected departments
  - **Bulk grading**: Update score/status/remarks for multiple students
  - **Stats**: Completion rate %, average score, department-wise breakdown, score distribution

#### Meeting Management (`/admin/meetings`)
- **Meeting cards**: Title, date, time, type (virtual/in-person), location/meet link, company, status badge
- **Create meeting**: Company, job link, title, date, time range, type, location/meet link, description
- **Actions**: Edit, Delete, Mark completed/cancelled
- **Status**: Scheduled â†’ Completed / Cancelled

#### Email System (`/admin/email`)
- **Compose**: Subject, body, recipient filters (department, batch, placement status, or custom list)
- **Send preview**: Shows recipient count before sending
- **Email logs**: Table of sent emails â€” timestamp, subject, recipient count, status
- **SMTP**: Via Brevo relay (smtp-relay.brevo.com:2525)

#### Feedback Dashboard (`/admin/feedback`)
- **Feedback list**: Drive name, company, type badge, overall rating (stars), comments
- **Filter by type**: Company-to-college, Student-to-college
- **Category breakdown**: Individual rated categories

#### Batch Management (`/admin/batches`)
- **Batch list**: All batches with student counts per department

#### Department Management (`/admin/departments`)
- **Department list**: All departments with student counts
- **Add/Delete**: Dynamic department management

---

### ðŸŽ“ Student Dashboard (`/student/*`)

#### Dashboard (`/student/dashboard`)
- **Welcome card**: Student name, USN, department, batch
- **Profile completion**: Progress bar showing % complete
- **Quick stats**: Drives registered, Applications submitted, Placement status
- **Upcoming events**: Next drive dates, assessment deadlines, meetings
- **Quick action links**: Profile, Jobs, Drives, Assessments

#### Profile (`/student/profile`)
- **Photo upload**: Upload/change with preview
- **Personal info**: Full name, email, phone, parent phone, address
- **Academic info**: USN, department, section, semester, batch, CGPA, backlogs
- **Education**: 10th %, 12th %, Diploma %
- **Skills**: Tag-based input for skills array
- **Links**: LinkedIn, GitHub, Portfolio URLs
- **Resume**: Upload/view
- **Placement status**: Current status display
- **Edit mode**: Toggle all fields to edit, save changes

#### Jobs (`/student/jobs`)
- **Job cards**: Title, company, CTC/stipend, location, mode, type, deadline
- **Eligibility check**: Backend filters by student's department, CGPA, backlog count
- **Apply**: One-click application with duplicate prevention
- **Status tracking**: Applied, Under Review, Shortlisted

#### Drives (`/student/drives`)
- **Available drives tab**: Eligible drives with Register/Decline buttons
- **My drives tab**: Registered drives with round progress
- **Drive cards**: Company, CTC, date, rounds info, current status
- **Round progress**: Which round student is in, result per round
- **Status badges**: Registered â†’ Attended â†’ Shortlisted â†’ Selected / Rejected

#### Assessments (`/student/assessments`)
- **Assessment cards**: Title, type badges, deadline, status
- **Assessment detail** (expandable):
  - **Batch info**: Prominent gradient card showing batch label, schedule date/time, venue
  - **Sub-assessments**: Filtered by student's department only
  - **Credentials**: Login ID + Password displayed if assigned
  - **Links**: Resource links for the assessment
  - **Score**: Shows score if graded

#### Meetings (`/student/meetings`)
- **Meeting cards**: Title, date, time, type, location/meet link, company
- **Join button**: Opens meet link for virtual meetings

#### Notifications (`/student/notifications`)
- **Chronological list**: All notifications with unread badge
- **Mark as read**: Click to mark individual notifications
- **Types**: Drive updates, Round results, Assessment assignments, Announcements

#### Feedback (`/student/feedback`)
- **Pending feedback**: Drives where student attended but hasn't submitted feedback
- **Submit**: Rating (1-5 stars), category ratings, comments, anonymous option
- **History**: Past submitted feedback

---

### ðŸ¢ Company Dashboard (`/company/*`)

#### Dashboard (`/company/dashboard`)
- **Stats**: Total Jobs, Active Drives, Total Candidates, Meetings Scheduled
- **Active jobs summary**: Quick view of open positions
- **Upcoming meetings**: Next scheduled meetings

#### Jobs (`/company/jobs`)
- **Job list**: All posted jobs with title, status, applicant count, deadline
- **Create job**: Full form â€” title, description, requirements, location, CTC, stipend, type (full-time/internship/both), mode (remote/onsite/hybrid), openings, eligible departments, eligibility criteria, deadline
- **Job detail** (`/company/jobs/[jobId]`):
  - Job info display with edit
  - **Publish/Unpublish**: Toggle visibility â€” publish auto-creates Drive + notifications + student registrations
  - **Round management**: Define rounds (type, date, location, instructions)
  - **Availability**: Set interview time slots
  - **Candidate table**: All registered students â€” USN, Name, Department, CGPA, Status, with search/filter
  - **Candidate detail**: Click to view full student profile (academic, skills, resume)
  - **Attendance marking**: Checkbox per candidate per round
  - **Round results**: Pass/Fail per candidate, with individual and bulk submission

#### Drives (`/company/drives`)
- **Drive list**: Company's drives with status, date, registration counts
- **Drive detail**: Registration table, round progress

#### Meetings (`/company/meetings`)
- **Full CRUD**: Create, view, edit, delete, cancel meetings
- **Meeting types**: Virtual (with meet link) or in-person (with location)

#### Feedback (`/company/feedback`)
- **Pending**: Drives to rate the college
- **Submit**: Overall rating, category ratings, comments
- **History**: Past feedback

---

## ðŸ“ Project Structure

```
mitm-placepro/
â”œâ”€â”€ src/                                # Frontend (Next.js 16)
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ layout.tsx                  # Root layout: AuthProvider, fonts (Inter + JetBrains Mono)
â”‚   â”‚   â”œâ”€â”€ page.tsx                    # Landing page: hero, stats, CTA â†’ /login
â”‚   â”‚   â”œâ”€â”€ globals.css                 # Tailwind v4 + CSS custom properties theming
â”‚   â”‚   â”œâ”€â”€ (auth)/login/page.tsx       # Login: email+password, role-based redirect
â”‚   â”‚   â”œâ”€â”€ (admin)/admin/
â”‚   â”‚   â”‚   â”œâ”€â”€ layout.tsx              # Admin guard, sidebar+header+bottom bar
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ students/page.tsx       # 900+ lines: search, filters, table, bulk upload, CRUD
â”‚   â”‚   â”‚   â”œâ”€â”€ companies/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ drives/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ assessments/page.tsx    # 870+ lines: sub-items, batches, credentials, grading
â”‚   â”‚   â”‚   â”œâ”€â”€ meetings/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ email/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ feedback/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ batches/page.tsx
â”‚   â”‚   â”‚   â””â”€â”€ departments/page.tsx
â”‚   â”‚   â”œâ”€â”€ (student)/student/
â”‚   â”‚   â”‚   â”œâ”€â”€ layout.tsx              # Student guard, header+bottom bar
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ profile/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ jobs/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ drives/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ assessments/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ meetings/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ notifications/page.tsx
â”‚   â”‚   â”‚   â””â”€â”€ feedback/page.tsx
â”‚   â”‚   â””â”€â”€ (company)/company/
â”‚   â”‚       â”œâ”€â”€ layout.tsx              # Company guard, header+sidebar
â”‚   â”‚       â”œâ”€â”€ dashboard/page.tsx
â”‚   â”‚       â”œâ”€â”€ jobs/page.tsx
â”‚   â”‚       â”œâ”€â”€ jobs/[jobId]/page.tsx   # Job detail: rounds, candidates, results
â”‚   â”‚       â”œâ”€â”€ drives/page.tsx
â”‚   â”‚       â”œâ”€â”€ meetings/page.tsx
â”‚   â”‚       â””â”€â”€ feedback/page.tsx
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ layout/
â”‚   â”‚   â”‚   â”œâ”€â”€ Header.tsx              # Top bar: avatar, name, role badge, logout
â”‚   â”‚   â”‚   â”œâ”€â”€ AdminSidebar.tsx        # Desktop sidebar: 10 nav links with icons
â”‚   â”‚   â”‚   â”œâ”€â”€ AdminBottomBar.tsx      # Mobile: 5 tabs + "More" slide-up drawer
â”‚   â”‚   â”‚   â””â”€â”€ StudentBottomBar.tsx    # Mobile: 5 tabs + "More" drawer
â”‚   â”‚   â””â”€â”€ ui/
â”‚   â”‚       â””â”€â”€ button.tsx              # CVA variant button (6 variants, 4 sizes, Slot support)
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”œâ”€â”€ api.ts                      # 80+ API functions: adminApi, studentApi, companyApi
â”‚   â”‚   â”œâ”€â”€ auth-context.tsx            # JWT AuthProvider: login, logout, token persistence
â”‚   â”‚   â””â”€â”€ utils.ts                    # cn() classname merge utility
â”‚   â””â”€â”€ types/
â”‚       â””â”€â”€ index.ts                    # 8 shared interfaces: User, Student, Company, Job, etc.
â”‚
â”œâ”€â”€ backend/                            # Backend (NestJS 11)
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ main.ts                     # Bootstrap: CORS, ValidationPipe, 50MB body limit
â”‚       â”œâ”€â”€ app.module.ts               # TypeORM config: 18 entities, synchronize:true, SSL
â”‚       â”œâ”€â”€ auth/
â”‚       â”‚   â”œâ”€â”€ auth.controller.ts      # POST /auth/login
â”‚       â”‚   â”œâ”€â”€ auth.service.ts         # bcrypt verify, JWT sign (7d expiry)
â”‚       â”‚   â””â”€â”€ jwt.strategy.ts         # Bearer token extraction + validation
â”‚       â”œâ”€â”€ admin/
â”‚       â”‚   â”œâ”€â”€ admin.controller.ts     # 35+ routes: students, companies, drives, assessments
â”‚       â”‚   â”œâ”€â”€ admin.service.ts        # Student CRUD, bulk upload, drives, meetings, email
â”‚       â”‚   â”œâ”€â”€ assessment.service.ts   # Assessment CRUD, sub-items, schedules, credentials, grading
â”‚       â”‚   â””â”€â”€ email.service.ts        # SMTP transport via Nodemailer + Brevo
â”‚       â”œâ”€â”€ student/
â”‚       â”‚   â”œâ”€â”€ student.controller.ts   # 18 routes: profile, jobs, drives, assessments, notifications
â”‚       â”‚   â””â”€â”€ student.service.ts      # Eligibility checks, drive registration, feedback
â”‚       â”œâ”€â”€ company/
â”‚       â”‚   â”œâ”€â”€ company.controller.ts   # 20+ routes: jobs, drives, candidates, meetings, feedback
â”‚       â”‚   â””â”€â”€ company.service.ts      # Jobâ†’Drive publish flow, candidate management, bulk results
â”‚       â””â”€â”€ entities/                   # 18 TypeORM entities
â”‚           â”œâ”€â”€ user.entity.ts          # users: id, email, password, fullName, role, isActive
â”‚           â”œâ”€â”€ student.entity.ts       # students: 25+ columns, skills[], placementStatus
â”‚           â”œâ”€â”€ company.entity.ts       # companies: companyName, industry, isVerified
â”‚           â”œâ”€â”€ drive.entity.ts         # drives + drive_registrations + drive_rounds
â”‚           â”œâ”€â”€ assessment.entity.ts    # 6 entities: assessment, links, sub-items, schedules, submissions, credentials
â”‚           â”œâ”€â”€ meeting.entity.ts       # meetings: virtual/in-person with status lifecycle
â”‚           â”œâ”€â”€ notification.entity.ts  # notifications: type, readAt, metadata
â”‚           â””â”€â”€ feedback.entity.ts      # feedbacks: company-to-college, student-to-college
â”‚
â”œâ”€â”€ render.yaml                         # Render deployment: Node.js free tier, env vars
â”œâ”€â”€ netlify.toml                        # Alternative frontend deploy config
â”œâ”€â”€ next.config.ts                      # images.unoptimized: true
â”œâ”€â”€ package.json                        # Frontend deps
â””â”€â”€ backend/package.json                # Backend deps
```

---

## ðŸ—„ï¸ Database Schema

### 18 Entities across 18 Tables

#### Core Identity
| Table | Primary Key | Key Columns | Relations |
|-------|-------------|-------------|-----------|
| `users` | uuid | email (unique), password (bcrypt), fullName, role (`admin`/`student`/`company`), isActive | â†’ Student, â†’ Company |
| `students` | uuid | usn (unique), department, section, semester, batch, cgpa, backlogs, phone, parentPhone, address, 10th/12th/diploma %, linkedIn, github, portfolio, photoUrl, resumeUrl, skills[], placementStatus, placedCompany, placedPackage | â†’ User, â†’ DriveRegistrations, â†’ Applications, â†’ AssessmentSubmissions |
| `companies` | uuid | companyName, website, industry, location, description, logoUrl, contactPerson, contactPhone, isVerified | â†’ User, â†’ Jobs, â†’ Drives, â†’ Meetings |

#### Jobs & Applications
| Table | Key Columns | Relations |
|-------|-------------|-----------|
| `jobs` | title, description, requirements, location, ctc, stipend, type, mode, openings, eligibleDepartments[], eligibleCriteria (jsonb: minCGPA, maxBacklogs), status, deadline, postedAt | â†’ Company, â†’ Applications, â†’ Drive |
| `applications` | status (`applied`/`under-review`/`shortlisted`/`selected`/`rejected`), appliedAt | â†’ Job, â†’ Student |

#### Placement Drives
| Table | Key Columns | Relations |
|-------|-------------|-----------|
| `drives` | title, description, eligibleDepartments[], eligibleCriteria (jsonb), ctc, stipend, role, location, driveType, driveDate, lastDate, status (`draft`/`published`/`ongoing`/`completed`) | â†’ Company, â†’ Job, â†’ Registrations, â†’ Rounds |
| `drive_registrations` | status (`registered`/`attended`/`shortlisted`/`selected`/`rejected`/`opted-out`/`declined`), currentRound, remarks | â†’ Drive, â†’ Student |
| `drive_rounds` | roundNumber, roundType (`aptitude`/`technical`/`coding`/`gd`/`hr`/`managerial`/`final`), roundDate, location, instructions, isCompleted | â†’ Drive |

#### Assessment System
| Table | Key Columns | Relations |
|-------|-------------|-----------|
| `assessments` | title, description, types[], departments[], batchIds[], status (`draft`/`active`/`expired`), deadline, maxScore | â†’ Links, SubItems, Schedules, Submissions, Credentials |
| `assessment_links` | title, url, platform, instructions, displayOrder | â†’ Assessment |
| `assessment_sub_items` | title, type, description, scheduleDate, startTime, endTime, is24Hours, links (jsonb), departments[], displayOrder | â†’ Assessment |
| `assessment_schedules` | batchLabel, departments[], scheduleDate, startTime, endTime, venue, usnStart, usnEnd | â†’ Assessment |
| `assessment_submissions` | status (`pending`/`completed`/`absent`), score, remarks, attemptedAt, gradedAt | â†’ Assessment, â†’ Student, â†’ Schedule |
| `assessment_credentials` | loginId, loginPassword | â†’ Assessment, â†’ Student |

#### Communication & Feedback
| Table | Key Columns | Relations |
|-------|-------------|-----------|
| `meetings` | title, meetingDate, startTime, endTime, meetingType (`virtual`/`in-person`), location, meetLink, description, status (`scheduled`/`completed`/`cancelled`) | â†’ Company, â†’ Job, â†’ Drive |
| `notifications` | title, message, type, readAt, metadata (jsonb) | â†’ User |
| `email_logs` | subject, body, recipientCount, recipientFilter (jsonb), status, sentBy, sentAt | |
| `feedbacks` | type (`company-to-college`/`student-to-college`), overallRating (1-5), comments, categories (jsonb), isAnonymous | â†’ Drive, â†’ Company, â†’ Student |

---

## ðŸ“¡ API Reference

All routes prefixed with `/api/v1`. Protected by JWT Bearer token unless noted.

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/login` | Authenticate with email + password â†’ JWT token |

### Admin â€” Students (7 routes)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/students` | List students with search, department, batch, status filters + pagination |
| POST | `/admin/students` | Create single student (auto-generates password as `USN@2025`) |
| POST | `/admin/students/bulk` | Bulk upload via CSV/XLSX (upsert by email) |
| PATCH | `/admin/students/:id` | Update student profile fields |
| DELETE | `/admin/students/:id` | Delete student + associated user |
| POST | `/admin/students/:id/reset-password` | Reset to `USN@2025` format |
| POST | `/admin/students/:id/photo` | Upload photo (multipart â†’ Base64) |

### Admin â€” Companies (4 routes)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/companies` | List all companies |
| POST | `/admin/companies` | Create company + user account |
| DELETE | `/admin/companies/:id` | Delete company + user |
| POST | `/admin/companies/:id/reset-password` | Reset to `Company@123` |

### Admin â€” Drives (10 routes)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/drives` | List all drives |
| POST | `/admin/drives` | Create drive |
| PATCH | `/admin/drives/:id` | Update drive |
| DELETE | `/admin/drives/:id` | Delete drive |
| PATCH | `/admin/drives/:id/publish` | Publish â†’ notify + register eligible students |
| GET | `/admin/drives/:id/registrations` | Get registered students with search/filter |
| PATCH | `/admin/attendance` | Mark student attendance |
| PATCH | `/admin/round-result` | Submit pass/fail result |
| GET | `/admin/drives/:id/rounds` | Get drive rounds |
| POST | `/admin/drives/:id/shortlist` | Bulk-shortlist by criteria |

### Admin â€” Assessments (14 routes)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/assessments` | List assessments |
| POST | `/admin/assessments` | Create assessment + auto-assign students |
| GET | `/admin/assessments/:id` | Full detail (lean submission query for memory) |
| PATCH | `/admin/assessments/:id` | Update + re-sync submissions |
| DELETE | `/admin/assessments/:id` | Cascade delete |
| POST | `/admin/assessments/:id/links` | Add resource link |
| DELETE | `/admin/assessments/links/:linkId` | Remove link |
| POST | `/admin/assessments/:id/sub-items` | Add sub-assessment (with departments) |
| PATCH | `/admin/assessments/sub-items/:subItemId` | Update sub-item |
| DELETE | `/admin/assessments/sub-items/:subItemId` | Delete sub-item |
| POST | `/admin/assessments/:id/schedules` | Add batch schedule (assigns students by USN range) |
| DELETE | `/admin/assessments/schedules/:scheduleId` | Remove schedule |
| POST | `/admin/assessments/:id/credentials` | Upload credentials (replaces all existing) |
| POST | `/admin/assessments/:id/credentials/preview` | Preview match/not-found counts |
| POST | `/admin/assessments/:id/bulk-grade` | Bulk grade students |
| GET | `/admin/assessments/:id/stats` | Completion %, avg score, department breakdown |

### Admin â€” Other (8 routes)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/dashboard` | Stats: students, companies, drives, placement rate |
| GET | `/admin/batches` | List batches |
| GET | `/admin/departments` | List departments |
| POST | `/admin/departments` | Add department |
| DELETE | `/admin/departments/:id` | Remove department |
| POST | `/admin/email/send` | Send bulk email via SMTP |
| GET | `/admin/email/logs` | View sent email history |
| GET | `/admin/feedback` | View all feedback |
| CRUD | `/admin/meetings` | Full CRUD for meetings |

### Student (18 routes)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/student/profile` | Get full profile |
| PATCH | `/student/profile` | Update profile |
| POST | `/student/profile/photo` | Upload photo |
| GET | `/student/jobs` | Browse eligible jobs (filtered by dept + criteria) |
| POST | `/student/apply` | Apply for job (with duplicate prevention) |
| GET | `/student/applications` | View applications |
| GET | `/student/interviews` | View interviews |
| GET | `/student/drives/available` | Eligible drives (excludes already registered) |
| POST | `/student/drives/:driveId/register` | Register for drive |
| POST | `/student/drives/:driveId/decline` | Decline drive |
| GET | `/student/drives` | My registered drives with round details |
| GET | `/student/meetings` | Meetings for registered drives |
| GET | `/student/notifications` | All notifications (DESC) |
| PATCH | `/student/notifications/:id/read` | Mark notification read |
| POST | `/student/drives/:driveId/feedback` | Submit drive feedback |
| GET | `/student/feedback` | Past feedback |
| GET | `/student/feedback/pending` | Drives awaiting feedback |
| GET | `/student/assessments` | Assessments with schedule, credentials, sub-items |

### Company (20+ routes)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/company/dashboard` | Stats: jobs, drives, candidates, meetings |
| GET/PATCH | `/company/profile` | View/update company profile |
| POST | `/company/jobs` | Create job |
| GET | `/company/jobs` | List company's jobs |
| GET | `/company/jobs/:jobId` | Job detail |
| PATCH | `/company/jobs/:jobId/publish` | Publish â†’ creates Drive + registrations + notifications |
| PATCH | `/company/jobs/:jobId/rounds` | Set round definitions |
| POST/GET | `/company/jobs/:jobId/availability` | Manage interview slots |
| GET | `/company/jobs/:jobId/candidates` | View registered candidates |
| GET | `/company/students/:studentId` | Full student profile |
| PATCH | `/company/attendance` | Mark attendance |
| PATCH | `/company/round-result` | Submit individual result |
| POST | `/company/jobs/:jobId/submit-round-results` | Bulk round results |
| CRUD | `/company/meetings` | Full meeting management |
| POST | `/company/drives/:driveId/feedback` | Submit feedback |
| GET | `/company/feedback` | Past feedback |
| GET | `/company/feedback/pending` | Drives awaiting feedback |

---

## ðŸš€ Getting Started

### Prerequisites
- **Node.js** â‰¥ 18.x
- **npm** â‰¥ 9.x
- **PostgreSQL** database (or free [Neon](https://neon.tech/) account)

### Installation

```bash
# Clone
git clone https://github.com/4mh24cs167-tech/mit-place-pro.git
cd mit-place-pro

# Frontend
npm install

# Backend
cd backend && npm install && cd ..
```

### Environment Setup

Create `.env.local` in root:
```env
NEXT_PUBLIC_API=http://localhost:3001
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
JWT_SECRET=your-jwt-secret-key
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=2525
SMTP_USER=your-brevo-smtp-user
SMTP_PASS=your-brevo-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

### Run Locally

```bash
# Terminal 1: Backend (port 3001)
cd backend && npm run start:dev

# Terminal 2: Frontend (port 3000)
npm run dev
```

---

## ðŸ” Environment Variables

### Frontend
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API` | âœ… | Backend API base URL |

### Backend
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | âœ… | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | âœ… | Secret for JWT signing | `my-super-secret-key-256bit` |
| `PORT` | âŒ | Server port (default: 3001) | `3001` |
| `SMTP_HOST` | âœ… | SMTP relay hostname | `smtp-relay.brevo.com` |
| `SMTP_PORT` | âœ… | SMTP port | `2525` |
| `SMTP_USER` | âœ… | SMTP username | `your-api-key` |
| `SMTP_PASS` | âœ… | SMTP password | `your-smtp-password` |
| `SMTP_FROM` | âœ… | Sender email address | `placements@mitm.ac.in` |

---

## ðŸŒ Deployment

### Frontend â†’ Vercel
1. Connect GitHub repo to [Vercel](https://vercel.com/)
2. Set `NEXT_PUBLIC_API` environment variable to Render backend URL
3. Auto-deploys on push to `main`

### Backend â†’ Render
Configured via `render.yaml`:
- **Runtime**: Node.js (free tier)
- **Region**: Oregon
- **Build**: `cd backend && npm install && npm run build`
- **Start**: `cd backend && npm run start:prod`
- **Env vars**: DATABASE_URL, JWT_SECRET, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

### Database â†’ Neon
1. Create free PostgreSQL on [Neon](https://neon.tech/)
2. Copy connection string to `DATABASE_URL`
3. TypeORM `synchronize: true` auto-creates all 18 tables on first startup

---

## ðŸ‘¥ Roles & Permissions

| Feature | Admin | Student | Company |
|---------|:-----:|:-------:|:-------:|
| View Dashboard | âœ… | âœ… | âœ… |
| Manage Students (CRUD, bulk upload) | âœ… | âŒ | âŒ |
| Manage Companies | âœ… | âŒ | âŒ |
| Create/Publish Drives | âœ… | âŒ | âŒ |
| Post/Publish Jobs | âŒ | âŒ | âœ… |
| Register for Drives | âŒ | âœ… | âŒ |
| Apply for Jobs | âŒ | âœ… | âŒ |
| Manage Assessments | âœ… | âŒ | âŒ |
| View Assessments + Credentials | âŒ | âœ… | âŒ |
| Grade Submissions | âœ… | âŒ | âŒ |
| Upload Credentials | âœ… | âŒ | âŒ |
| Schedule Meetings | âœ… | âŒ | âœ… |
| View Meetings | âœ… | âœ… | âœ… |
| Send Bulk Emails | âœ… | âŒ | âŒ |
| Submit Feedback | âŒ | âœ… | âœ… |
| View All Feedback | âœ… | âœ… | âœ… |
| Mark Attendance | âœ… | âŒ | âœ… |
| Submit Round Results | âœ… | âŒ | âœ… |
| View Notifications | âŒ | âœ… | âŒ |
| Edit Own Profile | âŒ | âœ… | âœ… |

---

## ðŸ“š Related Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** â€” Detailed system architecture, data flow diagrams, module interactions, and design decisions
- **[SECURITY.md](SECURITY.md)** â€” Authentication flow, authorization model, data protection, threat analysis, and security recommendations

---

<div align="center">

Developed by: Yashas N, Varshith V, Vishesh G Devanur, Yashavanth B N, Vinod Patel, Bhavish S - Dept of CSE

**UdyogaMITra** â€” Streamlining campus placements, one drive at a time.

</div>
