-- ============================================================================
-- OTMS SEED DATA SCRIPT - Microsoft SQL Server
-- Generated: 2026-06-20
-- 20 realistic, interconnected rows per entity
-- Roles: OperationAdmin and Encoder only
-- Password for all users: PasswordPassword1001!
-- ============================================================================

SET NOCOUNT ON;
GO

-- ============================================================================
-- 1. ROLES (2 rows: OperationAdmin and Encoder only)
-- ============================================================================
DECLARE @Role_OpAdmin UNIQUEIDENTIFIER = '11111111-1111-1111-1111-000000000001';
DECLARE @Role_Encoder UNIQUEIDENTIFIER = '11111111-1111-1111-1111-000000000002';

INSERT INTO [Roles] ([RoleId], [Name], [Description], [IsSystemDefined], [CreatedAt], [UpdatedAt])
VALUES
(@Role_OpAdmin, 'OperationAdmin', 'Operations Administrator - manages tasks, approvals, and employee operations', 1, '2025-01-15 08:00:00', NULL),
(@Role_Encoder, 'Encoder',        'Data Encoder - handles data entry, task execution, and record encoding',       1, '2025-01-15 08:00:00', NULL);

-- ============================================================================
-- 2. PERMISSIONS (20 rows)
-- ============================================================================
DECLARE @Perm01 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000001';
DECLARE @Perm02 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000002';
DECLARE @Perm03 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000003';
DECLARE @Perm04 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000004';
DECLARE @Perm05 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000005';
DECLARE @Perm06 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000006';
DECLARE @Perm07 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000007';
DECLARE @Perm08 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000008';
DECLARE @Perm09 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000009';
DECLARE @Perm10 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000010';
DECLARE @Perm11 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000011';
DECLARE @Perm12 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000012';
DECLARE @Perm13 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000013';
DECLARE @Perm14 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000014';
DECLARE @Perm15 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000015';
DECLARE @Perm16 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000016';
DECLARE @Perm17 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000017';
DECLARE @Perm18 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000018';
DECLARE @Perm19 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000019';
DECLARE @Perm20 UNIQUEIDENTIFIER = '22222222-2222-2222-2222-000000000020';

INSERT INTO [Permissions] ([PermissionId], [Name], [Description])
VALUES
(@Perm01, 'Tasks.View',           'View tasks assigned or created'),
(@Perm02, 'Tasks.Create',         'Create new tasks'),
(@Perm03, 'Tasks.Update',         'Update task details and progress'),
(@Perm04, 'Tasks.Delete',         'Delete or soft-delete tasks'),
(@Perm05, 'Tasks.Assign',         'Assign tasks to employees'),
(@Perm06, 'Tasks.Approve',        'Approve or reject task submissions'),
(@Perm07, 'Leave.View',           'View leave requests'),
(@Perm08, 'Leave.Submit',         'Submit leave requests'),
(@Perm09, 'Leave.Approve',        'Approve or reject leave requests'),
(@Perm10, 'Employees.View',       'View employee records'),
(@Perm11, 'Employees.Manage',     'Manage employee profiles and 201 files'),
(@Perm12, 'Reports.View',         'View generated reports'),
(@Perm13, 'Reports.Generate',     'Generate operational reports'),
(@Perm14, 'Announcements.View',   'View announcements'),
(@Perm15, 'Announcements.Create', 'Create and publish announcements'),
(@Perm16, 'Recruitment.View',     'View applicant records'),
(@Perm17, 'Recruitment.Manage',   'Manage recruitment pipeline'),
(@Perm18, 'Approvals.Manage',     'Manage approval workflows and routing'),
(@Perm19, 'Templates.Manage',     'Manage task templates'),
(@Perm20, 'Dashboard.View',       'View operational dashboard');

-- ============================================================================
-- 3. ROLE PERMISSIONS (20 rows)
-- ============================================================================
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
VALUES
(@Role_OpAdmin, @Perm01),
(@Role_OpAdmin, @Perm02),
(@Role_OpAdmin, @Perm03),
(@Role_OpAdmin, @Perm04),
(@Role_OpAdmin, @Perm05),
(@Role_OpAdmin, @Perm06),
(@Role_OpAdmin, @Perm07),
(@Role_OpAdmin, @Perm09),
(@Role_OpAdmin, @Perm10),
(@Role_OpAdmin, @Perm11),
(@Role_OpAdmin, @Perm12),
(@Role_OpAdmin, @Perm13),
(@Role_OpAdmin, @Perm15),
(@Role_OpAdmin, @Perm18),
(@Role_OpAdmin, @Perm19),
(@Role_Encoder, @Perm01),
(@Role_Encoder, @Perm03),
(@Role_Encoder, @Perm07),
(@Role_Encoder, @Perm08),
(@Role_Encoder, @Perm14);

-- ============================================================================
-- 4. DEPARTMENTS (4 rows)
-- ============================================================================
DECLARE @Dept_Ops     UNIQUEIDENTIFIER = '33333333-3333-3333-3333-000000000001';
DECLARE @Dept_HR      UNIQUEIDENTIFIER = '33333333-3333-3333-3333-000000000002';
DECLARE @Dept_Finance UNIQUEIDENTIFIER = '33333333-3333-3333-3333-000000000003';
DECLARE @Dept_IT      UNIQUEIDENTIFIER = '33333333-3333-3333-3333-000000000004';

INSERT INTO [Departments] ([DepartmentId], [Name], [Description], [Code], [IsActive], [EffectiveDate], [HeadEmployeeId], [CreatedAt], [UpdatedAt])
VALUES
(@Dept_Ops,     'Operations',     'Core business operations and task management',   'OPS', 1, '2024-01-01 00:00:00', NULL, '2024-01-01 00:00:00', NULL),
(@Dept_HR,      'Human Resources','Recruitment, onboarding, and employee welfare',  'HR',  1, '2024-01-01 00:00:00', NULL, '2024-01-01 00:00:00', NULL),
(@Dept_Finance, 'Finance',        'Payroll, budgeting, and financial reporting',    'FIN', 1, '2024-01-01 00:00:00', NULL, '2024-01-01 00:00:00', NULL),
(@Dept_IT,      'IT Support',     'Technical infrastructure and system support',    'IT',  1, '2024-01-01 00:00:00', NULL, '2024-01-01 00:00:00', NULL);

-- ============================================================================
-- 5. JOB POSITIONS (8 rows)
-- ============================================================================
DECLARE @JP_OpsHead   UNIQUEIDENTIFIER = '44444444-4444-4444-4444-000000000001';
DECLARE @JP_OpsAdmin  UNIQUEIDENTIFIER = '44444444-4444-4444-4444-000000000002';
DECLARE @JP_HRHead    UNIQUEIDENTIFIER = '44444444-4444-4444-4444-000000000003';
DECLARE @JP_HRAdmin   UNIQUEIDENTIFIER = '44444444-4444-4444-4444-000000000004';
DECLARE @JP_FinHead   UNIQUEIDENTIFIER = '44444444-4444-4444-4444-000000000005';
DECLARE @JP_Encoder   UNIQUEIDENTIFIER = '44444444-4444-4444-4444-000000000006';
DECLARE @JP_ITSpec    UNIQUEIDENTIFIER = '44444444-4444-4444-4444-000000000007';
DECLARE @JP_SrEncoder UNIQUEIDENTIFIER = '44444444-4444-4444-4444-000000000008';

INSERT INTO [JobPositions] ([JobPositionId], [DepartmentId], [Title], [Description], [Code], [IsActive], [ReportsToId], [EmploymentType], [PositionLevel], [EffectiveDate], [CreatedAt], [UpdatedAt])
VALUES
(@JP_OpsHead,  @Dept_Ops,     'Operations Manager',    'Oversees all operations and task workflows',          'OPS-MGR',   1, NULL,         'Full-Time', 'Manager',    '2024-01-01 00:00:00', '2024-01-01 00:00:00', NULL),
(@JP_OpsAdmin, @Dept_Ops,     'Operations Admin',      'Manages daily task assignments and approvals',        'OPS-ADM',   1, @JP_OpsHead, 'Full-Time', 'Supervisor', '2024-01-15 00:00:00', '2024-01-15 00:00:00', NULL),
(@JP_HRHead,   @Dept_HR,      'HR Manager',            'Leads recruitment, onboarding, and HR operations',    'HR-MGR',    1, NULL,         'Full-Time', 'Manager',    '2024-01-01 00:00:00', '2024-01-01 00:00:00', NULL),
(@JP_HRAdmin,  @Dept_HR,      'HR Administrator',      'Handles employee records and HR documentation',       'HR-ADM',    1, @JP_HRHead,  'Full-Time', 'Staff',      '2024-02-01 00:00:00', '2024-02-01 00:00:00', NULL),
(@JP_FinHead,  @Dept_Finance,  'Finance Manager',       'Manages payroll processing and financial reports',    'FIN-MGR',   1, NULL,         'Full-Time', 'Manager',    '2024-01-01 00:00:00', '2024-01-01 00:00:00', NULL),
(@JP_Encoder,  @Dept_Ops,     'Data Encoder',           'Performs data entry and encoding tasks',              'OPS-ENC',   1, @JP_OpsAdmin,'Full-Time', 'Staff',      '2024-03-01 00:00:00', '2024-03-01 00:00:00', NULL),
(@JP_ITSpec,   @Dept_IT,      'IT Specialist',          'Provides technical support and system maintenance',   'IT-SPC',    1, NULL,         'Full-Time', 'Staff',      '2024-02-15 00:00:00', '2024-02-15 00:00:00', NULL),
(@JP_SrEncoder,@Dept_Ops,     'Senior Data Encoder',    'Handles complex encoding and mentors junior encoders','OPS-SRENC', 1, @JP_OpsAdmin,'Full-Time', 'Senior',     '2024-04-01 00:00:00', '2024-04-01 00:00:00', NULL);

-- ============================================================================
-- 6. EMPLOYEES (20 rows)
--    Emp01-05 = OperationAdmin | Emp06-20 = Encoder
-- ============================================================================
DECLARE @Emp01 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000001';
DECLARE @Emp02 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000002';
DECLARE @Emp03 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000003';
DECLARE @Emp04 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000004';
DECLARE @Emp05 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000005';
DECLARE @Emp06 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000006';
DECLARE @Emp07 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000007';
DECLARE @Emp08 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000008';
DECLARE @Emp09 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000009';
DECLARE @Emp10 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000010';
DECLARE @Emp11 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000011';
DECLARE @Emp12 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000012';
DECLARE @Emp13 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000013';
DECLARE @Emp14 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000014';
DECLARE @Emp15 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000015';
DECLARE @Emp16 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000016';
DECLARE @Emp17 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000017';
DECLARE @Emp18 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000018';
DECLARE @Emp19 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000019';
DECLARE @Emp20 UNIQUEIDENTIFIER = '55555555-5555-5555-5555-000000000020';

