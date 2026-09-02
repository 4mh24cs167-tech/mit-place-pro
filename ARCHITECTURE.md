# 🏛️ UdyogaMITra - System Architecture

This document provides a detailed overview of the system architecture, data models, design patterns, and application flows of the **UdyogaMITra** Placement Management System.

---

## 📋 Table of Contents
1. [System Topology](#1-system-topology)
2. [Component Interactions](#2-component-interactions)
3. [Database & Schema Model](#3-database-schema-model)
4. [Key Subsystem Designs](#4-key-subsystem-designs)
5. [Frontend Design & Directory Structure](#5-frontend-design--directory-structure)
6. [Backend Modular Layout](#6-backend-modular-layout)
7. [Deployment & Infrastructure](#7-deployment--infrastructure)

---

## 1. System Topology

UdyogaMITra follows a decoupled, client-server Architecture:

```
                  ┌──────────────────────────────┐
                  │      Vercel / Netlify        │
                  │   Static Next.js Web App     │
                  └──────────────┬───────────────┘
                                 │
                                 │ HTTPS (JSON API)
                                 ▼
                  ┌──────────────────────────────┐
                  │       Render Cloud           │
                  │   NestJS (Node.js) Server    │
                  └──────────────┬───────────────┘
                                 │
                                 │ SSL (TypeORM Connection)
                                 ▼
                  ┌──────────────────────────────┐
                  │         Neon DB              │
                  │     Serverless Postgres      │
                  └──────────────────────────────┘
```

- **Frontend Client**: Built using Next.js 16 (App Router), served as statically optimized pages. Client-side state is handled via Zustand and data fetching is managed using TanStack Query.
- **Backend API**: Structured via NestJS (TypeScript) with a modular architecture split into logical modules (Auth, Admin, Student, Company).
- **Database Layer**: Hosted on Neon DB running serverless PostgreSQL. Database operations are abstracted using TypeORM.

---

## 2. Component Interactions

### 🔐 Authentication Flow
1. **Request**: The user submits credentials via the frontend Login page.
2. **Hashed Comparison**: The backend hashes the input and checks it against the database using `bcrypt`.
3. **Token Issuance**: On match, the backend signs a JSON Web Token (JWT) with the user details and role.
4. **Local Persistence**: The token is stored in the browser`"`s `localStorage` as `mitm_token`.
5. **Authorization Headers**: Subsequent requests attach the token as an `Authorization: Bearer <token>` header.

### 💼 Job Posting to Drive Registration Flow
```
┌──────────────┐          ┌──────────────┐          ┌──────────────────────┐
│   Company    │          │  Backend API │          │       Students       │
│  posts Job   ├─────────>│ creates Job  ├─────────>│  Notify & Auto-Link  │
└──────────────┘          │   & Drive    │          │  to Drive Registr.   │
                          └──────────────┘          └──────────────────────┘
```
1. **Creation**: A company creates a Job description with specific eligibility criteria (Min CGPA, Backlogs, allowed departments).
2. **Publish Event**: Once published, the NestJS service triggers a database transaction that creates a corresponding **Placement Drive**.
3. **On-the-fly Onboarding**: The system automatically registers all eligible students to this Drive based on their profile data.
4. **Real-time Notifications**: Custom database entries triggers a feed update notifying relevant students.

---

## 3. Database & Schema Model

Below is a detailed representation of the 18 main TypeORM entities within the database:

### Core Identity & Account Mapping
- **User (`users`)**: Central account lookup mapping credentials, activation status (`isActive`), and system role (`admin`, `student`, `company`, `principal`).
- **Student (`students`)**: Tracks detailed academic history (CGPA, USN, 10th/12th/Diploma percentages, active backlogs) and links to user profile data (projects, skills, experience, and uploaded resume links).
- **Company (`companies`)**: Retains company meta-information, description, logos (stored as Base64/S3 references), contact information, and verification flags.

### Placement Drives & Processes
- **Job (`jobs`)**: Requirements, work mode (onsite/remote/hybrid), CTC boundaries, and strict eligibility benchmarks.
- **Drive (`drives`)**: Core recruitment event linking to a specific Job or Company. Manage round setups and criteria.
- **DriveRegistration (`drive_registrations`)**: Links a student to a drive with a status state machine:
  `registered` ➔ `attended` ➔ `shortlisted` ➔ `selected` / `rejected` / `declined`.
- **DriveRound (`drive_rounds`)**: Step-by-step interview phases (e.g., Round 1: Aptitude, Round 2: Technical, Round 3: HR).

### Assessment Subsystem
- **Assessment (`assessments`)**: Evaluation modules mapped to departments and batches.
- **AssessmentSubItem (`assessment_sub_items`)**: Specific sub-assessments (e.g., Coding test, Technical test) containing resource links.
- **AssessmentSchedule (`assessment_schedules`)**: USN-range batch configuration with time slots and venues to avoid system load spikes.
- **AssessmentSubmission (`assessment_submissions`)**: Records scores, timestamps, and evaluator remarks.
- **AssessmentCredential (`assessment_credentials`)**: Stores pre-generated logins for the external test systems (e.g., HackerRank) and securely displays them to students.

---

## 4. Key Subsystem Designs

### ⚡ Memory-Safe Assessment Querying
Loading thousands of student submissions complete with deep relational tables (User, Batch, Student) frequently crashed the Render API due to 512MB RAM constraints (Out of Memory). 

**Design Solution**:
Rather than mapping TypeORM relation arrays globally inside `findOne`, UdyogaMITra separates the parent Assessment fetch from the submissions loading. Submissions are loaded via a specialized `QueryBuilder` that selects only key columns needed for the admin layout:
```typescript
this.submissionRepo.createQueryBuilder("sub")
  .select(["sub.id", "sub.status", "sub.score", "student.usn", "student.fullName"])
  .innerJoin("sub.student", "student")
  .where("sub.assessmentId = :id", { id })
  .getMany();
```
This reduces the heap footprint by up to 85%, ensuring stable execution on Render free-tier instances.

### 🛡️ Bulk Student CSV Onboarding
The onboarding utility allows placement officers to upload thousands of student profiles simultaneously:
1. **Parsing**: The client parses the file with the `xlsx` library.
2. **Validation**: Checks for schema compliance.
3. **Transaction**: Sends chunked payloads to the backend `/admin/students/bulk` endpoint.
4. **Upsert Operation**: The backend runs an upsert query based on email matching to update existing students or insert new accounts, returning detailed sync feedback (Count of updated/created records).

---

## 5. Frontend Design & Directory Structure

UdyogaMITra utilizes Next.js App Router for layout scoping and rendering:

- **Auth Group (`(auth)/`)**: Manages public login and change password routes.
- **Admin Group (`(admin)/`)**: Admin tools mapping students, companies, drives, assessments, batches, and email logs.
- **Student Group (`(student)/`)**: Mobile-first dashboard focusing on job discovery, registrations, notification feeds, profile builder, and assessment viewer.
- **Company Group (`(company)/`)**: recruiter panel tracking candidate pipeline, managing job rounds, scheduling meetings, and logging attendance.
- **State Management**:
  - `auth-context.tsx`: Top-level user session store.
  - Zustand stores: Manage local filters, modals, and tables.

---

## 6. Backend Modular Layout

The backend directory structure represents clean modularity:

- **`auth/`**: Session control, strategy token generation, and password validation.
- **`admin/`**: High-privilege operations, bulk operations, assessment scheduler, and SMTP email services.
- **`student/`**: Account-specific requests, job searches, drive check-in, and feedback logs.
- **`company/`**: Candidate evaluations, schedule setups, and results publisher.

---

## 7. Deployment & Infrastructure

- **Frontend Deployment**: Configured via `netlify.toml` / Vercel hooks with static optimizations (`images.unoptimized: true` to bypass Next.js image optimizer bills).
- **Backend Deployment**: Deployed on Render using NestJS production scripts.
- **Database Connection**: Neon Serverless Postgres with SSL connection enabled:
  `ssl: { rejectUnauthorized: false }`

---
