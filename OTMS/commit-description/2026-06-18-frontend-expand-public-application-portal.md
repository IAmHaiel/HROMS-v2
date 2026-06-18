# Frontend: Expand Public Application Portal + Applicant Email Verification

## Changes

### `public_application_portal.tsx`
- Expanded form from 5 fields (FullName, Email, Contact, Position, Resume) to 30+ fields matching the backend refactored DTO
- Form sections: Personal Information (First/Middle/Last/Suffix, Gender, Civil Status, Email, Contact), Address (Current, Permanent), Statutory IDs (SSS, PhilHealth, Pag-IBIG, TIN), Financial (Bank Name, Account Name, Number), Documents (NBI, Medical, PSA, Resume, Contract), Emergency & Dependents, Education & Professional Background, Position
- Updated validation for all required fields with regex patterns (11-digit phone, format checks)
- Updated `handleSubmit()` to send all fields as `multipart/form-data` matching backend property names exactly
- File uploads: 5 document fields with format (.PDF/.DOCX) and 5MB size validation
- Success page now mentions email verification step
- Side panel shows 5 steps covering all sections

### `main.tsx`
- Added route `/applicant/verify-email` for the dedicated applicant verification page

### New: `applicant_verify_email.tsx`
- Dedicated page for applicant email verification
- Calls `GET /api/public/apply/verify-email?token=xxx`
- Shows verifying/success/error states
- Reuses existing `email_verification_page.css` for consistent design

## Backend Verification Link
The backend `PublicApplicationService.cs` generates verification links pointing to `{FrontendBaseUrl}/applicant/verify-email?token=...` which matches the new frontend route.

## Build
- `tsc --noEmit` — 0 errors (3 pre-existing test warnings in `PermissionSelector.test.tsx` only)
- `dotnet build` — 0 errors