INSERT INTO [Employees] ([EmployeeId],[EmployeeNumber],[FirstName],[MiddleName],[LastName],[Suffix],[ContactNumber],[EmploymentStatus],[Email],[IsEmailVerified],[EmailVerificationToken],[EmailVerificationTokenExpiry],[DepartmentId],[JobPositionId],[ResignationDate],[OffboardingDate],[NTEDate],[OffboardingRemarks],[CreatedAt],[UpdatedAt])
VALUES
(@Emp01,'EMP-2024-001','Ricardo','Santos','Cruz',NULL,'09171234001','Active','ricardo.cruz@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_OpsHead,NULL,NULL,NULL,NULL,'2024-01-10 08:00:00',NULL),
(@Emp02,'EMP-2024-002','Maria','Lopez','Reyes',NULL,'09171234002','Active','maria.reyes@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_OpsAdmin,NULL,NULL,NULL,NULL,'2024-01-15 08:30:00',NULL),
(@Emp03,'EMP-2024-003','Jose','Aquino','Bautista',NULL,'09171234003','Active','jose.bautista@hroms.com',1,NULL,NULL,@Dept_HR,@JP_HRHead,NULL,NULL,NULL,NULL,'2024-01-20 09:00:00',NULL),
(@Emp04,'EMP-2024-004','Ana','Garcia','Villanueva',NULL,'09171234004','Active','ana.villanueva@hroms.com',1,NULL,NULL,@Dept_HR,@JP_HRAdmin,NULL,NULL,NULL,NULL,'2024-02-01 08:00:00',NULL),
(@Emp05,'EMP-2024-005','Carlos','Mendoza','Dela Cruz',NULL,'09171234005','Active','carlos.delacruz@hroms.com',1,NULL,NULL,@Dept_Finance,@JP_FinHead,NULL,NULL,NULL,NULL,'2024-02-10 08:00:00',NULL),
(@Emp06,'EMP-2024-006','Patricia','Ramos','Santos',NULL,'09171234006','Active','patricia.santos@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_SrEncoder,NULL,NULL,NULL,NULL,'2024-03-01 08:00:00',NULL),
(@Emp07,'EMP-2024-007','Miguel','Torres','Fernandez',NULL,'09171234007','Active','miguel.fernandez@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_Encoder,NULL,NULL,NULL,NULL,'2024-03-15 08:00:00',NULL),
(@Emp08,'EMP-2024-008','Cristina','Diaz','Morales',NULL,'09171234008','Active','cristina.morales@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_Encoder,NULL,NULL,NULL,NULL,'2024-03-20 08:00:00',NULL),
(@Emp09,'EMP-2024-009','Roberto','Lim','Tan',NULL,'09171234009','Active','roberto.tan@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_Encoder,NULL,NULL,NULL,NULL,'2024-04-01 08:00:00',NULL),
(@Emp10,'EMP-2024-010','Angela','Rivera','Gonzales',NULL,'09171234010','Active','angela.gonzales@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_Encoder,NULL,NULL,NULL,NULL,'2024-04-10 08:00:00',NULL),
(@Emp11,'EMP-2024-011','Fernando','Castillo','Herrera',NULL,'09171234011','Active','fernando.herrera@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_SrEncoder,NULL,NULL,NULL,NULL,'2024-04-15 08:00:00',NULL),
(@Emp12,'EMP-2024-012','Lucia','Navarro','Pascual',NULL,'09171234012','Active','lucia.pascual@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_Encoder,NULL,NULL,NULL,NULL,'2024-05-01 08:00:00',NULL),
(@Emp13,'EMP-2024-013','Andres','Medina','Soriano',NULL,'09171234013','Active','andres.soriano@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_Encoder,NULL,NULL,NULL,NULL,'2024-05-15 08:00:00',NULL),
(@Emp14,'EMP-2024-014','Isabella','Cruz','Mendoza',NULL,'09171234014','Active','isabella.mendoza@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_Encoder,NULL,NULL,NULL,NULL,'2024-06-01 08:00:00',NULL),
(@Emp15,'EMP-2024-015','Marco','Reyes','Salvador',NULL,'09171234015','Active','marco.salvador@hroms.com',1,NULL,NULL,@Dept_IT,@JP_ITSpec,NULL,NULL,NULL,NULL,'2024-06-15 08:00:00',NULL),
(@Emp16,'EMP-2024-016','Sofia','Alvarez','Domingo',NULL,'09171234016','Active','sofia.domingo@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_Encoder,NULL,NULL,NULL,NULL,'2024-07-01 08:00:00',NULL),
(@Emp17,'EMP-2024-017','Diego','Flores','Aguilar',NULL,'09171234017','Active','diego.aguilar@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_Encoder,NULL,NULL,NULL,NULL,'2024-07-15 08:00:00',NULL),
(@Emp18,'EMP-2024-018','Carmela','Santos','Vergara',NULL,'09171234018','Active','carmela.vergara@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_SrEncoder,NULL,NULL,NULL,NULL,'2024-08-01 08:00:00',NULL),
(@Emp19,'EMP-2024-019','Rafael','Ortiz','Magno',NULL,'09171234019','Active','rafael.magno@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_Encoder,NULL,NULL,NULL,NULL,'2024-08-15 08:00:00',NULL),
(@Emp20,'EMP-2024-020','Teresa','Bueno','Lagman',NULL,'09171234020','Active','teresa.lagman@hroms.com',1,NULL,NULL,@Dept_Ops,@JP_Encoder,NULL,NULL,NULL,NULL,'2024-09-01 08:00:00',NULL);

UPDATE [Departments] SET [HeadEmployeeId] = @Emp01 WHERE [DepartmentId] = @Dept_Ops;
UPDATE [Departments] SET [HeadEmployeeId] = @Emp03 WHERE [DepartmentId] = @Dept_HR;
UPDATE [Departments] SET [HeadEmployeeId] = @Emp05 WHERE [DepartmentId] = @Dept_Finance;

-- ============================================================================
-- 7. ACCOUNTS (20 rows - 1:1 with Employees)
--    Emp01-05 = OperationAdmin | Emp06-20 = Encoder
--    Password: PasswordPassword1001!
-- ============================================================================
DECLARE @Acct01 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000001';
DECLARE @Acct02 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000002';
DECLARE @Acct03 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000003';
DECLARE @Acct04 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000004';
DECLARE @Acct05 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000005';
DECLARE @Acct06 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000006';
DECLARE @Acct07 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000007';
DECLARE @Acct08 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000008';
DECLARE @Acct09 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000009';
DECLARE @Acct10 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000010';
DECLARE @Acct11 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000011';
DECLARE @Acct12 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000012';
DECLARE @Acct13 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000013';
DECLARE @Acct14 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000014';
DECLARE @Acct15 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000015';
DECLARE @Acct16 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000016';
DECLARE @Acct17 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000017';
DECLARE @Acct18 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000018';
DECLARE @Acct19 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000019';
DECLARE @Acct20 UNIQUEIDENTIFIER = '66666666-6666-6666-6666-000000000020';

DECLARE @PwdHash NVARCHAR(MAX) = 'AQAAAAIAAYagAAAAEDt34n6O9qsQ8lUwfJyNKeZ2+gVAGM/IIRcE5Mf2qlXWinvtsqwIGudldMxxH+I0bQ==';

INSERT INTO [Accounts] ([AccountId],[EmployeeId],[RoleId],[PasswordHash],[AccountStatus],[FailedLoginAttempts],[PasswordResetToken],[PasswordResetTokenExpiryTime],[RefreshToken],[RefreshTokenExpiryTime],[IsPasswordChanged],[CreatedAt],[UpdatedAt])
VALUES
(@Acct01,@Emp01,@Role_OpAdmin,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-01-10 08:30:00',NULL),
(@Acct02,@Emp02,@Role_OpAdmin,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-01-15 09:00:00',NULL),
(@Acct03,@Emp03,@Role_OpAdmin,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-01-20 09:30:00',NULL),
(@Acct04,@Emp04,@Role_OpAdmin,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-02-01 08:30:00',NULL),
(@Acct05,@Emp05,@Role_OpAdmin,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-02-10 08:30:00',NULL),
(@Acct06,@Emp06,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-03-01 08:30:00',NULL),
(@Acct07,@Emp07,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-03-15 08:30:00',NULL),
(@Acct08,@Emp08,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-03-20 08:30:00',NULL),
(@Acct09,@Emp09,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-04-01 08:30:00',NULL),
(@Acct10,@Emp10,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-04-10 08:30:00',NULL),
(@Acct11,@Emp11,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-04-15 08:30:00',NULL),
(@Acct12,@Emp12,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-05-01 08:30:00',NULL),
(@Acct13,@Emp13,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-05-15 08:30:00',NULL),
(@Acct14,@Emp14,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-06-01 08:30:00',NULL),
(@Acct15,@Emp15,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-06-15 08:30:00',NULL),
(@Acct16,@Emp16,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-07-01 08:30:00',NULL),
(@Acct17,@Emp17,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-07-15 08:30:00',NULL),
(@Acct18,@Emp18,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-08-01 08:30:00',NULL),
(@Acct19,@Emp19,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-08-15 08:30:00',NULL),
(@Acct20,@Emp20,@Role_Encoder,@PwdHash,'Active',0,NULL,NULL,NULL,NULL,1,'2024-09-01 08:30:00',NULL);

-- ============================================================================
-- 8. EMPLOYEE 201 FILE DATA (20 rows)
-- ============================================================================
INSERT INTO [Employee201FileDatas] ([Employee201FileDataId],[EmployeeId],[SssNumberEncrypted],[PhilhealthNumberEncrypted],[PagibigNumberEncrypted],[TinNumberEncrypted],[BankNameEncrypted],[BankAccountNumberEncrypted],[EmergencyContactNameEncrypted],[EmergencyContactNumberEncrypted],[CreatedAt],[UpdatedAt])
VALUES
(NEWID(),@Emp01,'ENC-SSS-34-1234567-8','ENC-PH-01-234567890','ENC-HDMF-1234567890','ENC-TIN-101-234-567-000','ENC-BDO-Savings','ENC-0012345678','ENC-Elena Cruz','ENC-09181111001','2024-01-10 10:00:00',NULL),
(NEWID(),@Emp02,'ENC-SSS-34-2345678-9','ENC-PH-01-345678901','ENC-HDMF-2345678901','ENC-TIN-102-345-678-000','ENC-BPI-Checking','ENC-0023456789','ENC-Juan Reyes','ENC-09181111002','2024-01-15 10:00:00',NULL),
(NEWID(),@Emp03,'ENC-SSS-34-3456789-0','ENC-PH-01-456789012','ENC-HDMF-3456789012','ENC-TIN-103-456-789-000','ENC-Metrobank-Savings','ENC-0034567890','ENC-Rosa Bautista','ENC-09181111003','2024-01-20 10:00:00',NULL),
(NEWID(),@Emp04,'ENC-SSS-34-4567890-1','ENC-PH-01-567890123','ENC-HDMF-4567890123','ENC-TIN-104-567-890-000','ENC-UnionBank-Savings','ENC-0045678901','ENC-Pedro Villanueva','ENC-09181111004','2024-02-01 10:00:00',NULL),
(NEWID(),@Emp05,'ENC-SSS-34-5678901-2','ENC-PH-01-678901234','ENC-HDMF-5678901234','ENC-TIN-105-678-901-000','ENC-RCBC-Checking','ENC-0056789012','ENC-Carmen Dela Cruz','ENC-09181111005','2024-02-10 10:00:00',NULL),
(NEWID(),@Emp06,'ENC-SSS-34-6789012-3','ENC-PH-01-789012345','ENC-HDMF-6789012345','ENC-TIN-106-789-012-000','ENC-BDO-Savings','ENC-0067890123','ENC-Ramon Santos','ENC-09181111006','2024-03-01 10:00:00',NULL),
(NEWID(),@Emp07,'ENC-SSS-34-7890123-4','ENC-PH-01-890123456','ENC-HDMF-7890123456','ENC-TIN-107-890-123-000','ENC-BPI-Savings','ENC-0078901234','ENC-Lucia Fernandez','ENC-09181111007','2024-03-15 10:00:00',NULL),
(NEWID(),@Emp08,'ENC-SSS-34-8901234-5','ENC-PH-01-901234567','ENC-HDMF-8901234567','ENC-TIN-108-901-234-000','ENC-Metrobank-Checking','ENC-0089012345','ENC-Antonio Morales','ENC-09181111008','2024-03-20 10:00:00',NULL),
(NEWID(),@Emp09,'ENC-SSS-34-9012345-6','ENC-PH-01-012345678','ENC-HDMF-9012345678','ENC-TIN-109-012-345-000','ENC-Chinabank-Savings','ENC-0090123456','ENC-Grace Tan','ENC-09181111009','2024-04-01 10:00:00',NULL),
(NEWID(),@Emp10,'ENC-SSS-34-0123456-7','ENC-PH-01-123456789','ENC-HDMF-0123456789','ENC-TIN-110-123-456-000','ENC-BDO-Checking','ENC-0101234567','ENC-Roberto Gonzales','ENC-09181111010','2024-04-10 10:00:00',NULL),
(NEWID(),@Emp11,'ENC-SSS-34-1234567-9','ENC-PH-01-234567891','ENC-HDMF-1234567891','ENC-TIN-111-234-567-000','ENC-SecurityBank-Savings','ENC-0112345678','ENC-Maria Herrera','ENC-09181111011','2024-04-15 10:00:00',NULL),
(NEWID(),@Emp12,'ENC-SSS-34-2345678-0','ENC-PH-01-345678902','ENC-HDMF-2345678902','ENC-TIN-112-345-678-000','ENC-PNB-Savings','ENC-0123456789','ENC-Ernesto Pascual','ENC-09181111012','2024-05-01 10:00:00',NULL),
(NEWID(),@Emp13,'ENC-SSS-34-3456789-1','ENC-PH-01-456789013','ENC-HDMF-3456789013','ENC-TIN-113-456-789-000','ENC-BPI-Checking','ENC-0134567890','ENC-Diana Soriano','ENC-09181111013','2024-05-15 10:00:00',NULL),
(NEWID(),@Emp14,'ENC-SSS-34-4567890-2','ENC-PH-01-567890124','ENC-HDMF-4567890124','ENC-TIN-114-567-890-000','ENC-EastWest-Savings','ENC-0145678901','ENC-Hector Mendoza','ENC-09181111014','2024-06-01 10:00:00',NULL),
(NEWID(),@Emp15,'ENC-SSS-34-5678901-3','ENC-PH-01-678901235','ENC-HDMF-5678901235','ENC-TIN-115-678-901-000','ENC-BDO-Savings','ENC-0156789012','ENC-Teresa Salvador','ENC-09181111015','2024-06-15 10:00:00',NULL),
(NEWID(),@Emp16,'ENC-SSS-34-6789012-4','ENC-PH-01-789012346','ENC-HDMF-6789012346','ENC-TIN-116-789-012-000','ENC-Metrobank-Savings','ENC-0167890123','ENC-Victor Domingo','ENC-09181111016','2024-07-01 10:00:00',NULL),
(NEWID(),@Emp17,'ENC-SSS-34-7890123-5','ENC-PH-01-890123457','ENC-HDMF-7890123457','ENC-TIN-117-890-123-000','ENC-UnionBank-Checking','ENC-0178901234','ENC-Concepcion Aguilar','ENC-09181111017','2024-07-15 10:00:00',NULL),
(NEWID(),@Emp18,'ENC-SSS-34-8901234-6','ENC-PH-01-901234568','ENC-HDMF-8901234568','ENC-TIN-118-901-234-000','ENC-RCBC-Savings','ENC-0189012345','ENC-Felipe Vergara','ENC-09181111018','2024-08-01 10:00:00',NULL),
(NEWID(),@Emp19,'ENC-SSS-34-9012345-7','ENC-PH-01-012345679','ENC-HDMF-9012345679','ENC-TIN-119-012-345-000','ENC-BPI-Savings','ENC-0190123456','ENC-Lourdes Magno','ENC-09181111019','2024-08-15 10:00:00',NULL),
(NEWID(),@Emp20,'ENC-SSS-34-0123456-8','ENC-PH-01-123456780','ENC-HDMF-0123456780','ENC-TIN-120-123-456-000','ENC-Chinabank-Checking','ENC-0201234567','ENC-Arturo Lagman','ENC-09181111020','2024-09-01 10:00:00',NULL);

-- ============================================================================
-- 9. EMPLOYEE ATTACHMENTS (20 rows)
-- ============================================================================
INSERT INTO [EmployeeAttachments] ([EmployeeAttachmentId],[EmployeeId],[FileName],[FilePath],[ContentType],[FileSize],[Version],[DocumentType],[IsArchived],[DocumentTitle],[IssueDate],[ExpiryDate],[Remarks],[UploadedAt])
VALUES
(NEWID(),@Emp01,'resume_cruz_r.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567801_resume_cruz_r.pdf','application/pdf',245000,1,'Resume',0,'Resume - Ricardo Cruz','2024-01-10',NULL,'Initial resume submission','2024-01-10 09:00:00'),
(NEWID(),@Emp02,'resume_reyes_m.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567802_resume_reyes_m.pdf','application/pdf',198000,1,'Resume',0,'Resume - Maria Reyes','2024-01-15',NULL,'Initial resume submission','2024-01-15 09:00:00'),
(NEWID(),@Emp03,'contract_bautista.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567803_contract_bautista.pdf','application/pdf',320000,1,'Contract',0,'Employment Contract - J. Bautista','2024-01-20','2025-01-20','One-year employment contract','2024-01-20 09:00:00'),
(NEWID(),@Emp04,'resume_villanueva.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567804_resume_villanueva.pdf','application/pdf',210000,1,'Resume',0,'Resume - Ana Villanueva','2024-02-01',NULL,'Initial resume submission','2024-02-01 09:00:00'),
(NEWID(),@Emp05,'contract_delacruz.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567805_contract_delacruz.pdf','application/pdf',315000,1,'Contract',0,'Employment Contract - C. Dela Cruz','2024-02-10','2025-02-10','One-year employment contract','2024-02-10 09:00:00'),
(NEWID(),@Emp06,'nbi_santos_p.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567806_nbi_santos_p.pdf','application/pdf',150000,1,'Government',0,'NBI Clearance - P. Santos','2024-03-01','2025-03-01','Valid NBI clearance','2024-03-01 09:00:00'),
(NEWID(),@Emp07,'resume_fernandez.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567807_resume_fernandez.pdf','application/pdf',185000,1,'Resume',0,'Resume - Miguel Fernandez','2024-03-15',NULL,'Initial resume submission','2024-03-15 09:00:00'),
(NEWID(),@Emp08,'cert_morales_c.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567808_cert_morales_c.pdf','application/pdf',120000,1,'Certificate',0,'Training Cert - C. Morales','2024-03-20',NULL,'Data encoding certification','2024-03-20 09:00:00'),
(NEWID(),@Emp09,'resume_tan_r.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567809_resume_tan_r.pdf','application/pdf',205000,1,'Resume',0,'Resume - Roberto Tan','2024-04-01',NULL,'Initial resume submission','2024-04-01 09:00:00'),
(NEWID(),@Emp10,'contract_gonzales.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567810_contract_gonzales.pdf','application/pdf',310000,1,'Contract',0,'Employment Contract - A. Gonzales','2024-04-10','2025-04-10','One-year employment contract','2024-04-10 09:00:00'),
(NEWID(),@Emp11,'resume_herrera_f.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567811_resume_herrera_f.pdf','application/pdf',195000,1,'Resume',0,'Resume - Fernando Herrera','2024-04-15',NULL,'Initial resume submission','2024-04-15 09:00:00'),
(NEWID(),@Emp12,'nbi_pascual_l.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567812_nbi_pascual_l.pdf','application/pdf',148000,1,'Government',0,'NBI Clearance - L. Pascual','2024-05-01','2025-05-01','Valid NBI clearance','2024-05-01 09:00:00'),
(NEWID(),@Emp13,'resume_soriano_a.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567813_resume_soriano_a.pdf','application/pdf',215000,1,'Resume',0,'Resume - Andres Soriano','2024-05-15',NULL,'Initial resume submission','2024-05-15 09:00:00'),
(NEWID(),@Emp14,'cert_mendoza_i.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567814_cert_mendoza_i.pdf','application/pdf',130000,1,'Certificate',0,'Training Cert - I. Mendoza','2024-06-01',NULL,'Advanced data encoding cert','2024-06-01 09:00:00'),
(NEWID(),@Emp15,'resume_salvador_m.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567815_resume_salvador_m.pdf','application/pdf',225000,1,'Resume',0,'Resume - Marco Salvador','2024-06-15',NULL,'Initial resume submission','2024-06-15 09:00:00'),
(NEWID(),@Emp16,'contract_domingo.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567816_contract_domingo.pdf','application/pdf',305000,1,'Contract',0,'Employment Contract - S. Domingo','2024-07-01','2025-07-01','One-year employment contract','2024-07-01 09:00:00'),
(NEWID(),@Emp17,'resume_aguilar_d.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567817_resume_aguilar_d.pdf','application/pdf',190000,1,'Resume',0,'Resume - Diego Aguilar','2024-07-15',NULL,'Initial resume submission','2024-07-15 09:00:00'),
(NEWID(),@Emp18,'nbi_vergara_c.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567818_nbi_vergara_c.pdf','application/pdf',152000,1,'Government',0,'NBI Clearance - C. Vergara','2024-08-01','2025-08-01','Valid NBI clearance','2024-08-01 09:00:00'),
(NEWID(),@Emp19,'resume_magno_r.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567819_resume_magno_r.pdf','application/pdf',200000,1,'Resume',0,'Resume - Rafael Magno','2024-08-15',NULL,'Initial resume submission','2024-08-15 09:00:00'),
(NEWID(),@Emp20,'resume_lagman_t.pdf','/uploads/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567820_resume_lagman_t.pdf','application/pdf',218000,1,'Resume',0,'Resume - Teresa Lagman','2024-09-01',NULL,'Initial resume submission','2024-09-01 09:00:00');

-- ============================================================================
-- 10. ASSET ALLOCATIONS (20 rows)
-- ============================================================================
INSERT INTO [AssetAllocations] ([AssetAllocationId],[EmployeeId],[AssetType],[AssetDescription],[Status],[AllocatedAt],[ReturnedAt],[ApprovedByRequestId])
VALUES
(NEWID(),@Emp01,'Laptop','Dell Latitude 5540 - i7 16GB RAM','Allocated','2024-01-10 10:00:00',NULL,NULL),
(NEWID(),@Emp02,'Laptop','Dell Latitude 5540 - i7 16GB RAM','Allocated','2024-01-15 10:00:00',NULL,NULL),
(NEWID(),@Emp03,'Laptop','HP ProBook 450 G10 - i5 8GB RAM','Allocated','2024-01-20 10:00:00',NULL,NULL),
(NEWID(),@Emp04,'Laptop','HP ProBook 450 G10 - i5 8GB RAM','Allocated','2024-02-01 10:00:00',NULL,NULL),
(NEWID(),@Emp05,'Laptop','Dell Latitude 5540 - i7 16GB RAM','Allocated','2024-02-10 10:00:00',NULL,NULL),
(NEWID(),@Emp06,'Desktop','Dell OptiPlex 7010 - i5 8GB RAM','Allocated','2024-03-01 10:00:00',NULL,NULL),
(NEWID(),@Emp07,'Desktop','Dell OptiPlex 7010 - i5 8GB RAM','Allocated','2024-03-15 10:00:00',NULL,NULL),
(NEWID(),@Emp08,'Desktop','HP ProDesk 400 G9 - i5 8GB RAM','Allocated','2024-03-20 10:00:00',NULL,NULL),
(NEWID(),@Emp09,'Desktop','Dell OptiPlex 7010 - i5 8GB RAM','Allocated','2024-04-01 10:00:00',NULL,NULL),
(NEWID(),@Emp10,'Desktop','HP ProDesk 400 G9 - i5 8GB RAM','Allocated','2024-04-10 10:00:00',NULL,NULL),
(NEWID(),@Emp11,'Desktop','Dell OptiPlex 7010 - i5 8GB RAM','Allocated','2024-04-15 10:00:00',NULL,NULL),
(NEWID(),@Emp12,'Desktop','HP ProDesk 400 G9 - i5 8GB RAM','Allocated','2024-05-01 10:00:00',NULL,NULL),
(NEWID(),@Emp13,'Desktop','Dell OptiPlex 7010 - i5 8GB RAM','Allocated','2024-05-15 10:00:00',NULL,NULL),
(NEWID(),@Emp14,'Desktop','HP ProDesk 400 G9 - i5 8GB RAM','Allocated','2024-06-01 10:00:00',NULL,NULL),
(NEWID(),@Emp15,'Laptop','Lenovo ThinkPad E14 - i5 16GB RAM','Allocated','2024-06-15 10:00:00',NULL,NULL),
(NEWID(),@Emp16,'Desktop','Dell OptiPlex 7010 - i5 8GB RAM','Allocated','2024-07-01 10:00:00',NULL,NULL),
(NEWID(),@Emp17,'Desktop','HP ProDesk 400 G9 - i5 8GB RAM','Allocated','2024-07-15 10:00:00',NULL,NULL),
(NEWID(),@Emp18,'Desktop','Dell OptiPlex 7010 - i5 8GB RAM','Allocated','2024-08-01 10:00:00',NULL,NULL),
(NEWID(),@Emp19,'Desktop','HP ProDesk 400 G9 - i5 8GB RAM','Allocated','2024-08-15 10:00:00',NULL,NULL),
(NEWID(),@Emp20,'Desktop','Dell OptiPlex 7010 - i5 8GB RAM','Allocated','2024-09-01 10:00:00',NULL,NULL);

-- ============================================================================
-- 11. LEAVE BALANCES (20 rows)
-- ============================================================================
INSERT INTO [LeaveBalances] ([LeaveBalanceId],[EmployeeId],[LeaveType],[TotalDays],[UsedDays],[RemainingDays],[UpdatedAt])
VALUES
(NEWID(),@Emp01,'Vacation Leave',15.0,3.0,12.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp02,'Vacation Leave',15.0,5.0,10.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp03,'Vacation Leave',15.0,2.0,13.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp04,'Vacation Leave',15.0,4.0,11.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp05,'Vacation Leave',15.0,1.0,14.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp06,'Vacation Leave',15.0,6.0,9.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp07,'Vacation Leave',15.0,3.5,11.5,'2025-06-01 00:00:00'),
(NEWID(),@Emp08,'Vacation Leave',15.0,7.0,8.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp09,'Vacation Leave',15.0,2.5,12.5,'2025-06-01 00:00:00'),
(NEWID(),@Emp10,'Vacation Leave',15.0,4.5,10.5,'2025-06-01 00:00:00'),
(NEWID(),@Emp11,'Vacation Leave',15.0,3.0,12.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp12,'Vacation Leave',15.0,5.5,9.5,'2025-06-01 00:00:00'),
(NEWID(),@Emp13,'Vacation Leave',15.0,2.0,13.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp14,'Vacation Leave',15.0,6.5,8.5,'2025-06-01 00:00:00'),
(NEWID(),@Emp15,'Vacation Leave',15.0,1.5,13.5,'2025-06-01 00:00:00'),
(NEWID(),@Emp16,'Vacation Leave',15.0,4.0,11.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp17,'Vacation Leave',15.0,3.0,12.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp18,'Vacation Leave',15.0,5.0,10.0,'2025-06-01 00:00:00'),
(NEWID(),@Emp19,'Vacation Leave',15.0,2.5,12.5,'2025-06-01 00:00:00'),
(NEWID(),@Emp20,'Vacation Leave',15.0,1.0,14.0,'2025-06-01 00:00:00');

-- ============================================================================
-- 12. TASK TEMPLATES (20 rows - created by OpAdmins)
-- ============================================================================
DECLARE @Tpl01 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000001';
DECLARE @Tpl02 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000002';
DECLARE @Tpl03 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000003';
DECLARE @Tpl04 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000004';
DECLARE @Tpl05 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000005';
DECLARE @Tpl06 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000006';
DECLARE @Tpl07 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000007';
DECLARE @Tpl08 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000008';
DECLARE @Tpl09 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000009';
DECLARE @Tpl10 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000010';
DECLARE @Tpl11 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000011';
DECLARE @Tpl12 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000012';
DECLARE @Tpl13 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000013';
DECLARE @Tpl14 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000014';
DECLARE @Tpl15 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000015';
DECLARE @Tpl16 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000016';
DECLARE @Tpl17 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000017';
DECLARE @Tpl18 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000018';
DECLARE @Tpl19 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000019';
DECLARE @Tpl20 UNIQUEIDENTIFIER = '77777777-7777-7777-7777-000000000020';

INSERT INTO [TaskTemplates] ([TemplateId],[TemplateName],[TemplateDescription],[PriorityLevel],[RecurrenceType],[RecurrenceStartDate],[AssignedEmployee],[TemplateStatus],[NextGenerationDate],[LastGeneratedDate],[CreatedBy],[CreatedAt],[UpdatedAt])
VALUES
(@Tpl01,'Daily Payroll Encoding','Encode daily payroll data for all departments','High','Daily','2025-01-06',@Acct07,'Active','2025-06-21','2025-06-20',@Acct02,'2025-01-02 08:00:00','2025-06-20 08:00:00'),
(@Tpl02,'Weekly Attendance Report','Compile and verify weekly attendance records','Medium','Weekly','2025-01-06',@Acct08,'Active','2025-06-23','2025-06-16',@Acct02,'2025-01-02 08:00:00','2025-06-16 08:00:00'),
(@Tpl03,'Monthly Inventory Audit','Conduct monthly inventory count and reconciliation','High','Monthly','2025-01-15',@Acct09,'Active','2025-07-15','2025-06-15',@Acct01,'2025-01-02 08:00:00','2025-06-15 08:00:00'),
(@Tpl04,'Employee Data Update','Update employee records with latest information','Low','Weekly','2025-01-13',@Acct10,'Active','2025-06-23','2025-06-16',@Acct04,'2025-01-03 08:00:00','2025-06-16 08:00:00'),
(@Tpl05,'Document Filing and Sorting','File and sort physical and digital documents','Low','Daily','2025-01-06',@Acct12,'Active','2025-06-21','2025-06-20',@Acct02,'2025-01-03 08:00:00','2025-06-20 08:00:00'),
(@Tpl06,'Leave Balance Reconciliation','Verify and reconcile leave balances across departments','Medium','Monthly','2025-01-31',@Acct06,'Active','2025-07-31','2025-06-30',@Acct03,'2025-01-05 08:00:00','2025-06-30 08:00:00'),
(@Tpl07,'Overtime Computation','Compute overtime hours and pay for eligible employees','High','Weekly','2025-01-06',@Acct13,'Active','2025-06-23','2025-06-16',@Acct02,'2025-01-05 08:00:00','2025-06-16 08:00:00'),
(@Tpl08,'Training Records Update','Update employee training completion records','Medium','Monthly','2025-01-31',@Acct14,'Active','2025-07-31','2025-06-30',@Acct04,'2025-01-06 08:00:00','2025-06-30 08:00:00'),
(@Tpl09,'Government Contributions Entry','Encode monthly SSS, PhilHealth, and Pag-IBIG contributions','High','Monthly','2025-01-31',@Acct16,'Active','2025-07-31','2025-06-30',@Acct05,'2025-01-06 08:00:00','2025-06-30 08:00:00'),
(@Tpl10,'Asset Tracking Report','Generate and review asset allocation status report','Low','Monthly','2025-01-31',@Acct17,'Active','2025-07-31','2025-06-30',@Acct01,'2025-01-07 08:00:00','2025-06-30 08:00:00'),
(@Tpl11,'New Hire Onboarding Checklist','Process onboarding tasks for newly hired employees','High','Weekly','2025-01-06',@Acct11,'Active','2025-06-23','2025-06-16',@Acct03,'2025-01-07 08:00:00','2025-06-16 08:00:00'),
(@Tpl12,'Performance Review Encoding','Encode quarterly performance review scores','Medium','Monthly','2025-03-31',@Acct18,'Active','2025-09-30','2025-06-30',@Acct04,'2025-01-08 08:00:00','2025-06-30 08:00:00'),
(@Tpl13,'Daily Task Summary Report','Compile daily task completion summary for management','Medium','Daily','2025-01-06',@Acct19,'Active','2025-06-21','2025-06-20',@Acct02,'2025-01-08 08:00:00','2025-06-20 08:00:00'),
(@Tpl14,'Biweekly Payroll Validation','Validate and cross-check biweekly payroll entries','High','Weekly','2025-01-13',@Acct20,'Active','2025-06-23','2025-06-16',@Acct05,'2025-01-09 08:00:00','2025-06-16 08:00:00'),
(@Tpl15,'Compliance Document Review','Review and update compliance-related documentation','Medium','Monthly','2025-02-28',@Acct06,'Inactive',NULL,'2025-05-28',@Acct01,'2025-01-09 08:00:00','2025-05-28 08:00:00'),
(@Tpl16,'System Backup Verification','Verify daily system backups are completed successfully','High','Daily','2025-01-06',@Acct15,'Active','2025-06-21','2025-06-20',@Acct01,'2025-01-10 08:00:00','2025-06-20 08:00:00'),
(@Tpl17,'Recruitment Pipeline Update','Update applicant tracking and recruitment pipeline status','Medium','Weekly','2025-01-06',@Acct04,'Active','2025-06-23','2025-06-16',@Acct03,'2025-01-10 08:00:00','2025-06-16 08:00:00'),
(@Tpl18,'Department Headcount Report','Generate department-wise headcount summary','Low','Monthly','2025-01-31',@Acct11,'Active','2025-07-31','2025-06-30',@Acct03,'2025-01-11 08:00:00','2025-06-30 08:00:00'),
(@Tpl19,'Incident Report Encoding','Encode workplace incident reports into the system','High','Daily','2025-01-06',@Acct07,'Active','2025-06-21','2025-06-20',@Acct02,'2025-01-11 08:00:00','2025-06-20 08:00:00'),
(@Tpl20,'Monthly Benefits Processing','Process monthly employee benefits and allowances','High','Monthly','2025-01-31',@Acct09,'Active','2025-07-31','2025-06-30',@Acct05,'2025-01-12 08:00:00','2025-06-30 08:00:00');

-- ============================================================================
-- 13. TASKS (20 rows)
-- ============================================================================
DECLARE @Task01 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000001';
DECLARE @Task02 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000002';
DECLARE @Task03 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000003';
DECLARE @Task04 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000004';
DECLARE @Task05 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000005';
DECLARE @Task06 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000006';
DECLARE @Task07 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000007';
DECLARE @Task08 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000008';
DECLARE @Task09 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000009';
DECLARE @Task10 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000010';
DECLARE @Task11 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000011';
DECLARE @Task12 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000012';
DECLARE @Task13 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000013';
DECLARE @Task14 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000014';
DECLARE @Task15 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000015';
DECLARE @Task16 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000016';
DECLARE @Task17 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000017';
DECLARE @Task18 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000018';
DECLARE @Task19 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000019';
DECLARE @Task20 UNIQUEIDENTIFIER = '88888888-8888-8888-8888-000000000020';

INSERT INTO [Tasks] ([TaskId],[CreatedBy],[AssignedTo],[EvaluatedBy],[TaskTitle],[TaskDescription],[TaskReferenceNumber],[TaskCategory],[Priority],[DueAt],[Deleted],[PermanentlyDeleted],[TaskRemarks],[TaskStatus],[ProgressNotes],[ProgressEvidenceUrl],[SupportingEvidenceUrl],[TaskTemplateId],[CreatedAt],[UpdatedAt])
VALUES
(@Task01,@Acct02,@Acct07,@Acct02,'Encode June Week 3 Payroll','Encode all payroll entries for June week 3 across all departments','TSK-0001','Payroll','High','2025-06-20 17:00:00',0,0,NULL,'Completed','All entries encoded and verified',NULL,NULL,@Tpl01,'2025-06-16 08:00:00','2025-06-20 15:00:00'),
(@Task02,@Acct02,@Acct08,@Acct02,'Compile Week 25 Attendance','Compile attendance records for week 25 from biometric logs','TSK-0002','Attendance','Medium','2025-06-23 17:00:00',0,0,NULL,'SubmittedForReview','Attendance data compiled, awaiting review',NULL,NULL,@Tpl02,'2025-06-16 08:30:00','2025-06-20 14:00:00'),
(@Task03,@Acct01,@Acct09,NULL,'June Inventory Count - Warehouse A','Physical count of all items in Warehouse A and reconcile with system','TSK-0003','Inventory','High','2025-06-25 17:00:00',0,0,NULL,'InProgress','Counting section B, 60% complete',NULL,NULL,@Tpl03,'2025-06-15 09:00:00','2025-06-19 16:00:00'),
(@Task04,@Acct04,@Acct10,NULL,'Update Employee Contact Records','Verify and update contact information for all active employees','TSK-0004','HR Records','Low','2025-06-27 17:00:00',0,0,NULL,'InProgress','Updated 12 of 20 employee records',NULL,NULL,@Tpl04,'2025-06-16 09:00:00','2025-06-18 11:00:00'),
(@Task05,@Acct02,@Acct12,@Acct02,'File Q2 Employment Contracts','Sort and file all Q2 employment contracts physically and digitally','TSK-0005','Filing','Low','2025-06-20 17:00:00',0,0,NULL,'Completed','All contracts filed and indexed',NULL,NULL,@Tpl05,'2025-06-16 09:30:00','2025-06-20 10:00:00'),
(@Task06,@Acct03,@Acct06,NULL,'Reconcile June Leave Balances','Cross-check leave balances with submitted leave requests for June','TSK-0006','Leave Mgmt','Medium','2025-06-30 17:00:00',0,0,NULL,'InProgress','OPS department reconciled, working on HR',NULL,NULL,@Tpl06,'2025-06-17 08:00:00','2025-06-19 14:00:00'),
(@Task07,@Acct02,@Acct13,@Acct02,'Compute Week 25 Overtime','Calculate overtime hours and rates for week 25 eligible employees','TSK-0007','Payroll','High','2025-06-23 12:00:00',0,0,NULL,'SubmittedForReview','OT computation done, pending verification',NULL,NULL,@Tpl07,'2025-06-16 10:00:00','2025-06-20 16:00:00'),
(@Task08,@Acct04,@Acct14,NULL,'Encode Q2 Training Completions','Update training records for all Q2 completed training programs','TSK-0008','Training','Medium','2025-06-30 17:00:00',0,0,NULL,'Draft',NULL,NULL,NULL,@Tpl08,'2025-06-18 08:00:00',NULL),
(@Task09,@Acct05,@Acct16,NULL,'Encode June Gov Contributions','Encode SSS, PhilHealth, and Pag-IBIG contributions for June payroll','TSK-0009','Government','High','2025-06-28 17:00:00',0,0,NULL,'InProgress','SSS done, encoding PhilHealth',NULL,NULL,@Tpl09,'2025-06-17 09:00:00','2025-06-19 10:00:00'),
(@Task10,@Acct01,@Acct17,NULL,'Generate June Asset Report','Compile asset allocation status report for all company assets','TSK-0010','Assets','Low','2025-06-30 17:00:00',0,0,NULL,'Draft',NULL,NULL,NULL,@Tpl10,'2025-06-18 09:00:00',NULL),
(@Task11,@Acct03,@Acct11,@Acct03,'Process New Hire Onboarding Batch','Complete onboarding checklist for 3 new hires starting July 1','TSK-0011','Onboarding','High','2025-06-25 17:00:00',0,0,NULL,'Completed','All onboarding tasks completed',NULL,NULL,@Tpl11,'2025-06-16 10:30:00','2025-06-24 16:00:00'),
(@Task12,@Acct04,@Acct18,NULL,'Encode Q2 Performance Scores','Input quarterly performance review scores for Operations department','TSK-0012','Performance','Medium','2025-07-05 17:00:00',0,0,NULL,'InProgress','Encoded 8 of 15 performance reviews',NULL,NULL,@Tpl12,'2025-06-19 08:00:00','2025-06-20 11:00:00'),
(@Task13,@Acct02,@Acct19,@Acct02,'Daily Task Summary - June 19','Compile task completion summary for all encoders on June 19','TSK-0013','Reporting','Medium','2025-06-19 18:00:00',0,0,NULL,'Completed','Summary compiled and sent to management',NULL,NULL,@Tpl13,'2025-06-19 08:00:00','2025-06-19 17:30:00'),
(@Task14,@Acct05,@Acct20,NULL,'Validate Biweekly Payroll Batch 12','Cross-validate payroll entries for biweekly batch 12','TSK-0014','Payroll','High','2025-06-22 17:00:00',0,0,NULL,'InProgress','Validating department-level totals',NULL,NULL,@Tpl14,'2025-06-16 11:00:00','2025-06-20 09:00:00'),
(@Task15,@Acct01,@Acct06,NULL,'Review Compliance Docs - June','Review and update all compliance documentation for June','TSK-0015','Compliance','Medium','2025-06-28 17:00:00',0,0,NULL,'InProgress','Reviewed 5 of 10 compliance documents',NULL,NULL,@Tpl15,'2025-06-17 10:00:00','2025-06-19 15:00:00'),
(@Task16,@Acct01,@Acct15,@Acct01,'Verify System Backups - June 20','Confirm all daily backups completed successfully for June 20','TSK-0016','IT','High','2025-06-20 12:00:00',0,0,NULL,'Completed','All backups verified successfully',NULL,NULL,@Tpl16,'2025-06-20 07:00:00','2025-06-20 11:30:00'),
(@Task17,@Acct03,@Acct04,NULL,'Update Recruitment Pipeline W25','Update applicant statuses and pipeline for week 25','TSK-0017','Recruitment','Medium','2025-06-23 17:00:00',0,0,NULL,'InProgress','Updated 6 applicant statuses',NULL,NULL,@Tpl17,'2025-06-16 11:30:00','2025-06-19 13:00:00'),
(@Task18,@Acct03,@Acct11,NULL,'Generate June Headcount Report','Prepare department-wise headcount summary for June','TSK-0018','Reporting','Low','2025-06-30 17:00:00',0,0,NULL,'Draft',NULL,NULL,NULL,@Tpl18,'2025-06-19 09:00:00',NULL),
(@Task19,@Acct02,@Acct07,NULL,'Encode Incident Report IR-2025-012','Encode workplace incident report for IR-2025-012 into the system','TSK-0019','Incident','High','2025-06-21 12:00:00',0,0,NULL,'InProgress','Incident details partially encoded',NULL,NULL,@Tpl19,'2025-06-19 14:00:00','2025-06-20 08:00:00'),
(@Task20,@Acct05,@Acct09,NULL,'Process June Benefits and Allowances','Encode monthly benefits, allowances, and deductions for June','TSK-0020','Benefits','High','2025-06-28 17:00:00',0,0,NULL,'InProgress','Basic pay encoded, working on allowances',NULL,NULL,@Tpl20,'2025-06-17 11:00:00','2025-06-20 10:00:00');

-- ============================================================================
-- 14. TASK COMMENTS (20 rows)
-- ============================================================================
INSERT INTO [TaskComments] ([TaskCommentId],[EmployeeId],[TaskId],[Message],[AttachmentUrl],[CreatedAt],[UpdatedAt])
VALUES
(NEWID(),@Emp07,@Task01,'Started encoding payroll for OPS department.',NULL,'2025-06-16 09:00:00',NULL),
(NEWID(),@Emp07,@Task01,'OPS department payroll encoding complete. Moving to HR.',NULL,'2025-06-17 14:00:00',NULL),
(NEWID(),@Emp07,@Task01,'All departments encoded. Ready for review.',NULL,'2025-06-19 16:00:00',NULL),
(NEWID(),@Emp02,@Task01,'Reviewed and approved. All entries look correct.',NULL,'2025-06-20 15:00:00',NULL),
(NEWID(),@Emp08,@Task02,'Biometric data pulled successfully. Starting compilation.',NULL,'2025-06-16 10:00:00',NULL),
(NEWID(),@Emp08,@Task02,'Attendance compiled. Found 3 discrepancies flagged for review.',NULL,'2025-06-20 14:00:00',NULL),
(NEWID(),@Emp09,@Task03,'Started physical count in Warehouse A, Section A.',NULL,'2025-06-15 10:00:00',NULL),
(NEWID(),@Emp09,@Task03,'Section A done. Moving to Section B now.',NULL,'2025-06-17 15:00:00',NULL),
(NEWID(),@Emp10,@Task04,'Verified contact info for first 12 employees.',NULL,'2025-06-17 11:00:00',NULL),
(NEWID(),@Emp12,@Task05,'Physical filing complete. Starting digital scan.',NULL,'2025-06-18 14:00:00',NULL),
(NEWID(),@Emp12,@Task05,'All contracts filed both physically and digitally.',NULL,'2025-06-20 10:00:00',NULL),
(NEWID(),@Emp06,@Task06,'OPS department leave balances reconciled. No issues found.',NULL,'2025-06-18 16:00:00',NULL),
(NEWID(),@Emp13,@Task07,'OT computation complete for 15 eligible employees.',NULL,'2025-06-20 16:00:00',NULL),
(NEWID(),@Emp16,@Task09,'SSS contributions encoded for all 20 employees.',NULL,'2025-06-18 15:00:00',NULL),
(NEWID(),@Emp16,@Task09,'Starting PhilHealth encoding now.',NULL,'2025-06-19 10:00:00',NULL),
(NEWID(),@Emp11,@Task11,'Onboarding docs prepared for 3 new hires.',NULL,'2025-06-17 09:00:00',NULL),
(NEWID(),@Emp11,@Task11,'All onboarding tasks done. Accounts provisioned.',NULL,'2025-06-24 16:00:00',NULL),
(NEWID(),@Emp18,@Task12,'Encoded 8 performance reviews for OPS department.',NULL,'2025-06-20 11:00:00',NULL),
(NEWID(),@Emp15,@Task16,'All backup logs verified. No failures detected.',NULL,'2025-06-20 11:30:00',NULL),
(NEWID(),@Emp07,@Task19,'Started encoding incident details from the filed report.',NULL,'2025-06-20 08:00:00',NULL);

-- ============================================================================
-- 15. TASK STATUS RECORDS (20 rows)
-- ============================================================================
INSERT INTO [TaskStatusRecords] ([RecordId],[TaskId],[CurrentStatus],[RequestedStatus],[ChangeDate],[UpdatedBy],[IsSuccessful],[FailureReason])
VALUES
(NEWID(),@Task01,'Draft','InProgress','2025-06-16 08:30:00',@Acct07,1,NULL),
(NEWID(),@Task01,'InProgress','SubmittedForReview','2025-06-19 16:30:00',@Acct07,1,NULL),
(NEWID(),@Task01,'SubmittedForReview','Completed','2025-06-20 15:00:00',@Acct02,1,NULL),
(NEWID(),@Task02,'Draft','InProgress','2025-06-16 09:00:00',@Acct08,1,NULL),
(NEWID(),@Task02,'InProgress','SubmittedForReview','2025-06-20 14:00:00',@Acct08,1,NULL),
(NEWID(),@Task03,'Draft','InProgress','2025-06-15 10:00:00',@Acct09,1,NULL),
(NEWID(),@Task04,'Draft','InProgress','2025-06-16 10:00:00',@Acct10,1,NULL),
(NEWID(),@Task05,'Draft','InProgress','2025-06-16 10:00:00',@Acct12,1,NULL),
(NEWID(),@Task05,'InProgress','SubmittedForReview','2025-06-19 17:00:00',@Acct12,1,NULL),
(NEWID(),@Task05,'SubmittedForReview','Completed','2025-06-20 10:00:00',@Acct02,1,NULL),
(NEWID(),@Task06,'Draft','InProgress','2025-06-17 09:00:00',@Acct06,1,NULL),
(NEWID(),@Task07,'Draft','InProgress','2025-06-16 11:00:00',@Acct13,1,NULL),
(NEWID(),@Task07,'InProgress','SubmittedForReview','2025-06-20 16:00:00',@Acct13,1,NULL),
(NEWID(),@Task09,'Draft','InProgress','2025-06-17 10:00:00',@Acct16,1,NULL),
(NEWID(),@Task11,'Draft','InProgress','2025-06-16 11:00:00',@Acct11,1,NULL),
(NEWID(),@Task11,'InProgress','SubmittedForReview','2025-06-24 15:00:00',@Acct11,1,NULL),
(NEWID(),@Task11,'SubmittedForReview','Completed','2025-06-24 16:00:00',@Acct03,1,NULL),
(NEWID(),@Task12,'Draft','InProgress','2025-06-19 09:00:00',@Acct18,1,NULL),
(NEWID(),@Task13,'Draft','InProgress','2025-06-19 08:30:00',@Acct19,1,NULL),
(NEWID(),@Task13,'InProgress','SubmittedForReview','2025-06-19 17:00:00',@Acct19,1,NULL);

-- ============================================================================
-- 16. TASK REOPEN REQUESTS (20 rows)
-- ============================================================================
INSERT INTO [TaskReopenRequests] ([RequestId],[TaskId],[RequestedById],[ReferenceNumber],[Reason],[EvidenceUrl],[Status],[AdminRemarks],[CreatedAt])
VALUES
(NEWID(),@Task01,@Acct07,'ROR-0001','Found discrepancy in payroll entry for EMP-012, need to correct amount',NULL,'Approved','Approved for correction. Please update and resubmit.','2025-06-20 16:00:00'),
(NEWID(),@Task01,@Acct07,'ROR-0002','Additional overtime entry was missed for EMP-008',NULL,'Pending',NULL,'2025-06-20 17:00:00'),
(NEWID(),@Task05,@Acct12,'ROR-0003','One contract was misfiled under wrong employee folder',NULL,'Approved','Please refile and update the index.','2025-06-20 11:00:00'),
(NEWID(),@Task05,@Acct12,'ROR-0004','Digital scan of contract for EMP-015 was blurry',NULL,'Rejected','Scan quality is acceptable. No reopen needed.','2025-06-20 14:00:00'),
(NEWID(),@Task11,@Acct11,'ROR-0005','New hire submitted additional documents after onboarding',NULL,'Approved','Please add the documents to their 201 file.','2025-06-25 08:00:00'),
(NEWID(),@Task13,@Acct19,'ROR-0006','Task summary missed 2 late submissions from night shift',NULL,'Approved','Update the summary and resubmit.','2025-06-20 08:00:00'),
(NEWID(),@Task16,@Acct15,'ROR-0007','Backup log for server B showed warning needing investigation',NULL,'Pending',NULL,'2025-06-20 12:00:00'),
(NEWID(),@Task03,@Acct09,'ROR-0008','Inventory count discrepancy found in Section C, need recount',NULL,'Approved','Recount Section C and update the report.','2025-06-20 09:00:00'),
(NEWID(),@Task07,@Acct13,'ROR-0009','OT rate for EMP-006 was computed using wrong multiplier',NULL,'Pending',NULL,'2025-06-20 17:00:00'),
(NEWID(),@Task02,@Acct08,'ROR-0010','Attendance discrepancy for EMP-019 needs manual verification',NULL,'Approved','Verify with the employee and update.','2025-06-20 15:00:00'),
(NEWID(),@Task01,@Acct02,'ROR-0011','Management requested additional payroll summary breakdown',NULL,'Rejected','This should be a separate task, not a reopen.','2025-06-21 08:00:00'),
(NEWID(),@Task04,@Acct10,'ROR-0012','Employee EMP-003 provided updated contact number',NULL,'Pending',NULL,'2025-06-19 10:00:00'),
(NEWID(),@Task06,@Acct06,'ROR-0013','Leave balance for EMP-014 does not match approved records',NULL,'Approved','Cross-check with approved leave requests.','2025-06-19 16:00:00'),
(NEWID(),@Task09,@Acct16,'ROR-0014','PhilHealth contribution table was updated mid-month',NULL,'Pending',NULL,'2025-06-20 11:00:00'),
(NEWID(),@Task12,@Acct18,'ROR-0015','Performance score for EMP-011 was entered incorrectly',NULL,'Approved','Correct the score and re-encode.','2025-06-20 14:00:00'),
(NEWID(),@Task14,@Acct20,'ROR-0016','Payroll batch 12 has a duplicate entry for EMP-005',NULL,'Pending',NULL,'2025-06-20 10:00:00'),
(NEWID(),@Task17,@Acct04,'ROR-0017','Applicant status updated after pipeline was generated',NULL,'Rejected','Pipeline reflects state at time of generation.','2025-06-20 09:00:00'),
(NEWID(),@Task19,@Acct07,'ROR-0018','Additional witness statement received for incident report',NULL,'Approved','Add the witness statement to the record.','2025-06-20 14:00:00'),
(NEWID(),@Task20,@Acct09,'ROR-0019','Allowance rate for night shift was updated retroactively',NULL,'Pending',NULL,'2025-06-20 11:00:00'),
(NEWID(),@Task15,@Acct06,'ROR-0020','Compliance document template was revised, need new format',NULL,'Approved','Use the revised template from the shared drive.','2025-06-20 08:00:00');

-- ============================================================================
-- 17. ADMIN OVERRIDE RECORDS (20 rows)
-- ============================================================================
INSERT INTO [AdminOverrideRecords] ([OverrideId],[TaskId],[AdminId],[OverrideReason],[AdminRemarks],[ApprovalConfirmation],[CreatedAt])
VALUES
(NEWID(),@Task01,@Acct02,'Encoder requested reopen after task was marked completed','Approved reopen for payroll correction. Must resubmit by EOD.',1,'2025-06-20 16:30:00'),
(NEWID(),@Task01,@Acct02,'Second reopen request for missed OT entry','Approved. This is the final reopen allowed for this task.',1,'2025-06-20 17:30:00'),
(NEWID(),@Task05,@Acct02,'Misfiled contract needs correction','Approved. Filing correction authorized.',1,'2025-06-20 11:30:00'),
(NEWID(),@Task11,@Acct03,'Additional onboarding documents submitted post-completion','Approved. Update 201 file with new documents.',1,'2025-06-25 08:30:00'),
(NEWID(),@Task13,@Acct02,'Missed night shift submissions in daily summary','Approved. Summary must include all shifts.',1,'2025-06-20 08:30:00'),
(NEWID(),@Task03,@Acct01,'Inventory count discrepancy requires recount','Approved. Recount Section C before final submission.',1,'2025-06-20 09:30:00'),
(NEWID(),@Task02,@Acct02,'Attendance discrepancy needs manual resolution','Approved. Verify directly with the employee concerned.',1,'2025-06-20 15:30:00'),
(NEWID(),@Task06,@Acct03,'Leave balance mismatch identified during reconciliation','Approved. Cross-reference with approved leave records.',1,'2025-06-19 16:30:00'),
(NEWID(),@Task12,@Acct04,'Incorrect performance score entry','Approved. Correct using the official evaluation form.',1,'2025-06-20 14:30:00'),
(NEWID(),@Task19,@Acct02,'Additional witness statement for incident report','Approved. Attach the statement and update the report.',1,'2025-06-20 14:30:00'),
(NEWID(),@Task15,@Acct01,'Compliance template revision requires re-encoding','Approved. Use the latest template version.',1,'2025-06-20 08:30:00'),
(NEWID(),@Task07,@Acct02,'OT computation used incorrect rate multiplier','Pending review of rate table before approving.',0,'2025-06-20 17:30:00'),
(NEWID(),@Task09,@Acct05,'PhilHealth contribution table mid-month update','Under review. Checking with PhilHealth for official rates.',0,'2025-06-20 11:30:00'),
(NEWID(),@Task14,@Acct05,'Duplicate payroll entry detected','Pending verification of the duplicate entry.',0,'2025-06-20 10:30:00'),
(NEWID(),@Task04,@Acct04,'Employee contact update after verification','Minor update. Approved for quick correction.',1,'2025-06-19 10:30:00'),
(NEWID(),@Task16,@Acct01,'Server B backup warning needs investigation','Approved. IT team should investigate and document.',1,'2025-06-20 12:30:00'),
(NEWID(),@Task20,@Acct05,'Retroactive night shift allowance rate change','Pending HR confirmation of the rate adjustment.',0,'2025-06-20 11:30:00'),
(NEWID(),@Task05,@Acct02,'Blurry digital scan reported for EMP-015 contract','Rejected. Scan quality meets minimum standards.',0,'2025-06-20 14:30:00'),
(NEWID(),@Task01,@Acct02,'Management requested department breakdown addition','Rejected. This requires a new task, not a reopen.',0,'2025-06-21 08:30:00'),
(NEWID(),@Task17,@Acct03,'Applicant status changed after pipeline generation','Rejected. Pipeline reflects accurate state at generation time.',0,'2025-06-20 09:30:00');

-- ============================================================================
-- 18. LEAVE REQUESTS (20 rows)
-- ============================================================================
DECLARE @Leave01 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000001';
DECLARE @Leave02 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000002';
DECLARE @Leave03 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000003';
DECLARE @Leave04 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000004';
DECLARE @Leave05 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000005';
DECLARE @Leave06 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000006';
DECLARE @Leave07 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000007';
DECLARE @Leave08 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000008';
DECLARE @Leave09 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000009';
DECLARE @Leave10 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000010';
DECLARE @Leave11 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000011';
DECLARE @Leave12 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000012';
DECLARE @Leave13 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000013';
DECLARE @Leave14 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000014';
DECLARE @Leave15 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000015';
DECLARE @Leave16 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000016';
DECLARE @Leave17 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000017';
DECLARE @Leave18 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000018';
DECLARE @Leave19 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000019';
DECLARE @Leave20 UNIQUEIDENTIFIER = '99999999-9999-9999-9999-000000000020';

INSERT INTO [LeaveRequests] ([LeaveId],[AccountId],[Approved_By],[Deleted],[Leave_Type],[LeaveRequestNote],[Start_Date],[End_Date],[Reason],[Approval_Status],[SubmittedAt],[UpdatedAt])
VALUES
(@Leave01,@Acct07,@Acct02,0,'Vacation Leave','Family vacation to Boracay','2025-07-01','2025-07-03','Annual family vacation planned since March','Approved','2025-06-10 09:00:00','2025-06-12 10:00:00'),
(@Leave02,@Acct08,@Acct02,0,'Sick Leave','Flu and fever, doctor advised rest','2025-06-12','2025-06-13','Diagnosed with viral flu, medical certificate attached','Approved','2025-06-11 22:00:00','2025-06-12 08:00:00'),
(@Leave03,@Acct09,NULL,0,'Vacation Leave','Attending sibling wedding in Cebu','2025-07-10','2025-07-11','Sibling wedding in Cebu City','Pending','2025-06-18 10:00:00','2025-06-18 10:00:00'),
(@Leave04,@Acct10,@Acct02,0,'Emergency Leave','Family emergency - hospitalized parent','2025-06-05','2025-06-06','Mother admitted to hospital for observation','Approved','2025-06-05 06:00:00','2025-06-05 08:00:00'),
(@Leave05,@Acct12,@Acct02,0,'Vacation Leave','Personal errands and rest day','2025-06-27','2025-06-27','Need to process government documents','Approved','2025-06-20 14:00:00','2025-06-20 16:00:00'),
(@Leave06,@Acct13,NULL,0,'Sick Leave','Dental surgery scheduled','2025-07-05','2025-07-07','Wisdom tooth extraction surgery','Pending','2025-06-19 11:00:00','2025-06-19 11:00:00'),
(@Leave07,@Acct06,@Acct03,0,'Vacation Leave','Short trip to Baguio with family','2025-06-14','2025-06-15','Weekend family trip to Baguio','Approved','2025-06-07 09:00:00','2025-06-08 10:00:00'),
(@Leave08,@Acct11,@Acct03,0,'Bereavement Leave','Death in the family - grandfather','2025-06-08','2025-06-10','Grandfather passed away, attending funeral','Approved','2025-06-08 07:00:00','2025-06-08 08:00:00'),
(@Leave09,@Acct14,NULL,0,'Vacation Leave','Moving to new apartment','2025-07-15','2025-07-16','Relocating to a new residence near office','Pending','2025-06-20 08:00:00','2025-06-20 08:00:00'),
(@Leave10,@Acct16,@Acct02,0,'Sick Leave','Severe migraine, unable to work','2025-06-18','2025-06-18','Migraine episode, need one day rest','Approved','2025-06-18 07:00:00','2025-06-18 08:30:00'),
(@Leave11,@Acct17,NULL,0,'Vacation Leave','Attending professional conference','2025-07-20','2025-07-22','Data management conference in Clark','Pending','2025-06-15 10:00:00','2025-06-15 10:00:00'),
(@Leave12,@Acct18,@Acct02,0,'Vacation Leave','Child school enrollment','2025-06-25','2025-06-25','Enrolling child in new school for upcoming year','Approved','2025-06-18 09:00:00','2025-06-19 10:00:00'),
(@Leave13,@Acct19,@Acct02,0,'Emergency Leave','House flooding due to heavy rain','2025-06-15','2025-06-16','Severe flooding in area, need to secure belongings','Approved','2025-06-15 05:00:00','2025-06-15 07:00:00'),
(@Leave14,@Acct20,NULL,0,'Sick Leave','Back pain, physiotherapy appointment','2025-07-01','2025-07-02','Chronic back pain requiring physiotherapy sessions','Pending','2025-06-20 15:00:00','2025-06-20 15:00:00'),
(@Leave15,@Acct01,@Acct02,0,'Vacation Leave','Annual vacation leave','2025-07-28','2025-08-01','Planned annual vacation with family to Palawan','Approved','2025-06-01 08:00:00','2025-06-02 09:00:00'),
(@Leave16,@Acct02,NULL,0,'Vacation Leave','Personal day for house renovation','2025-07-05','2025-07-05','Supervising house renovation work','Pending','2025-06-20 10:00:00','2025-06-20 10:00:00'),
(@Leave17,@Acct03,@Acct01,0,'Sick Leave','Annual medical checkup','2025-06-22','2025-06-22','Scheduled annual physical examination','Approved','2025-06-15 08:00:00','2025-06-16 09:00:00'),
(@Leave18,@Acct04,@Acct03,0,'Vacation Leave','Daughter graduation ceremony','2025-06-28','2025-06-28','Attending daughter college graduation','Approved','2025-06-10 10:00:00','2025-06-11 08:00:00'),
(@Leave19,@Acct05,NULL,0,'Vacation Leave','Relaxation and personal time','2025-07-10','2025-07-11','Taking time off for personal wellness','Pending','2025-06-20 09:00:00','2025-06-20 09:00:00'),
(@Leave20,@Acct15,@Acct01,0,'Sick Leave','Food poisoning','2025-06-19','2025-06-20','Severe food poisoning, doctor prescribed rest','Approved','2025-06-19 06:00:00','2025-06-19 08:00:00');

-- ============================================================================
-- 19. EMERGENCY OVERRIDE REQUESTS (20 rows)
-- ============================================================================
INSERT INTO [EmergencyOverrideRequests] ([EmergencyOverrideId],[RequestedById],[LeaveId],[ApprovedById],[Status],[Deleted],[Reason],[RequestedAt],[ApprovedAt],[OverrideUntil],[UpdatedAt])
VALUES
(NEWID(),@Acct07,@Leave01,@Acct02,'Approved',0,'Critical payroll encoding deadline on July 1, need to work through leave','2025-06-28 08:00:00','2025-06-28 10:00:00','2025-07-01 17:00:00',NULL),
(NEWID(),@Acct08,@Leave02,@Acct02,'Approved',0,'Urgent attendance compilation needed before deadline','2025-06-12 10:00:00','2025-06-12 11:00:00','2025-06-12 17:00:00',NULL),
(NEWID(),@Acct10,@Leave04,@Acct02,'Approved',0,'Employee data update deadline cannot be missed','2025-06-05 10:00:00','2025-06-05 12:00:00','2025-06-05 17:00:00',NULL),
(NEWID(),@Acct12,@Leave05,@Acct02,'Pending',0,'Document filing deadline approaching for Q2 contracts','2025-06-25 09:00:00',NULL,'2025-06-27 17:00:00',NULL),
(NEWID(),@Acct06,@Leave07,@Acct03,'Approved',0,'Leave balance reconciliation must be completed before month end','2025-06-13 14:00:00','2025-06-13 16:00:00','2025-06-14 17:00:00',NULL),
(NEWID(),@Acct11,@Leave08,@Acct03,'Approved',0,'Onboarding batch for new hires cannot be delayed','2025-06-08 10:00:00','2025-06-08 12:00:00','2025-06-09 17:00:00',NULL),
(NEWID(),@Acct16,@Leave10,@Acct02,'Approved',0,'Government contributions encoding deadline','2025-06-18 09:00:00','2025-06-18 10:00:00','2025-06-18 17:00:00',NULL),
(NEWID(),@Acct18,@Leave12,@Acct02,'Approved',0,'Performance review encoding deadline for Q2','2025-06-24 08:00:00','2025-06-24 10:00:00','2025-06-25 17:00:00',NULL),
(NEWID(),@Acct19,@Leave13,@Acct02,'Approved',0,'Daily task summary must be submitted on time','2025-06-15 10:00:00','2025-06-15 11:00:00','2025-06-15 18:00:00',NULL),
(NEWID(),@Acct15,@Leave20,@Acct01,'Approved',0,'System backup verification is critical for compliance','2025-06-19 08:00:00','2025-06-19 09:00:00','2025-06-19 17:00:00',NULL),
(NEWID(),@Acct01,@Leave15,@Acct02,'Pending',0,'Monthly inventory audit requires manager oversight','2025-07-25 09:00:00',NULL,'2025-07-28 17:00:00',NULL),
(NEWID(),@Acct09,@Leave03,NULL,'Pending',0,'Warehouse inventory count needs additional hands','2025-07-08 08:00:00',NULL,'2025-07-10 17:00:00',NULL),
(NEWID(),@Acct13,@Leave06,NULL,'Pending',0,'OT computation deadline cannot be extended','2025-07-03 09:00:00',NULL,'2025-07-05 17:00:00',NULL),
(NEWID(),@Acct14,@Leave09,NULL,'Pending',0,'Training records update for Q2 needs completion','2025-07-13 08:00:00',NULL,'2025-07-15 17:00:00',NULL),
(NEWID(),@Acct17,@Leave11,NULL,'Pending',0,'Asset tracking report generation needs encoder','2025-07-18 09:00:00',NULL,'2025-07-20 17:00:00',NULL),
(NEWID(),@Acct20,@Leave14,NULL,'Pending',0,'Biweekly payroll validation deadline','2025-06-29 08:00:00',NULL,'2025-07-01 17:00:00',NULL),
(NEWID(),@Acct02,@Leave16,NULL,'Pending',0,'Monthly benefits processing needs admin oversight','2025-07-03 08:00:00',NULL,'2025-07-05 17:00:00',NULL),
(NEWID(),@Acct03,@Leave17,@Acct01,'Approved',0,'Recruitment pipeline update needs HR admin','2025-06-21 08:00:00','2025-06-21 09:00:00','2025-06-22 17:00:00',NULL),
(NEWID(),@Acct04,@Leave18,@Acct03,'Approved',0,'HR records update deadline for new hires','2025-06-27 08:00:00','2025-06-27 09:00:00','2025-06-28 17:00:00',NULL),
(NEWID(),@Acct05,@Leave19,NULL,'Pending',0,'Government contributions final validation','2025-07-08 08:00:00',NULL,'2025-07-10 17:00:00',NULL);

-- ============================================================================
-- 20. ANNOUNCEMENTS (20 rows - created by OpAdmins)
-- ============================================================================
DECLARE @Ann01 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000001';
DECLARE @Ann02 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000002';
DECLARE @Ann03 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000003';
DECLARE @Ann04 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000004';
DECLARE @Ann05 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000005';
DECLARE @Ann06 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000006';
DECLARE @Ann07 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000007';
DECLARE @Ann08 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000008';
DECLARE @Ann09 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000009';
DECLARE @Ann10 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000010';
DECLARE @Ann11 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000011';
DECLARE @Ann12 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000012';
DECLARE @Ann13 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000013';
DECLARE @Ann14 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000014';
DECLARE @Ann15 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000015';
DECLARE @Ann16 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000016';
DECLARE @Ann17 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000017';
DECLARE @Ann18 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000018';
DECLARE @Ann19 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000019';
DECLARE @Ann20 UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-000000000020';

INSERT INTO [Announcements] ([AnnouncementId],[CreatedBy],[Title],[Content],[TargetRole],[CreatedAt],[UpdatedAt])
VALUES
(@Ann01,@Acct01,'System Maintenance Scheduled','The OTMS system will undergo scheduled maintenance on June 22, 2025 from 10PM to 2AM. Please save all work before the maintenance window.','All','2025-06-15 08:00:00',NULL),
(@Ann02,@Acct02,'New Payroll Encoding Guidelines','Updated payroll encoding guidelines have been published. All encoders must review and follow the new procedures effective immediately.','Encoder','2025-06-16 09:00:00',NULL),
(@Ann03,@Acct03,'HR Policy Update - Leave Credits','Leave credit computation has been updated per new HR policy. Please check the updated leave balance section.','All','2025-06-17 10:00:00',NULL),
(@Ann04,@Acct01,'Quarterly Performance Review Schedule','Q2 performance reviews will be conducted from July 1-15, 2025. Department heads should prepare evaluation forms.','OperationAdmin','2025-06-18 08:00:00',NULL),
(@Ann05,@Acct02,'Task Deadline Reminder','All pending tasks for June must be completed or submitted for review by June 30, 2025. No extensions will be granted.','Encoder','2025-06-19 07:00:00',NULL),
(@Ann06,@Acct04,'New Employee Onboarding Process','The onboarding process has been streamlined. New checklist templates are now available in the task templates section.','All','2025-06-10 09:00:00',NULL),
(@Ann07,@Acct05,'Government Contributions Deadline','SSS, PhilHealth, and Pag-IBIG contributions for June must be encoded by June 28, 2025.','Encoder','2025-06-20 08:00:00',NULL),
(@Ann08,@Acct01,'Office Holiday - Independence Day','June 12, 2025 is a regular holiday. No work expected. Enjoy the long weekend!','All','2025-06-05 08:00:00',NULL),
(@Ann09,@Acct03,'Recruitment Drive - July 2025','HR is conducting a recruitment drive for 5 new encoder positions. Refer qualified candidates to HR.','All','2025-06-12 10:00:00',NULL),
(@Ann10,@Acct02,'Overtime Policy Reminder','All overtime must be pre-approved by your immediate supervisor. Unapproved OT will not be processed.','Encoder','2025-06-14 09:00:00',NULL),
(@Ann11,@Acct01,'IT Security Advisory','Please update your passwords and enable two-factor authentication. Report any suspicious activity to IT immediately.','All','2025-06-08 08:00:00',NULL),
(@Ann12,@Acct04,'Training Schedule - Data Encoding','Mandatory data encoding training on June 25, 2025 at 2PM in Conference Room B. All encoders must attend.','Encoder','2025-06-18 10:00:00',NULL),
(@Ann13,@Acct03,'Employee Wellness Program','Free health screening available on July 5, 2025. Sign up at the HR office or through the portal.','All','2025-06-20 09:00:00',NULL),
(@Ann14,@Acct05,'Payroll Processing Schedule','Biweekly payroll for June 16-30 will be processed on July 2, 2025. Ensure all entries are complete.','OperationAdmin','2025-06-19 11:00:00',NULL),
(@Ann15,@Acct01,'Asset Inventory Notice','Annual asset inventory will be conducted on July 15, 2025. All employees must present assigned assets for verification.','All','2025-06-20 08:00:00',NULL),
(@Ann16,@Acct02,'Task Template Updates','Several task templates have been updated with new descriptions and priorities. Please review before accepting new assignments.','Encoder','2025-06-11 09:00:00',NULL),
(@Ann17,@Acct03,'Compliance Training Requirement','All employees must complete the annual compliance training by July 31, 2025. Access the module through the learning portal.','All','2025-06-13 10:00:00',NULL),
(@Ann18,@Acct04,'Updated Contact Directory','The employee contact directory has been updated. Please verify your information and report any discrepancies to HR.','All','2025-06-16 11:00:00',NULL),
(@Ann19,@Acct01,'Emergency Contact Update Required','All employees must update their emergency contact information in their 201 file by June 30, 2025.','All','2025-06-07 08:00:00',NULL),
(@Ann20,@Acct02,'End of Month Task Submission','All task submissions for June must be completed by 5PM on June 30. Late submissions will be recorded for the next period.','Encoder','2025-06-20 10:00:00',NULL);

-- ============================================================================
-- 21. NOTIFICATIONS (20 rows)
-- ============================================================================
INSERT INTO [Notifications] ([NotificationId],[EmployeeId],[TaskId],[AnnouncementId],[NotificationType],[Message],[IsRead],[CreatedAt])
VALUES
(NEWID(),@Acct07,@Task01,NULL,'Task Assigned','You have been assigned: Encode June Week 3 Payroll',1,'2025-06-16 08:00:00'),
(NEWID(),@Acct08,@Task02,NULL,'Task Assigned','You have been assigned: Compile Week 25 Attendance',1,'2025-06-16 08:30:00'),
(NEWID(),@Acct09,@Task03,NULL,'Task Assigned','You have been assigned: June Inventory Count - Warehouse A',1,'2025-06-15 09:00:00'),
(NEWID(),@Acct02,@Task01,NULL,'Task Review Requested','Task TSK-0001 has been submitted for your review',1,'2025-06-19 16:30:00'),
(NEWID(),@Acct02,@Task01,NULL,'Task Approved And Closed','Task TSK-0001 has been approved and closed',1,'2025-06-20 15:00:00'),
(NEWID(),@Acct07,@Leave01,NULL,'Leave Request Submitted','Your vacation leave request for Jul 1-3 has been submitted',1,'2025-06-10 09:00:00'),
(NEWID(),@Acct07,@Leave01,NULL,'Leave Request Approved','Your vacation leave for Jul 1-3 has been approved by Maria Reyes',1,'2025-06-12 10:00:00'),
(NEWID(),@Acct08,@Leave02,NULL,'Leave Request Approved','Your sick leave for Jun 12-13 has been approved',1,'2025-06-12 08:00:00'),
(NEWID(),@Acct09,@Leave03,NULL,'Leave Request Submitted','Your vacation leave request for Jul 10-11 is pending approval',0,'2025-06-18 10:00:00'),
(NEWID(),@Acct07,NULL,@Ann01,'Announcement','System Maintenance Scheduled - June 22, 2025',1,'2025-06-15 08:00:00'),
(NEWID(),@Acct08,NULL,@Ann02,'Announcement','New Payroll Encoding Guidelines published',1,'2025-06-16 09:00:00'),
(NEWID(),@Acct12,NULL,@Ann05,'Announcement','Task Deadline Reminder - Complete all June tasks by June 30',0,'2025-06-19 07:00:00'),
(NEWID(),@Acct12,@Task05,NULL,'Task Approved And Closed','Task TSK-0005 has been approved and closed',1,'2025-06-20 10:00:00'),
(NEWID(),@Acct11,@Task11,NULL,'Task Approved And Closed','Task TSK-0011 onboarding batch has been approved',1,'2025-06-24 16:00:00'),
(NEWID(),@Acct19,@Task13,NULL,'Task Approved And Closed','Daily Task Summary for June 19 has been approved',1,'2025-06-19 17:30:00'),
(NEWID(),@Acct06,@Task06,NULL,'Task Updated','Task TSK-0006 progress has been updated',1,'2025-06-18 16:00:00'),
(NEWID(),@Acct13,@Task07,NULL,'Task Review Requested','Task TSK-0007 OT computation submitted for review',0,'2025-06-20 16:00:00'),
(NEWID(),@Acct16,@Task09,NULL,'Task Updated','Government contributions encoding in progress',1,'2025-06-19 10:00:00'),
(NEWID(),@Acct07,@Task19,NULL,'Task Updated','Incident report encoding in progress',0,'2025-06-20 08:00:00'),
(NEWID(),@Acct15,@Task16,NULL,'Task Approved And Closed','System backup verification completed and approved',1,'2025-06-20 11:30:00');

-- ============================================================================
-- 22. ACTIVITY LOGS (20 rows)
-- ============================================================================
INSERT INTO [ActivityLogs] ([ActivityLogId],[AccountId],[ActivityType],[Description],[CreatedAt])
VALUES
(NEWID(),@Acct01,'Login','User ricardo.cruz logged in successfully','2025-06-20 07:55:00'),
(NEWID(),@Acct02,'Login','User maria.reyes logged in successfully','2025-06-20 08:00:00'),
(NEWID(),@Acct03,'Login','User jose.bautista logged in successfully','2025-06-20 08:05:00'),
(NEWID(),@Acct07,'Login','User miguel.fernandez logged in successfully','2025-06-20 08:10:00'),
(NEWID(),@Acct07,'Task Updated','Updated task TSK-0001: Encode June Week 3 Payroll','2025-06-20 08:15:00'),
(NEWID(),@Acct02,'Task Status Updated','Approved and closed task TSK-0001','2025-06-20 15:00:00'),
(NEWID(),@Acct08,'Task Updated','Updated task TSK-0002: Compile Week 25 Attendance','2025-06-20 14:00:00'),
(NEWID(),@Acct09,'Task Updated','Updated task TSK-0003: June Inventory Count progress','2025-06-19 16:00:00'),
(NEWID(),@Acct12,'Task Status Updated','Submitted task TSK-0005 for review','2025-06-19 17:00:00'),
(NEWID(),@Acct02,'Leave Status Updated','Approved leave request for Cristina Morales (Sick Leave Jun 12-13)','2025-06-12 08:00:00'),
(NEWID(),@Acct03,'Leave Status Updated','Approved leave request for Patricia Santos (Vacation Leave Jun 14-15)','2025-06-08 10:00:00'),
(NEWID(),@Acct11,'Task Status Updated','Completed task TSK-0011: New Hire Onboarding Batch','2025-06-24 16:00:00'),
(NEWID(),@Acct19,'Task Status Updated','Submitted task TSK-0013 Daily Task Summary for review','2025-06-19 17:00:00'),
(NEWID(),@Acct02,'Task Comment Added','Added comment on task TSK-0001: Reviewed and approved','2025-06-20 15:00:00'),
(NEWID(),@Acct15,'Task Status Updated','Completed task TSK-0016: System Backup Verification','2025-06-20 11:30:00'),
(NEWID(),@Acct01,'Dashboard Viewed','Viewed operational dashboard with OPS department filter','2025-06-20 08:00:00'),
(NEWID(),@Acct02,'Task Created','Created task TSK-0002: Compile Week 25 Attendance','2025-06-16 08:30:00'),
(NEWID(),@Acct03,'Recruitment Status Updated','Updated applicant status for 3 candidates','2025-06-19 13:00:00'),
(NEWID(),@Acct05,'Login','User carlos.delacruz logged in successfully','2025-06-20 07:50:00'),
(NEWID(),@Acct04,'Profile Update','Updated employee contact records for 12 employees','2025-06-18 11:00:00');

-- ============================================================================
-- 23. APPROVAL ROUTING MATRIX (5 rows)
-- ============================================================================
DECLARE @ARM01 UNIQUEIDENTIFIER = 'BBBBBBBB-BBBB-BBBB-BBBB-000000000001';
DECLARE @ARM02 UNIQUEIDENTIFIER = 'BBBBBBBB-BBBB-BBBB-BBBB-000000000002';
DECLARE @ARM03 UNIQUEIDENTIFIER = 'BBBBBBBB-BBBB-BBBB-BBBB-000000000003';
DECLARE @ARM04 UNIQUEIDENTIFIER = 'BBBBBBBB-BBBB-BBBB-BBBB-000000000004';
DECLARE @ARM05 UNIQUEIDENTIFIER = 'BBBBBBBB-BBBB-BBBB-BBBB-000000000005';

INSERT INTO [ApprovalRoutingMatrices] ([RoutingMatrixId],[RequestType],[IsActive],[CreatedAt],[UpdatedAt])
VALUES
(@ARM01,'LeaveRequest',1,'2025-01-01 00:00:00',NULL),
(@ARM02,'TaskReopen',1,'2025-01-01 00:00:00',NULL),
(@ARM03,'EmergencyOverride',1,'2025-01-01 00:00:00',NULL),
(@ARM04,'AssetAllocation',1,'2025-01-01 00:00:00',NULL),
(@ARM05,'PurchaseRequest',1,'2025-01-01 00:00:00',NULL);

-- ============================================================================
-- 24. APPROVAL TIERS (20 rows)
-- ============================================================================
INSERT INTO [ApprovalTiers] ([TierId],[RoutingMatrixId],[TierLevel],[ApproverRole],[FallbackApproverRole],[IsFinalTier],[CreatedAt])
VALUES
(NEWID(),@ARM01,1,'OperationAdmin',NULL,1,'2025-01-01 00:00:00'),
(NEWID(),@ARM01,2,'OperationAdmin',NULL,1,'2025-01-01 00:00:00'),
(NEWID(),@ARM02,1,'OperationAdmin',NULL,1,'2025-01-01 00:00:00'),
(NEWID(),@ARM02,2,'OperationAdmin',NULL,1,'2025-01-01 00:00:00'),
(NEWID(),@ARM03,1,'OperationAdmin',NULL,1,'2025-01-01 00:00:00'),
(NEWID(),@ARM03,2,'OperationAdmin',NULL,1,'2025-01-01 00:00:00'),
(NEWID(),@ARM04,1,'OperationAdmin','OperationAdmin',0,'2025-01-01 00:00:00'),
(NEWID(),@ARM04,2,'OperationAdmin',NULL,1,'2025-01-01 00:00:00'),
(NEWID(),@ARM05,1,'OperationAdmin','OperationAdmin',0,'2025-01-01 00:00:00'),
(NEWID(),@ARM05,2,'OperationAdmin',NULL,0,'2025-01-01 00:00:00'),
(NEWID(),@ARM05,3,'OperationAdmin',NULL,1,'2025-01-01 00:00:00'),
(NEWID(),@ARM01,1,'Encoder',NULL,0,'2025-01-15 00:00:00'),
(NEWID(),@ARM02,1,'Encoder',NULL,0,'2025-01-15 00:00:00'),
(NEWID(),@ARM03,1,'Encoder',NULL,0,'2025-01-15 00:00:00'),
(NEWID(),@ARM04,1,'Encoder',NULL,0,'2025-01-15 00:00:00'),
(NEWID(),@ARM05,1,'Encoder',NULL,0,'2025-01-15 00:00:00'),
(NEWID(),@ARM01,2,'Encoder',NULL,0,'2025-01-15 00:00:00'),
(NEWID(),@ARM02,2,'Encoder',NULL,0,'2025-01-15 00:00:00'),
(NEWID(),@ARM03,2,'Encoder',NULL,0,'2025-01-15 00:00:00'),
(NEWID(),@ARM04,2,'Encoder',NULL,0,'2025-01-15 00:00:00');

-- ============================================================================
-- 25. APPROVAL REQUESTS (20 rows)
-- ============================================================================
DECLARE @AR01 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000001';
DECLARE @AR02 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000002';
DECLARE @AR03 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000003';
DECLARE @AR04 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000004';
DECLARE @AR05 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000005';
DECLARE @AR06 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000006';
DECLARE @AR07 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000007';
DECLARE @AR08 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000008';
DECLARE @AR09 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000009';
DECLARE @AR10 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000010';
DECLARE @AR11 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000011';
DECLARE @AR12 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000012';
DECLARE @AR13 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000013';
DECLARE @AR14 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000014';
DECLARE @AR15 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000015';
DECLARE @AR16 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000016';
DECLARE @AR17 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000017';
DECLARE @AR18 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000018';
DECLARE @AR19 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000019';
DECLARE @AR20 UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-000000000020';

INSERT INTO [ApprovalRequests] ([ApprovalRequestId],[RequestType],[SourceEntityType],[SourceEntityId],[RequesterAccountId],[CurrentTierLevel],[CurrentApproverAccountId],[Status],[StatusTrackingText],[TotalTierCount],[LastNotifiedAccountId],[CreatedAt],[UpdatedAt])
VALUES
(@AR01,'LeaveRequest','LeaveRequest',@Leave01,@Acct07,1,@Acct02,'Approved','Approved at Tier 1',1,@Acct02,'2025-06-10 09:00:00','2025-06-12 10:00:00'),
(@AR02,'LeaveRequest','LeaveRequest',@Leave02,@Acct08,1,@Acct02,'Approved','Approved at Tier 1',1,@Acct02,'2025-06-11 22:00:00','2025-06-12 08:00:00'),
(@AR03,'LeaveRequest','LeaveRequest',@Leave03,@Acct09,1,@Acct02,'Pending','Awaiting Tier 1 approval',1,NULL,'2025-06-18 10:00:00',NULL),
(@AR04,'LeaveRequest','LeaveRequest',@Leave04,@Acct10,1,@Acct02,'Approved','Approved at Tier 1',1,@Acct02,'2025-06-05 06:00:00','2025-06-05 08:00:00'),
(@AR05,'LeaveRequest','LeaveRequest',@Leave05,@Acct12,1,@Acct02,'Approved','Approved at Tier 1',1,@Acct02,'2025-06-20 14:00:00','2025-06-20 16:00:00'),
(@AR06,'LeaveRequest','LeaveRequest',@Leave06,@Acct13,1,@Acct02,'Pending','Awaiting Tier 1 approval',1,NULL,'2025-06-19 11:00:00',NULL),
(@AR07,'LeaveRequest','LeaveRequest',@Leave07,@Acct06,1,@Acct03,'Approved','Approved at Tier 1',1,@Acct03,'2025-06-07 09:00:00','2025-06-08 10:00:00'),
(@AR08,'LeaveRequest','LeaveRequest',@Leave08,@Acct11,1,@Acct03,'Approved','Approved at Tier 1',1,@Acct03,'2025-06-08 07:00:00','2025-06-08 08:00:00'),
(@AR09,'LeaveRequest','LeaveRequest',@Leave09,@Acct14,1,@Acct02,'Pending','Awaiting Tier 1 approval',1,NULL,'2025-06-20 08:00:00',NULL),
(@AR10,'LeaveRequest','LeaveRequest',@Leave10,@Acct16,1,@Acct02,'Approved','Approved at Tier 1',1,@Acct02,'2025-06-18 07:00:00','2025-06-18 08:30:00'),
(@AR11,'TaskReopen','TaskReopenRequest',@Task01,@Acct07,1,@Acct02,'Approved','Reopen approved at Tier 1',1,@Acct02,'2025-06-20 16:00:00','2025-06-20 16:30:00'),
(@AR12,'TaskReopen','TaskReopenRequest',@Task05,@Acct12,1,@Acct02,'Approved','Reopen approved at Tier 1',1,@Acct02,'2025-06-20 11:00:00','2025-06-20 11:30:00'),
(@AR13,'TaskReopen','TaskReopenRequest',@Task11,@Acct11,1,@Acct03,'Approved','Reopen approved at Tier 1',1,@Acct03,'2025-06-25 08:00:00','2025-06-25 08:30:00'),
(@AR14,'EmergencyOverride','EmergencyOverrideRequest',@Leave01,@Acct07,1,@Acct02,'Approved','Override approved at Tier 1',1,@Acct02,'2025-06-28 08:00:00','2025-06-28 10:00:00'),
(@AR15,'EmergencyOverride','EmergencyOverrideRequest',@Leave02,@Acct08,1,@Acct02,'Approved','Override approved at Tier 1',1,@Acct02,'2025-06-12 10:00:00','2025-06-12 11:00:00'),
(@AR16,'LeaveRequest','LeaveRequest',@Leave15,@Acct01,1,@Acct02,'Approved','Approved at Tier 1',1,@Acct02,'2025-06-01 08:00:00','2025-06-02 09:00:00'),
(@AR17,'LeaveRequest','LeaveRequest',@Leave17,@Acct03,1,@Acct01,'Approved','Approved at Tier 1',1,@Acct01,'2025-06-15 08:00:00','2025-06-16 09:00:00'),
(@AR18,'LeaveRequest','LeaveRequest',@Leave18,@Acct04,1,@Acct03,'Approved','Approved at Tier 1',1,@Acct03,'2025-06-10 10:00:00','2025-06-11 08:00:00'),
(@AR19,'LeaveRequest','LeaveRequest',@Leave20,@Acct15,1,@Acct01,'Approved','Approved at Tier 1',1,@Acct01,'2025-06-19 06:00:00','2025-06-19 08:00:00'),
(@AR20,'LeaveRequest','LeaveRequest',@Leave11,@Acct17,1,@Acct02,'Pending','Awaiting Tier 1 approval',1,NULL,'2025-06-15 10:00:00',NULL);

-- ============================================================================
-- 26. APPROVAL DECISIONS (20 rows)
-- ============================================================================
INSERT INTO [ApprovalDecisions] ([ApprovalDecisionId],[ApprovalRequestId],[TierLevel],[ApproverAccountId],[Decision],[Remarks],[CreatedAt])
VALUES
(NEWID(),@AR01,1,@Acct02,'Approved','Leave approved. Enjoy your vacation!','2025-06-12 10:00:00'),
(NEWID(),@AR02,1,@Acct02,'Approved','Sick leave approved with medical certificate.','2025-06-12 08:00:00'),
(NEWID(),@AR04,1,@Acct02,'Approved','Emergency leave approved. Hope your mother recovers soon.','2025-06-05 08:00:00'),
(NEWID(),@AR05,1,@Acct02,'Approved','Approved for personal errands.','2025-06-20 16:00:00'),
(NEWID(),@AR07,1,@Acct03,'Approved','Family trip approved.','2025-06-08 10:00:00'),
(NEWID(),@AR08,1,@Acct03,'Approved','Bereavement leave approved. Condolences.','2025-06-08 08:00:00'),
(NEWID(),@AR10,1,@Acct02,'Approved','Sick leave approved. Rest well.','2025-06-18 08:30:00'),
(NEWID(),@AR11,1,@Acct02,'Approved','Reopen approved for payroll correction.','2025-06-20 16:30:00'),
(NEWID(),@AR12,1,@Acct02,'Approved','Reopen approved for filing correction.','2025-06-20 11:30:00'),
(NEWID(),@AR13,1,@Acct03,'Approved','Reopen approved for additional onboarding docs.','2025-06-25 08:30:00'),
(NEWID(),@AR14,1,@Acct02,'Approved','Emergency override approved for payroll deadline.','2025-06-28 10:00:00'),
(NEWID(),@AR15,1,@Acct02,'Approved','Emergency override approved for attendance deadline.','2025-06-12 11:00:00'),
(NEWID(),@AR16,1,@Acct02,'Approved','Annual vacation approved. Enjoy Palawan!','2025-06-02 09:00:00'),
(NEWID(),@AR17,1,@Acct01,'Approved','Medical checkup approved.','2025-06-16 09:00:00'),
(NEWID(),@AR18,1,@Acct03,'Approved','Graduation ceremony approved.','2025-06-11 08:00:00'),
(NEWID(),@AR19,1,@Acct01,'Approved','Sick leave approved. Get well soon.','2025-06-19 08:00:00'),
(NEWID(),@AR03,1,@Acct02,'Rejected','Insufficient notice period. Please reschedule.','2025-06-19 14:00:00'),
(NEWID(),@AR06,1,@Acct02,'Rejected','Medical certificate required for 3-day sick leave.','2025-06-19 15:00:00'),
(NEWID(),@AR09,1,@Acct02,'Rejected','Moving date conflicts with critical deadline.','2025-06-20 10:00:00'),
(NEWID(),@AR20,1,@Acct02,'Rejected','Conference attendance requires prior department approval.','2025-06-16 11:00:00');

-- ============================================================================
-- 27. NOTIFICATION AUDIT LOGS (20 rows)
-- ============================================================================
INSERT INTO [NotificationAuditLogs] ([AuditId],[ApprovalRequestId],[RecipientAccountId],[NotificationType],[Channel],[Status],[ErrorMessage],[SentAt])
VALUES
(NEWID(),@AR01,@Acct07,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-12 10:01:00'),
(NEWID(),@AR02,@Acct08,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-12 08:01:00'),
(NEWID(),@AR03,@Acct02,'ApprovalRequestPending','Email','Sent',NULL,'2025-06-18 10:01:00'),
(NEWID(),@AR04,@Acct10,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-05 08:01:00'),
(NEWID(),@AR05,@Acct12,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-20 16:01:00'),
(NEWID(),@AR06,@Acct02,'ApprovalRequestPending','Email','Sent',NULL,'2025-06-19 11:01:00'),
(NEWID(),@AR07,@Acct06,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-08 10:01:00'),
(NEWID(),@AR08,@Acct11,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-08 08:01:00'),
(NEWID(),@AR09,@Acct02,'ApprovalRequestPending','Email','Failed','SMTP connection timeout','2025-06-20 08:01:00'),
(NEWID(),@AR10,@Acct16,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-18 08:31:00'),
(NEWID(),@AR11,@Acct07,'ApprovalTierApproved','InApp','Sent',NULL,'2025-06-20 16:31:00'),
(NEWID(),@AR12,@Acct12,'ApprovalTierApproved','InApp','Sent',NULL,'2025-06-20 11:31:00'),
(NEWID(),@AR13,@Acct11,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-25 08:31:00'),
(NEWID(),@AR14,@Acct07,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-28 10:01:00'),
(NEWID(),@AR15,@Acct08,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-12 11:01:00'),
(NEWID(),@AR16,@Acct01,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-02 09:01:00'),
(NEWID(),@AR17,@Acct03,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-16 09:01:00'),
(NEWID(),@AR18,@Acct04,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-11 08:01:00'),
(NEWID(),@AR19,@Acct15,'ApprovalTierApproved','Email','Sent',NULL,'2025-06-19 08:01:00'),
(NEWID(),@AR20,@Acct02,'ApprovalRequestPending','Email','Sent',NULL,'2025-06-15 10:01:00');

-- ============================================================================
-- 28. APPLICANT RECORDS (20 rows)
-- ============================================================================
DECLARE @App01 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000001';
DECLARE @App02 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000002';
DECLARE @App03 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000003';
DECLARE @App04 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000004';
DECLARE @App05 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000005';
DECLARE @App06 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000006';
DECLARE @App07 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000007';
DECLARE @App08 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000008';
DECLARE @App09 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000009';
DECLARE @App10 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000010';
DECLARE @App11 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000011';
DECLARE @App12 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000012';
DECLARE @App13 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000013';
DECLARE @App14 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000014';
DECLARE @App15 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000015';
DECLARE @App16 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000016';
DECLARE @App17 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000017';
DECLARE @App18 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000018';
DECLARE @App19 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000019';
DECLARE @App20 UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-000000000020';

INSERT INTO [ApplicantRecords] ([ApplicantRecordId],[FirstName],[MiddleName],[LastName],[Suffix],[FullName],[Gender],[CivilStatus],[BirthMonth],[BirthDay],[BirthYear],[Age],[Nationality],[Citizenship],[EmailAddress],[ContactNumber],[CurrentResidentialAddress],[PermanentAddress],[ResumeFilePath],[SSSNumber],[PhilHealthNumber],[PagIBIGNumber],[TIN],[BankName],[BankAccountName],[BankAccountNumber],[NBIClearanceFilePath],[MedicalClearanceFilePath],[PSABirthCertificateFilePath],[BIRForm2316FilePath],[EmergencyContactName],[EmergencyContactRelationship],[EmergencyContactMobileNumber],[DeclaredDependents],[MotherFirstName],[MotherMiddleName],[MotherLastName],[FatherFirstName],[FatherMiddleName],[FatherLastName],[HighestEducationalAttainment],[InstitutionAndYearGraduated],[Institution],[Degree],[YearGraduated],[ProfessionalLicensesCertifications],[JobPositionId],[ReferenceNumber],[Status],[IsEmailVerified],[EmailVerificationToken],[EmailVerificationTokenExpiry],[CreatedAt],[UpdatedAt])
VALUES
(@App01,'John','Mendoza','Dizon',NULL,'John Mendoza Dizon','Male','Single',3,15,1995,30,'Filipino','Filipino','john.dizon@email.com','09271111001','Unit 5 Blk 2 Sunrise Village, Quezon City','123 Mabini St, Manila','/uploads/resumes/resume_dizon.pdf','34-1111111-1','01-111111111','1111111111','111-111-111-000','BDO','John Dizon','0011111111','/uploads/applicant-docs/nbi_dizon.pdf','/uploads/applicant-docs/med_dizon.pdf','/uploads/applicant-docs/psa_dizon.pdf','/uploads/applicant-docs/bir_dizon.pdf','Maria Dizon','Mother','09271111099','None','Maria','Santos','Dizon','Roberto','Cruz','Dizon','Bachelor','University of the Philippines, 2017','University of the Philippines','BS Computer Science','2017','None',@JP_Encoder,'APP-2025-001','Pending Review',1,NULL,NULL,'2025-06-01 08:00:00',NULL),
(@App02,'Grace','Lim','Chua',NULL,'Grace Lim Chua','Female','Single',7,22,1997,28,'Filipino','Filipino','grace.chua@email.com','09271111002','456 Rizal Ave, Makati City','456 Rizal Ave, Makati City','/uploads/resumes/resume_chua.pdf','34-2222222-2','01-222222222','2222222222','222-222-222-000','BPI','Grace Chua','0022222222','/uploads/applicant-docs/nbi_chua.pdf',NULL,NULL,NULL,'Linda Chua','Mother','09271111098','None','Linda','Tan','Chua','William','Lim','Chua','Bachelor','De La Salle University, 2019','De La Salle University','BS Accountancy','2019','CPA License',@JP_Encoder,'APP-2025-002','Pending Review',1,NULL,NULL,'2025-06-02 09:00:00',NULL),
(@App03,'Mark','Santos','Rivera',NULL,'Mark Santos Rivera','Male','Single',11,8,1993,32,'Filipino','Filipino','mark.rivera@email.com','09271111003','789 Bonifacio St, Pasig City','789 Bonifacio St, Pasig City','/uploads/resumes/resume_rivera.pdf','34-3333333-3','01-333333333','3333333333','333-333-333-000','Metrobank','Mark Rivera','0033333333','/uploads/applicant-docs/nbi_rivera.pdf','/uploads/applicant-docs/med_rivera.pdf',NULL,NULL,'Elena Rivera','Mother','09271111097','None','Elena','Reyes','Rivera','Antonio','Santos','Rivera','Bachelor','Ateneo de Manila University, 2015','Ateneo de Manila University','BS Information Technology','2015','None',@JP_SrEncoder,'APP-2025-003','Interview Scheduled',1,NULL,NULL,'2025-06-03 10:00:00','2025-06-10 09:00:00'),
(@App04,'Anna','Reyes','Garcia',NULL,'Anna Reyes Garcia','Female','Married',5,30,1990,35,'Filipino','Filipino','anna.garcia@email.com','09271111004','321 Luna St, Mandaluyong','321 Luna St, Mandaluyong','/uploads/resumes/resume_garcia.pdf','34-4444444-4','01-444444444','4444444444','444-444-444-000','UnionBank','Anna Garcia','0044444444','/uploads/applicant-docs/nbi_garcia.pdf','/uploads/applicant-docs/med_garcia.pdf','/uploads/applicant-docs/psa_garcia.pdf','/uploads/applicant-docs/bir_garcia.pdf','Roberto Garcia','Spouse','09271111096','1 child','Carmen','Lopez','Reyes','Jose','Aquino','Reyes','Master','University of Santo Tomas, 2014','University of Santo Tomas','MBA','2014','None',@JP_HRAdmin,'APP-2025-004','Offer Extended',1,NULL,NULL,'2025-06-04 08:00:00','2025-06-18 10:00:00'),
(@App05,'Paul','Torres','Aquino',NULL,'Paul Torres Aquino','Male','Single',9,12,1996,29,'Filipino','Filipino','paul.aquino@email.com','09271111005','555 Del Pilar St, Taguig','555 Del Pilar St, Taguig','/uploads/resumes/resume_aquino.pdf','34-5555555-5','01-555555555','5555555555','555-555-555-000','RCBC','Paul Aquino','0055555555','/uploads/applicant-docs/nbi_aquino.pdf',NULL,NULL,NULL,'Rosa Aquino','Mother','09271111095','None','Rosa','Torres','Aquino','Miguel','Castillo','Aquino','Bachelor','Mapua University, 2018','Mapua University','BS Electronics Engineering','2018','None',@JP_Encoder,'APP-2025-005','Pending Review',1,NULL,NULL,'2025-06-05 09:00:00',NULL),
(@App06,'Diana','Cruz','Fernandez',NULL,'Diana Cruz Fernandez','Female','Single',1,25,1998,27,'Filipino','Filipino','diana.fernandez@email.com','09271111006','888 Mabini St, Paranaque','888 Mabini St, Paranaque','/uploads/resumes/resume_fernandez2.pdf','34-6666666-6','01-666666666','6666666666','666-666-666-000','Chinabank','Diana Fernandez','0066666666','/uploads/applicant-docs/nbi_fernandez2.pdf','/uploads/applicant-docs/med_fernandez2.pdf',NULL,NULL,'Carmen Fernandez','Mother','09271111094','None','Carmen','Diaz','Cruz','Fernando','Reyes','Fernandez','Bachelor','Polytechnic University of the Philippines, 2020','Polytechnic University of the Philippines','BS Office Administration','2020','None',@JP_Encoder,'APP-2025-006','Screening',1,NULL,NULL,'2025-06-06 10:00:00','2025-06-12 09:00:00'),
(@App07,'Kevin','Morales','Salazar',NULL,'Kevin Morales Salazar','Male','Single',4,18,1994,31,'Filipino','Filipino','kevin.salazar@email.com','09271111007','234 EDSA, Caloocan','234 EDSA, Caloocan','/uploads/resumes/resume_salazar.pdf','34-7777777-7','01-777777777','7777777777','777-777-777-000','PNB','Kevin Salazar','0077777777','/uploads/applicant-docs/nbi_salazar.pdf',NULL,NULL,NULL,'Luz Salazar','Mother','09271111093','None','Luz','Morales','Salazar','Pedro','Garcia','Salazar','Bachelor','Far Eastern University, 2016','Far Eastern University','BS Business Administration','2016','None',@JP_SrEncoder,'APP-2025-007','Interview Scheduled',1,NULL,NULL,'2025-06-07 08:00:00','2025-06-14 10:00:00'),
(@App08,'Rose','Navarro','Pascual',NULL,'Rose Navarro Pascual','Female','Married',8,5,1991,34,'Filipino','Filipino','rose.pascual@email.com','09271111008','567 Quezon Ave, QC','567 Quezon Ave, QC','/uploads/resumes/resume_pascual.pdf','34-8888888-8','01-888888888','8888888888','888-888-888-000','Security Bank','Rose Pascual','0088888888','/uploads/applicant-docs/nbi_pascual2.pdf','/uploads/applicant-docs/med_pascual2.pdf','/uploads/applicant-docs/psa_pascual2.pdf','/uploads/applicant-docs/bir_pascual2.pdf','Ernesto Pascual','Spouse','09271111092','2 children','Teresa','Lim','Navarro','Carlos','Santos','Navarro','Bachelor','University of the East, 2013','University of the East','BS Nursing','2013','Registered Nurse License',@JP_HRAdmin,'APP-2025-008','Pending Review',1,NULL,NULL,'2025-06-08 09:00:00',NULL),
(@App09,'James','Castillo','Medina',NULL,'James Castillo Medina','Male','Single',12,20,1999,26,'Filipino','Filipino','james.medina@email.com','09271111009','901 Shaw Blvd, Mandaluyong','901 Shaw Blvd, Mandaluyong','/uploads/resumes/resume_medina.pdf','34-9999999-9','01-999999999','9999999999','999-999-999-000','EastWest Bank','James Medina','0099999999','/uploads/applicant-docs/nbi_medina.pdf',NULL,NULL,NULL,'Diana Medina','Mother','09271111091','None','Diana','Castillo','Medina','Andres','Flores','Medina','Bachelor','Technological University of the Philippines, 2021','Technological University of the Philippines','BS Industrial Engineering','2021','None',@JP_Encoder,'APP-2025-009','Screening',1,NULL,NULL,'2025-06-09 10:00:00','2025-06-15 08:00:00'),
(@App10,'Cherry','Alvarez','Bueno',NULL,'Cherry Alvarez Bueno','Female','Single',6,14,1996,29,'Filipino','Filipino','cherry.bueno@email.com','09271111010','345 Ortigas Ave, Pasig','345 Ortigas Ave, Pasig','/uploads/resumes/resume_bueno.pdf','34-0000000-0','01-000000000','0000000000','000-000-000-000','BDO','Cherry Bueno','0100000000','/uploads/applicant-docs/nbi_bueno.pdf','/uploads/applicant-docs/med_bueno.pdf',NULL,NULL,'Arturo Bueno','Father','09271111090','None','Rosario','Alvarez','Bueno','Arturo','Reyes','Bueno','Bachelor','Adamson University, 2018','Adamson University','BS Psychology','2018','None',@JP_Encoder,'APP-2025-010','Pending Review',1,NULL,NULL,'2025-06-10 08:00:00',NULL),
(@App11,'Ryan','Flores','Ortiz',NULL,'Ryan Flores Ortiz','Male','Single',2,28,1992,33,'Filipino','Filipino','ryan.ortiz@email.com','09271111011','678 Taft Ave, Manila','678 Taft Ave, Manila','/uploads/resumes/resume_ortiz.pdf','34-1234567-0','01-123456780','1234567890','123-456-789-000','BPI','Ryan Ortiz','0110000000','/uploads/applicant-docs/nbi_ortiz.pdf',NULL,NULL,NULL,'Concepcion Ortiz','Mother','09271111089','None','Concepcion','Flores','Ortiz','Rafael','Santos','Ortiz','Bachelor','University of Manila, 2014','University of Manila','BS Commerce','2014','None',@JP_SrEncoder,'APP-2025-011','Interview Scheduled',1,NULL,NULL,'2025-06-11 09:00:00','2025-06-17 10:00:00'),
(@App12,'Joy','Santos','Vergara',NULL,'Joy Santos Vergara','Female','Single',10,3,1997,28,'Filipino','Filipino','joy.vergara@email.com','09271111012','111 España Blvd, Sampaloc','111 España Blvd, Sampaloc','/uploads/resumes/resume_vergara.pdf','34-2345678-1','01-234567891','2345678901','234-567-890-000','Metrobank','Joy Vergara','0120000000','/uploads/applicant-docs/nbi_vergara2.pdf','/uploads/applicant-docs/med_vergara2.pdf',NULL,NULL,'Felipe Vergara','Father','09271111088','None','Carmela','Santos','Vergara','Felipe','Cruz','Vergara','Bachelor','University of Santo Tomas, 2019','University of Santo Tomas','BS Medical Technology','2019','Medical Technologist License',@JP_Encoder,'APP-2025-012','Pending Review',1,NULL,NULL,'2025-06-12 10:00:00',NULL),
(@App13,'Leo','Domingo','Magno',NULL,'Leo Domingo Magno','Male','Single',7,9,1995,30,'Filipino','Filipino','leo.magno@email.com','09271111013','222 España, Manila','222 España, Manila','/uploads/resumes/resume_magno2.pdf','34-3456789-2','01-345678902','3456789012','345-678-901-000','UnionBank','Leo Magno','0130000000','/uploads/applicant-docs/nbi_magno2.pdf',NULL,NULL,NULL,'Lourdes Magno','Mother','09271111087','None','Lourdes','Domingo','Magno','Victor','Reyes','Magno','Bachelor','De La Salle University, 2017','De La Salle University','BS Computer Engineering','2017','None',@JP_Encoder,'APP-2025-013','Screening',1,NULL,NULL,'2025-06-13 08:00:00','2025-06-18 09:00:00'),
(@App14,'Marie','Aguilar','Lagman',NULL,'Marie Aguilar Lagman','Female','Single',3,22,1998,27,'Filipino','Filipino','marie.lagman@email.com','09271111014','333 Roxas Blvd, Pasay','333 Roxas Blvd, Pasay','/uploads/resumes/resume_lagman.pdf','34-4567890-3','01-456789013','4567890123','456-789-012-000','RCBC','Marie Lagman','0140000000','/uploads/applicant-docs/nbi_lagman.pdf','/uploads/applicant-docs/med_lagman.pdf',NULL,NULL,'Arturo Lagman','Father','09271111086','None','Teresa','Aguilar','Lagman','Arturo','Bueno','Lagman','Bachelor','Ateneo de Manila University, 2020','Ateneo de Manila University','BS Management','2020','None',@JP_Encoder,'APP-2025-014','Pending Review',1,NULL,NULL,'2025-06-14 09:00:00',NULL),
(@App15,'Carl','Reyes','Salvador',NULL,'Carl Reyes Salvador','Male','Married',5,17,1989,36,'Filipino','Filipino','carl.salvador@email.com','09271111015','444 Ayala Ave, Makati','444 Ayala Ave, Makati','/uploads/resumes/resume_salvador2.pdf','34-5678901-4','01-567890124','5678901234','567-890-123-000','Chinabank','Carl Salvador','0150000000','/uploads/applicant-docs/nbi_salvador2.pdf','/uploads/applicant-docs/med_salvador2.pdf','/uploads/applicant-docs/psa_salvador2.pdf','/uploads/applicant-docs/bir_salvador2.pdf','Teresa Salvador','Spouse','09271111085','2 children','Maria','Reyes','Salvador','Marco','Lim','Salvador','Master','Ateneo de Manila University, 2013','Ateneo de Manila University','MS Information Systems','2013','PMP Certification',@JP_ITSpec,'APP-2025-015','Offer Extended',1,NULL,NULL,'2025-06-15 10:00:00','2025-06-19 11:00:00'),
(@App16,'Nina','Castillo','Herrera',NULL,'Nina Castillo Herrera','Female','Single',9,11,1996,29,'Filipino','Filipino','nina.herrera@email.com','09271111016','555 Commonwealth Ave, QC','555 Commonwealth Ave, QC','/uploads/resumes/resume_herrera2.pdf','34-6789012-5','01-678901235','6789012345','678-901-234-000','PNB','Nina Herrera','0160000000','/uploads/applicant-docs/nbi_herrera2.pdf',NULL,NULL,NULL,'Maria Herrera','Mother','09271111084','None','Maria','Castillo','Herrera','Fernando','Santos','Herrera','Bachelor','University of the Philippines, 2018','University of the Philippines','BS Statistics','2018','None',@JP_Encoder,'APP-2025-016','Pending Review',1,NULL,NULL,'2025-06-16 08:00:00',NULL),
(@App17,'Eric','Torres','Pascual',NULL,'Eric Torres Pascual','Male','Single',11,29,1994,31,'Filipino','Filipino','eric.pascual@email.com','09271111017','666 EDSA, Cubao','666 EDSA, Cubao','/uploads/resumes/resume_pascual2.pdf','34-7890123-6','01-789012346','7890123456','789-012-345-000','Security Bank','Eric Pascual','0170000000','/uploads/applicant-docs/nbi_pascual3.pdf','/uploads/applicant-docs/med_pascual3.pdf',NULL,NULL,'Ernesto Pascual','Father','09271111083','None','Lucia','Torres','Pascual','Ernesto','Navarro','Pascual','Bachelor','Mapua University, 2016','Mapua University','BS Civil Engineering','2016','Civil Engineer License',@JP_SrEncoder,'APP-2025-017','Interview Scheduled',1,NULL,NULL,'2025-06-17 09:00:00','2025-06-19 14:00:00'),
(@App18,'Liza','Medina','Soriano',NULL,'Liza Medina Soriano','Female','Single',4,7,1997,28,'Filipino','Filipino','liza.soriano@email.com','09271111018','777 España, Manila','777 España, Manila','/uploads/resumes/resume_soriano2.pdf','34-8901234-7','01-890123457','8901234567','890-123-456-000','EastWest Bank','Liza Soriano','0180000000','/uploads/applicant-docs/nbi_soriano2.pdf',NULL,NULL,NULL,'Diana Soriano','Mother','09271111082','None','Diana','Medina','Soriano','Andres','Flores','Soriano','Bachelor','Far Eastern University, 2019','Far Eastern University','BS Marketing','2019','None',@JP_Encoder,'APP-2025-018','Screening',1,NULL,NULL,'2025-06-18 10:00:00','2025-06-20 08:00:00'),
(@App19,'Ian','Bueno','Mendoza',NULL,'Ian Bueno Mendoza','Male','Single',8,16,1993,32,'Filipino','Filipino','ian.mendoza@email.com','09271111019','888 Taft Ave, Manila','888 Taft Ave, Manila','/uploads/resumes/resume_mendoza2.pdf','34-9012345-8','01-901234568','9012345678','901-234-567-000','BDO','Ian Mendoza','0190000000','/uploads/applicant-docs/nbi_mendoza2.pdf','/uploads/applicant-docs/med_mendoza2.pdf',NULL,NULL,'Hector Mendoza','Father','09271111081','None','Isabella','Bueno','Mendoza','Hector','Cruz','Mendoza','Bachelor','De La Salle University, 2015','De La Salle University','BS Economics','2015','None',@JP_Encoder,'APP-2025-019','Pending Review',1,NULL,NULL,'2025-06-19 08:00:00',NULL),
(@App20,'Bea','Salvador','Domingo',NULL,'Bea Salvador Domingo','Female','Single',1,3,1999,26,'Filipino','Filipino','bea.domingo@email.com','09271111020','999 Roxas Blvd, Manila','999 Roxas Blvd, Manila','/uploads/resumes/resume_domingo2.pdf','34-0123456-9','01-012345679','0123456789','012-345-678-000','BPI','Bea Domingo','0200000000','/uploads/applicant-docs/nbi_domingo2.pdf',NULL,NULL,NULL,'Victor Domingo','Father','09271111080','None','Sofia','Salvador','Domingo','Victor','Alvarez','Domingo','Bachelor','University of Santo Tomas, 2021','University of Santo Tomas','BS Pharmacy','2021','None',@JP_Encoder,'APP-2025-020','Pending Review',1,NULL,NULL,'2025-06-20 09:00:00',NULL);

-- ============================================================================
-- 29. APPLICANT STATUS RECORDS (20 rows)
-- ============================================================================
INSERT INTO [ApplicantStatusRecords] ([ApplicantStatusRecordId],[ApplicantRecordId],[OldStatus],[NewStatus],[Remarks],[UpdatedById],[UpdatedAt])
VALUES
(NEWID(),@App03,'Pending Review','Screening','Resume reviewed, moving to screening',@Acct03,'2025-06-05 09:00:00'),
(NEWID(),@App03,'Screening','Interview Scheduled','Passed screening. Interview set for June 17',@Acct03,'2025-06-10 09:00:00'),
(NEWID(),@App04,'Pending Review','Screening','Strong candidate, fast-tracked',@Acct04,'2025-06-06 08:00:00'),
(NEWID(),@App04,'Screening','Interview Scheduled','Excellent qualifications',@Acct04,'2025-06-08 10:00:00'),
(NEWID(),@App04,'Interview Scheduled','Offer Extended','Outstanding interview performance',@Acct03,'2025-06-18 10:00:00'),
(NEWID(),@App06,'Pending Review','Screening','Documents verified',@Acct04,'2025-06-12 09:00:00'),
(NEWID(),@App07,'Pending Review','Screening','Qualifications match requirements',@Acct03,'2025-06-09 10:00:00'),
(NEWID(),@App07,'Screening','Interview Scheduled','Scheduled for panel interview',@Acct03,'2025-06-14 10:00:00'),
(NEWID(),@App09,'Pending Review','Screening','Initial review completed',@Acct04,'2025-06-15 08:00:00'),
(NEWID(),@App11,'Pending Review','Screening','Engineering background verified',@Acct03,'2025-06-13 09:00:00'),
(NEWID(),@App11,'Screening','Interview Scheduled','Technical interview scheduled',@Acct03,'2025-06-17 10:00:00'),
(NEWID(),@App13,'Pending Review','Screening','IT skills assessment passed',@Acct04,'2025-06-18 09:00:00'),
(NEWID(),@App15,'Pending Review','Screening','Senior-level experience confirmed',@Acct03,'2025-06-16 10:00:00'),
(NEWID(),@App15,'Screening','Interview Scheduled','Final round interview scheduled',@Acct03,'2025-06-17 11:00:00'),
(NEWID(),@App15,'Interview Scheduled','Offer Extended','Approved for IT Specialist position',@Acct01,'2025-06-19 11:00:00'),
(NEWID(),@App17,'Pending Review','Screening','Civil engineering license verified',@Acct04,'2025-06-18 10:00:00'),
(NEWID(),@App17,'Screening','Interview Scheduled','Panel interview on June 23',@Acct03,'2025-06-19 14:00:00'),
(NEWID(),@App18,'Pending Review','Screening','Marketing experience verified',@Acct04,'2025-06-20 08:00:00'),
(NEWID(),@App01,'Pending Review','Screening','Initial resume screening passed',@Acct04,'2025-06-08 09:00:00'),
(NEWID(),@App02,'Pending Review','Screening','CPA license verified',@Acct04,'2025-06-09 08:00:00');

-- ============================================================================
-- 30. INTERVIEW SCHEDULES (20 rows)
-- ============================================================================
INSERT INTO [InterviewSchedules] ([InterviewScheduleId],[ApplicantRecordId],[InterviewDate],[InterviewTime],[LocationOrLink],[InterviewerName],[CreatedAt])
VALUES
(NEWID(),@App03,'2025-06-17','10:00 AM','Conference Room A, 5th Floor','Jose Bautista','2025-06-10 09:00:00'),
(NEWID(),@App04,'2025-06-12','02:00 PM','Conference Room B, 5th Floor','Ana Villanueva','2025-06-08 10:00:00'),
(NEWID(),@App07,'2025-06-19','09:00 AM','Google Meet - link sent via email','Jose Bautista','2025-06-14 10:00:00'),
(NEWID(),@App11,'2025-06-23','01:00 PM','Conference Room A, 5th Floor','Maria Reyes','2025-06-17 10:00:00'),
(NEWID(),@App15,'2025-06-18','03:00 PM','Zoom - link sent via email','Ricardo Cruz','2025-06-17 11:00:00'),
(NEWID(),@App17,'2025-06-23','10:00 AM','Conference Room B, 5th Floor','Ana Villanueva','2025-06-19 14:00:00'),
(NEWID(),@App01,'2025-06-24','09:00 AM','Conference Room A, 5th Floor','Jose Bautista','2025-06-20 08:00:00'),
(NEWID(),@App02,'2025-06-24','11:00 AM','Conference Room A, 5th Floor','Maria Reyes','2025-06-20 09:00:00'),
(NEWID(),@App05,'2025-06-25','10:00 AM','Google Meet - link sent via email','Jose Bautista','2025-06-20 10:00:00'),
(NEWID(),@App08,'2025-06-25','02:00 PM','Conference Room B, 5th Floor','Ana Villanueva','2025-06-20 10:00:00'),
(NEWID(),@App10,'2025-06-26','09:00 AM','Conference Room A, 5th Floor','Maria Reyes','2025-06-20 11:00:00'),
(NEWID(),@App12,'2025-06-26','01:00 PM','Zoom - link sent via email','Jose Bautista','2025-06-20 11:00:00'),
(NEWID(),@App14,'2025-06-27','10:00 AM','Conference Room A, 5th Floor','Ana Villanueva','2025-06-20 12:00:00'),
(NEWID(),@App16,'2025-06-27','02:00 PM','Conference Room B, 5th Floor','Maria Reyes','2025-06-20 12:00:00'),
(NEWID(),@App19,'2025-06-30','09:00 AM','Google Meet - link sent via email','Jose Bautista','2025-06-20 13:00:00'),
(NEWID(),@App20,'2025-06-30','11:00 AM','Conference Room A, 5th Floor','Ana Villanueva','2025-06-20 13:00:00'),
(NEWID(),@App06,'2025-07-01','10:00 AM','Conference Room B, 5th Floor','Maria Reyes','2025-06-20 14:00:00'),
(NEWID(),@App09,'2025-07-01','02:00 PM','Zoom - link sent via email','Jose Bautista','2025-06-20 14:00:00'),
(NEWID(),@App13,'2025-07-02','09:00 AM','Conference Room A, 5th Floor','Ana Villanueva','2025-06-20 15:00:00'),
(NEWID(),@App18,'2025-07-02','01:00 PM','Conference Room B, 5th Floor','Maria Reyes','2025-06-20 15:00:00');

-- ============================================================================
-- 31. ONBOARDING TOKENS (20 rows)
-- ============================================================================
INSERT INTO [OnboardingTokens] ([OnboardingTokenId],[ApplicantRecordId],[TokenHash],[Status],[ExpiresAt],[CreatedAt],[UsedAt],[CreatedByAccountId])
VALUES
(NEWID(),@App04,'HASH-ONB-TKN-004-abc123def456','Active','2025-07-18 10:00:00','2025-06-18 10:00:00',NULL,@Acct03),
(NEWID(),@App15,'HASH-ONB-TKN-015-ghi789jkl012','Active','2025-07-19 11:00:00','2025-06-19 11:00:00',NULL,@Acct03),
(NEWID(),@App03,'HASH-ONB-TKN-003-mno345pqr678','Active','2025-07-20 09:00:00','2025-06-20 09:00:00',NULL,@Acct04),
(NEWID(),@App07,'HASH-ONB-TKN-007-stu901vwx234','Active','2025-07-20 10:00:00','2025-06-20 10:00:00',NULL,@Acct04),
(NEWID(),@App11,'HASH-ONB-TKN-011-yza567bcd890','Active','2025-07-20 11:00:00','2025-06-20 11:00:00',NULL,@Acct03),
(NEWID(),@App17,'HASH-ONB-TKN-017-efg123hij456','Active','2025-07-20 14:00:00','2025-06-20 14:00:00',NULL,@Acct04),
(NEWID(),@App01,'HASH-ONB-TKN-001-klm789nop012','Active','2025-07-21 08:00:00','2025-06-21 08:00:00',NULL,@Acct03),
(NEWID(),@App02,'HASH-ONB-TKN-002-qrs345tuv678','Active','2025-07-21 09:00:00','2025-06-21 09:00:00',NULL,@Acct03),
(NEWID(),@App05,'HASH-ONB-TKN-005-wxy901zab234','Active','2025-07-21 10:00:00','2025-06-21 10:00:00',NULL,@Acct04),
(NEWID(),@App08,'HASH-ONB-TKN-008-cde567fgh890','Active','2025-07-21 11:00:00','2025-06-21 11:00:00',NULL,@Acct04),
(NEWID(),@App10,'HASH-ONB-TKN-010-ijk123lmn456','Active','2025-07-22 08:00:00','2025-06-22 08:00:00',NULL,@Acct03),
(NEWID(),@App12,'HASH-ONB-TKN-012-opq789rst012','Active','2025-07-22 09:00:00','2025-06-22 09:00:00',NULL,@Acct03),
(NEWID(),@App14,'HASH-ONB-TKN-014-uvw345xyz678','Active','2025-07-22 10:00:00','2025-06-22 10:00:00',NULL,@Acct04),
(NEWID(),@App16,'HASH-ONB-TKN-016-abc901def234','Active','2025-07-22 11:00:00','2025-06-22 11:00:00',NULL,@Acct04),
(NEWID(),@App19,'HASH-ONB-TKN-019-ghi567jkl890','Active','2025-07-23 08:00:00','2025-06-23 08:00:00',NULL,@Acct03),
(NEWID(),@App20,'HASH-ONB-TKN-020-mno123pqr456','Active','2025-07-23 09:00:00','2025-06-23 09:00:00',NULL,@Acct03),
(NEWID(),@App06,'HASH-ONB-TKN-006-stu789vwx012','Active','2025-07-23 10:00:00','2025-06-23 10:00:00',NULL,@Acct04),
(NEWID(),@App09,'HASH-ONB-TKN-009-yza345bcd678','Active','2025-07-23 11:00:00','2025-06-23 11:00:00',NULL,@Acct04),
(NEWID(),@App13,'HASH-ONB-TKN-013-efg901hij234','Active','2025-07-24 08:00:00','2025-06-24 08:00:00',NULL,@Acct03),
(NEWID(),@App18,'HASH-ONB-TKN-018-klm567nop890','Active','2025-07-24 09:00:00','2025-06-24 09:00:00',NULL,@Acct03);

-- ============================================================================
-- 32. STATUTORY SYNC RECORDS (20 rows)
-- ============================================================================
INSERT INTO [StatutorySyncRecords] ([StatutorySyncRecordId],[EmployeeId],[TargetSystem],[SyncStatus],[SyncTimestamp],[ErrorMessage],[CreatedAt])
VALUES
(NEWID(),@Emp01,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp02,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp03,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp04,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp05,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp06,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp07,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp08,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp09,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp10,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp11,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp12,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp13,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp14,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp15,'FOMS','Synced','2025-06-01 08:00:00',NULL,'2025-06-01 08:00:00'),
(NEWID(),@Emp16,'FOMS','Pending','2025-06-20 08:00:00',NULL,'2025-06-20 08:00:00'),
(NEWID(),@Emp17,'FOMS','Pending','2025-06-20 08:00:00',NULL,'2025-06-20 08:00:00'),
(NEWID(),@Emp18,'FOMS','Pending','2025-06-20 08:00:00',NULL,'2025-06-20 08:00:00'),
(NEWID(),@Emp19,'FOMS','Failed','2025-06-20 08:00:00','Connection timeout to FOMS API','2025-06-20 08:00:00'),
(NEWID(),@Emp20,'FOMS','Pending','2025-06-20 08:00:00',NULL,'2025-06-20 08:00:00');

-- ============================================================================
-- 33. EMAIL QUEUE RECORDS (20 rows)
-- ============================================================================
INSERT INTO [EmailQueueRecords] ([EmailQueueRecordId],[ToEmail],[Subject],[Body],[Status],[RetryCount],[CreatedAt],[LastAttemptAt])
VALUES
(NEWID(),'john.dizon@email.com','Your Application Has Been Received','Dear John Dizon, we have received your application for Data Encoder. We will review and get back to you soon.','Sent',0,'2025-06-01 08:01:00','2025-06-01 08:02:00'),
(NEWID(),'grace.chua@email.com','Your Application Has Been Received','Dear Grace Chua, we have received your application for Data Encoder. We will review and get back to you soon.','Sent',0,'2025-06-02 09:01:00','2025-06-02 09:02:00'),
(NEWID(),'mark.rivera@email.com','Interview Invitation','Dear Mark Rivera, you are invited for an interview on June 17, 2025 at 10:00 AM.','Sent',0,'2025-06-10 09:01:00','2025-06-10 09:02:00'),
(NEWID(),'anna.garcia@email.com','Job Offer - HR Administrator','Dear Anna Garcia, we are pleased to offer you the HR Administrator position.','Sent',0,'2025-06-18 10:01:00','2025-06-18 10:02:00'),
(NEWID(),'paul.aquino@email.com','Your Application Has Been Received','Dear Paul Aquino, we have received your application for Data Encoder.','Sent',0,'2025-06-05 09:01:00','2025-06-05 09:02:00'),
(NEWID(),'diana.fernandez@email.com','Application Status Update','Dear Diana Fernandez, your application has moved to the screening stage.','Sent',0,'2025-06-12 09:01:00','2025-06-12 09:02:00'),
(NEWID(),'kevin.salazar@email.com','Interview Invitation','Dear Kevin Salazar, you are invited for a panel interview on June 19, 2025.','Sent',0,'2025-06-14 10:01:00','2025-06-14 10:02:00'),
(NEWID(),'rose.pascual@email.com','Your Application Has Been Received','Dear Rose Pascual, we have received your application for HR Administrator.','Sent',0,'2025-06-08 09:01:00','2025-06-08 09:02:00'),
(NEWID(),'james.medina@email.com','Application Status Update','Dear James Medina, your application has moved to the screening stage.','Sent',0,'2025-06-15 08:01:00','2025-06-15 08:02:00'),
(NEWID(),'cherry.bueno@email.com','Your Application Has Been Received','Dear Cherry Bueno, we have received your application for Data Encoder.','Sent',0,'2025-06-10 08:01:00','2025-06-10 08:02:00'),
(NEWID(),'ryan.ortiz@email.com','Interview Invitation','Dear Ryan Ortiz, you are invited for a technical interview on June 23, 2025.','Sent',0,'2025-06-17 10:01:00','2025-06-17 10:02:00'),
(NEWID(),'joy.vergara@email.com','Your Application Has Been Received','Dear Joy Vergara, we have received your application for Data Encoder.','Sent',0,'2025-06-12 10:01:00','2025-06-12 10:02:00'),
(NEWID(),'leo.magno@email.com','Application Status Update','Dear Leo Magno, your application has moved to the screening stage.','Sent',0,'2025-06-18 09:01:00','2025-06-18 09:02:00'),
(NEWID(),'marie.lagman@email.com','Your Application Has Been Received','Dear Marie Lagman, we have received your application for Data Encoder.','Sent',0,'2025-06-14 09:01:00','2025-06-14 09:02:00'),
(NEWID(),'carl.salvador@email.com','Job Offer - IT Specialist','Dear Carl Salvador, we are pleased to offer you the IT Specialist position.','Sent',0,'2025-06-19 11:01:00','2025-06-19 11:02:00'),
(NEWID(),'nina.herrera@email.com','Your Application Has Been Received','Dear Nina Herrera, we have received your application for Data Encoder.','Sent',0,'2025-06-16 08:01:00','2025-06-16 08:02:00'),
(NEWID(),'eric.pascual@email.com','Interview Invitation','Dear Eric Pascual, you are invited for a panel interview on June 23, 2025.','Sent',0,'2025-06-19 14:01:00','2025-06-19 14:02:00'),
(NEWID(),'liza.soriano@email.com','Application Status Update','Dear Liza Soriano, your application has moved to the screening stage.','Sent',0,'2025-06-20 08:01:00','2025-06-20 08:02:00'),
(NEWID(),'ian.mendoza@email.com','Your Application Has Been Received','Dear Ian Mendoza, we have received your application for Data Encoder.','Pending',0,'2025-06-19 08:01:00',NULL),
(NEWID(),'bea.domingo@email.com','Your Application Has Been Received','Dear Bea Domingo, we have received your application for Data Encoder.','Pending',0,'2025-06-20 09:01:00',NULL);

PRINT 'Seed data insertion completed successfully.';
GO
