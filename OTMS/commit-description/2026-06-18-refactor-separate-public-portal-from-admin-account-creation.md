# Refactor: Separate Public Application Portal from Admin Account Creation

## Problem

The account-creation logic for two different flows (System Admin employee creation and Public Application Portal) shared code paths, specifically through the `OnboardingService` depending on `IAuthService.CreateToken()`. Changes to one flow could break the other.

## Solution

Fully decoupled the Public Application Portal flow from the System Admin flow. The admin flow (`AuthService.RegisterAsync()`) was left completely untouched.

### Files Changed (6 files + 1 constants)

#### `Entities/Models/ApplicantRecord.cs`
- Added individual name fields: `FirstName`, `MiddleName`, `LastName`, `Suffix`
- Added PII fields: `Gender`, `CivilStatus`, `CurrentResidentialAddress`, `PermanentAddress`
- Added statutory fields: `SSSNumber`, `PhilHealthNumber`, `PagIBIGNumber`, `TIN`
- Added financial fields: `BankName`, `BankAccountName`, `BankAccountNumber`
- Added document paths: `NBIClearanceFilePath`, `MedicalClearanceFilePath`, `PSABirthCertificateFilePath`, `SignedEmploymentContractFilePath`
- Added emergency fields: `EmergencyContactName`, `EmergencyContactRelationship`, `EmergencyContactMobileNumber`, `DeclaredDependents`
- Added education fields: `HighestEducationalAttainment`, `InstitutionAndYearGraduated`, `ProfessionalLicensesCertifications`
- Added verification fields: `IsEmailVerified`, `EmailVerificationToken`, `EmailVerificationTokenExpiry`
- `FullName` preserved (populated from individual name fields for backward compatibility)

#### `Entities/DTOs/Public/ApplicantSubmissionDTO.cs`
- Expanded from 5 fields to 30+ fields matching full Application Form requirements
- Added `[Required]`, `[MaxLength]`, and `[RegularExpression]` data annotations

#### `Service/Interfaces/IPublicApplicationService.cs`
- Added `VerifyEmailAsync(string token)` method

#### `Service/Services/PublicApplicationService.cs`
- Injected `IConfiguration` for verification email link generation
- `SubmitApplicationAsync()`: Handles all new fields, validates all 5 optional file uploads (.PDF/.DOCX, max 5MB), generates email verification token, sends verification email
- New `VerifyEmailAsync()`: Validates token, marks `IsEmailVerified = true`, notifies admins
- New helpers: `ValidateUploadedFiles()`, `SendVerificationEmailAsync()`, `BuildFullName()`

#### `Controllers/publicApplicationController.cs`
- Added `GET api/public/apply/verify-email?token=xxx` endpoint

#### `Service/Services/OnboardingService.cs`
- **Removed** `IAuthService` dependency from constructor — no coupling to admin auth
- **Replaced** `authService.CreateToken()` calls with local `CreateToken()` method
- **Updated** name extraction to use individual `ApplicantRecord` fields instead of parsing `FullName`

#### `Common/Constraints/NotificationTypes.cs`
- Added `ApplicationEmailVerified` constant

### Not Modified
- `AuthService.RegisterAsync()` — **Zero changes** to signature, logic, controller, or route
- `authorizationController.Register()` — **Untouched**
- `POST api/authorization/systemadmin/register` — **Unchanged**

## Verification

- Build: `dotnet build` — **0 errors, warnings only (pre-existing XML comment warnings)**
- All data flows verified to be independent with no shared code paths between admin and public portal flows

## Next Steps

1. Run `dotnet ef migrations add ExpandApplicantRecordFields` to create the database migration
2. Run `dotnet ef database update` to apply the migration
3. Proceed with Frontend modifications and Backend Integration with Google OAuth validation
