# 🔐 UdyogaMITra - Security Implementation Report

This document outlines the security architecture, authentication mechanisms, authorization rules, data protection policies, and vulnerability mitigations implemented in **UdyogaMITra**.

---

## 📋 Table of Contents
1. [Authentication Mechanism](#1-authentication-mechanism)
2. [Authorization Model (RBAC)](#2-authorization-model-rbac)
3. [Data Protection & Encryption](#3-data-protection--encryption)
4. [File Upload Security](#4-file-upload-security)
5. [Audit & Logging Subsystem](#5-audit--logging-subsystem)
6. [Known Vulnerabilities & Mitigations](#6-known-vulnerabilities--mitigations)
7. [Security Recommendations](#7-security-recommendations)

---

## 1. Authentication Mechanism

### JWT Strategy
UdyogaMITra uses JSON Web Tokens (JWT) for stateless, secure user sessions.
- **Token Generation**: Occurs upon successful authentication at `/auth/login`.
- **Payload Configuration**:
  ```json
  {
    "sub": "user-uuid",
    "email": "user@mitm.ac.in",
    "role": "student|admin|company|principal"
  }
  ```
- **Token Lifespan**: Configured to expire in 7 days.
- **Verification Strategy**: Uses the `passport-jwt` strategy, extracting tokens from the HTTP `Authorization: Bearer <token>` header.

### Password Security & Hashing
- **Bcrypt Hashing**: All user passwords are encrypted using `bcrypt` with a salt cost of 10 rounds before database insertion. Raw passwords are never stored in the database.
- **Default Onboarding Credentials**:
  - Students: Default password matches the template `USN@2025` (e.g. last 3 digits of USN + suffix).
  - Companies: Default password matches the template `Company@123`.
  - Upon first-time login, the boolean flag `mustChangePassword` is evaluated, forcing redirect to `/change-password` for safety.

---

## 2. Authorization Model (RBAC)

Role-Based Access Control (RBAC) is implemented on both the frontend and backend layers to enforce strict resource boundaries.

### Backend Guards (NestJS)
API endpoints are secured using a combinations of NestJS guards:
1. `AuthGuard("jwt")`: Verifies token signature, expiration, and extracts the user object.
2. `RolesGuard`: Matches the authenticated user`"`s role against the metadata defined on the route.

**Example Implementation**:
```typescript
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles("admin")
@Get("students")
async listStudents() { ... }
```

### Route & Resource Scoping
- **Admin Scope**: Unrestricted CRUD operations across all tables.
- **Student Scope**: Read-only access to available drives and jobs. Read/Write access limited solely to their personal Profile, Application submissions, and Feedback reports. Students cannot view or modify other students`"` records.
- **Company Scope**: Restricted to viewing, editing, and publishing jobs created by their own `companyId`. They can only access profiles of students who have explicitly registered/applied to their jobs or drives.
- **Principal Scope**: Read-only access to aggregated analytics reports and dashboard statistics.

---

## 3. Data Protection & Encryption

### Transport Security
- **HTTPS**: All communication between the Next.js frontend, NestJS backend, and client devices must use TLS/SSL encryption.
- **SSL Database Connections**: The TypeORM database configuration connects to the Neon Serverless Postgres instance using SSL configuration:
  `ssl: { rejectUnauthorized: false }`

### Inputs Sanitization & Validation
- **Global NestJS ValidationPipe**: 
  - `transform: true`: Automatically transforms payloads into their typed DTO classes.
  - `whitelist: true`: Automatically strips out properties that are not defined in the DTO, protecting against **Mass Assignment Vulnerabilities**.
- **Case-Insensitive Lookups**: SQL lookups for user authentication convert input emails to lowercase using `LOWER(email)` to prevent spoofing with differing cases.

---

## 4. File Upload Security

UdyogaMITra supports file uploads for Student Photos (Avatar) and Student Resumes.

### Protections Implemented
- **Base64 Encoding**: Student profile photos are stored directly in the database as Base64 strings. While this impacts database storage size, it eliminates the execution risk of untrusted images on the filesystem (Remote Code Execution via file inclusion).
- **Relational Integrity**: Resumes are linked to the student profile via direct external links (e.g., Google Drive links) or uploaded files, minimizing direct script execution risks on the host environment.

---

## 5. Audit & Logging Subsystem

- **Email Auditing**: The `email_logs` table logs every bulk email sent by placement officers, tracking:
  - Recipient counts.
  - Targeted filters (e.g., specific departments or batches).
  - Sent/Failed status flags.
  - Timestamp and administrator ID.
- **Activity Tracker**: Admin Dashboard tracks recent placement changes and system activity to provide visibility into data modification events.

---

## 6. Known Vulnerabilities & Mitigations

### ⚠️ Synchronize in Production
- **Issue**: The backend database connection uses `synchronize: true` in TypeORM.
- **Risk**: Any changes in Entity definitions could result in automatic drop/alter tables on the live PostgreSQL server, risking data loss.
- **Mitigation**: Disable `synchronize: false` in production configuration and adopt structured SQL migrations using TypeORM migrations CLI.

### ⚠️ Permissive CORS Policy
- **Issue**: `enableCors({ origin: true })` allows cross-origin requests from any site.
- **Risk**: Potential Cross-Origin Resource Sharing vulnerabilities if credentials/tokens are abused.
- **Mitigation**: Tighten CORS settings in `main.ts` to allow only the specific production Vercel/Netlify frontend domains.

### ⚠️ Missing API Rate Limiting
- **Issue**: Endpoints lack rate limiting or throttling.
- **Risk**: Exposed to Denial of Service (DoS) attacks, brute-force password attempts on `/auth/login`, and bulk email spamming on `/admin/email/send`.
- **Mitigation**: Introduce `@nestjs/throttler` package to rate limit all public endpoints, especially authentication and transactional mail routes.

---

## 7. Security Recommendations

1. **Implement Rate Limiting**: Limit API requests to 100 requests per 15 minutes per IP address.
2. **Setup Object Storage**: Move student profile photos and resumes out of the Postgres database into a dedicated, secured AWS S3 bucket or Cloudflare R2 container, utilizing signed URLs for access.
3. **Password Complexity Policies**: Upgrade the default onboarding credentials schema to require users to change temporary passwords instantly upon first onboarding.
