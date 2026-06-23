SET QUOTED_IDENTIFIER ON;
GO

-- 1. DEPARTMENTS
IF NOT EXISTS (SELECT 1 FROM Departments WHERE Code = 'OPS')
INSERT INTO Departments (DepartmentId, Name, Description, Code, IsActive, EffectiveDate, CreatedAt)
VALUES (NEWID(), 'Operations', 'Core courier and logistics operations', 'OPS', 1, GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM Departments WHERE Code = 'HR')
INSERT INTO Departments (DepartmentId, Name, Description, Code, IsActive, EffectiveDate, CreatedAt)
VALUES (NEWID(), 'Human Resources', 'HR and recruitment management', 'HR', 1, GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM Departments WHERE Code = 'FIN')
INSERT INTO Departments (DepartmentId, Name, Description, Code, IsActive, EffectiveDate, CreatedAt)
VALUES (NEWID(), 'Finance', 'Financial operations and accounting', 'FIN', 1, GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM Departments WHERE Code = 'IT')
INSERT INTO Departments (DepartmentId, Name, Description, Code, IsActive, EffectiveDate, CreatedAt)
VALUES (NEWID(), 'Information Technology', 'IT support and system administration', 'IT', 1, GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM Departments WHERE Code = 'SM')
INSERT INTO Departments (DepartmentId, Name, Description, Code, IsActive, EffectiveDate, CreatedAt)
VALUES (NEWID(), 'Sales & Marketing', 'Sales and marketing operations', 'SM', 1, GETUTCDATE(), GETUTCDATE());
GO

-- 2. JOB POSITIONS
IF NOT EXISTS (SELECT 1 FROM JobPositions WHERE Code = 'OPS-MGR')
INSERT INTO JobPositions (JobPositionId, DepartmentId, Title, Description, Code, IsActive, EmploymentType, PositionLevel, EffectiveDate, CreatedAt)
VALUES (NEWID(), (SELECT DepartmentId FROM Departments WHERE Code = 'OPS'), 'Operations Manager', 'Manages daily courier operations', 'OPS-MGR', 1, 'Full-Time', 'Manager', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM JobPositions WHERE Code = 'OPS-SUP')
INSERT INTO JobPositions (JobPositionId, DepartmentId, Title, Description, Code, IsActive, EmploymentType, PositionLevel, EffectiveDate, CreatedAt)
VALUES (NEWID(), (SELECT DepartmentId FROM Departments WHERE Code = 'OPS'), 'Operations Supervisor', 'Supervises courier teams', 'OPS-SUP', 1, 'Full-Time', 'Supervisor', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM JobPositions WHERE Code = 'COORD')
INSERT INTO JobPositions (JobPositionId, DepartmentId, Title, Description, Code, IsActive, EmploymentType, PositionLevel, EffectiveDate, CreatedAt)
VALUES (NEWID(), (SELECT DepartmentId FROM Departments WHERE Code = 'OPS'), 'Coordinator', 'Coordinates deliveries and tasks', 'COORD', 1, 'Full-Time', 'Staff', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM JobPositions WHERE Code = 'ENCODER')
INSERT INTO JobPositions (JobPositionId, DepartmentId, Title, Description, Code, IsActive, EmploymentType, PositionLevel, EffectiveDate, CreatedAt)
VALUES (NEWID(), (SELECT DepartmentId FROM Departments WHERE Code = 'OPS'), 'Data Encoder', 'Encodes shipment and delivery data', 'ENCODER', 1, 'Full-Time', 'Staff', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM JobPositions WHERE Code = 'HR-MGR')
INSERT INTO JobPositions (JobPositionId, DepartmentId, Title, Description, Code, IsActive, EmploymentType, PositionLevel, EffectiveDate, CreatedAt)
VALUES (NEWID(), (SELECT DepartmentId FROM Departments WHERE Code = 'HR'), 'HR Manager', 'Manages HR operations', 'HR-MGR', 1, 'Full-Time', 'Manager', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM JobPositions WHERE Code = 'HR-STAFF')
INSERT INTO JobPositions (JobPositionId, DepartmentId, Title, Description, Code, IsActive, EmploymentType, PositionLevel, EffectiveDate, CreatedAt)
VALUES (NEWID(), (SELECT DepartmentId FROM Departments WHERE Code = 'HR'), 'HR Staff', 'HR administrative staff', 'HR-STAFF', 1, 'Full-Time', 'Staff', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM JobPositions WHERE Code = 'FIN-MGR')
INSERT INTO JobPositions (JobPositionId, DepartmentId, Title, Description, Code, IsActive, EmploymentType, PositionLevel, EffectiveDate, CreatedAt)
VALUES (NEWID(), (SELECT DepartmentId FROM Departments WHERE Code = 'FIN'), 'Finance Manager', 'Manages financial operations', 'FIN-MGR', 1, 'Full-Time', 'Manager', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM JobPositions WHERE Code = 'IT-DEV')
INSERT INTO JobPositions (JobPositionId, DepartmentId, Title, Description, Code, IsActive, EmploymentType, PositionLevel, EffectiveDate, CreatedAt)
VALUES (NEWID(), (SELECT DepartmentId FROM Departments WHERE Code = 'IT'), 'IT Developer', 'Develops and maintains systems', 'IT-DEV', 1, 'Full-Time', 'Staff', GETUTCDATE(), GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM JobPositions WHERE Code = 'SM-MGR')
INSERT INTO JobPositions (JobPositionId, DepartmentId, Title, Description, Code, IsActive, EmploymentType, PositionLevel, EffectiveDate, CreatedAt)
VALUES (NEWID(), (SELECT DepartmentId FROM Departments WHERE Code = 'SM'), 'Sales Manager', 'Manages sales and marketing', 'SM-MGR', 1, 'Full-Time', 'Manager', GETUTCDATE(), GETUTCDATE());
GO
