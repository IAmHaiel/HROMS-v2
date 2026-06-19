using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingApplicantRecordColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ─── Employee table changes (idempotent) ──────────────────────────

            // Drop legacy Education columns (with constraint cleanup)
            void DropColumnIfExists(string table, string column)
            {
                var tableEscaped = table.Replace("[", "").Replace("]", "");
                var colEscaped = column.Replace("[", "").Replace("]", "");
                migrationBuilder.Sql($@"
                    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[{tableEscaped}]') AND name = '{colEscaped}')
                    BEGIN
                        DECLARE @dc nvarchar(200);
                        SELECT @dc = dc.name
                        FROM sys.default_constraints dc
                        JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
                        WHERE c.object_id = OBJECT_ID(N'[{tableEscaped}]') AND c.name = '{colEscaped}';
                        IF @dc IS NOT NULL
                            EXEC('ALTER TABLE [{tableEscaped}] DROP CONSTRAINT [' + @dc + ']');
                        ALTER TABLE [{tableEscaped}] DROP COLUMN [{colEscaped}];
                    END
                ");
            }
            DropColumnIfExists("Employees", "EducationDegree");
            DropColumnIfExists("Employees", "EducationInstitution");
            DropColumnIfExists("Employees", "EducationIsCurrentlyEnrolled");
            DropColumnIfExists("Employees", "EducationYearGraduated");
            DropColumnIfExists("Employees", "EducationLevel");

            // Alter Email to nvarchar(450) if it's still nvarchar(max)
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM sys.columns c
                    JOIN sys.types t ON c.user_type_id = t.user_type_id
                    WHERE c.object_id = OBJECT_ID(N'[Employees]')
                      AND c.name = 'Email'
                      AND t.name = 'nvarchar'
                      AND c.max_length = -1
                )
                ALTER TABLE [Employees] ALTER COLUMN [Email] nvarchar(450) NOT NULL;
            ");

            // Add NTEDate, OffboardingDate, ResignationDate if not present
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Employees]') AND name = 'NTEDate')
                    ALTER TABLE [Employees] ADD [NTEDate] datetime2 NULL;
            ");
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Employees]') AND name = 'OffboardingDate')
                    ALTER TABLE [Employees] ADD [OffboardingDate] datetime2 NULL;
            ");
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Employees]') AND name = 'ResignationDate')
                    ALTER TABLE [Employees] ADD [ResignationDate] datetime2 NULL;
            ");

            // ─── ApplicantRecords table (idempotent add column) ──────────────

            void AddColIfMissing(string col, string type, bool notNull = false, string? maxLen = null, string? defaultVal = null)
            {
                var typeDef = maxLen != null ? $"{type}({maxLen})" : type;
                var nullable = notNull ? "NOT NULL" : "NULL";
                var def = defaultVal != null ? $"DEFAULT {defaultVal}" : notNull ? (type.StartsWith("nvarchar") ? "DEFAULT ''" : type == "bit" ? "DEFAULT 0" : "") : "";
                migrationBuilder.Sql($@"
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[ApplicantRecords]') AND name = '{col}')
                        ALTER TABLE [ApplicantRecords] ADD [{col}] {typeDef} {nullable} {def};
                ");
            }

            AddColIfMissing("Age", "int");
            AddColIfMissing("BIRForm2316FilePath", "nvarchar", maxLen: "max");
            AddColIfMissing("BankAccountName", "nvarchar", maxLen: "128");
            AddColIfMissing("BankAccountNumber", "nvarchar", maxLen: "35");
            AddColIfMissing("BankName", "nvarchar", maxLen: "128");
            AddColIfMissing("BirthDay", "int");
            AddColIfMissing("BirthMonth", "int");
            AddColIfMissing("BirthYear", "int");
            AddColIfMissing("Citizenship", "nvarchar", maxLen: "max");
            AddColIfMissing("CivilStatus", "nvarchar", maxLen: "max");
            AddColIfMissing("CurrentResidentialAddress", "nvarchar", maxLen: "256");
            AddColIfMissing("DeclaredDependents", "nvarchar", maxLen: "100");
            AddColIfMissing("Degree", "nvarchar", maxLen: "128");
            AddColIfMissing("EmailVerificationToken", "nvarchar", maxLen: "max");
            AddColIfMissing("EmailVerificationTokenExpiry", "datetime2");
            AddColIfMissing("EmergencyContactMobileNumber", "nvarchar", maxLen: "max");
            AddColIfMissing("EmergencyContactName", "nvarchar", maxLen: "100");
            AddColIfMissing("EmergencyContactRelationship", "nvarchar", maxLen: "max");
            AddColIfMissing("FatherFirstName", "nvarchar", maxLen: "50");
            AddColIfMissing("FatherLastName", "nvarchar", maxLen: "50");
            AddColIfMissing("FatherMiddleName", "nvarchar", maxLen: "50");
            AddColIfMissing("FirstName", "nvarchar", maxLen: "50", notNull: true);
            AddColIfMissing("Gender", "nvarchar", maxLen: "50");
            AddColIfMissing("HighestEducationalAttainment", "nvarchar", maxLen: "128");
            AddColIfMissing("Institution", "nvarchar", maxLen: "128");
            AddColIfMissing("InstitutionAndYearGraduated", "nvarchar", maxLen: "max");
            AddColIfMissing("IsEmailVerified", "bit", notNull: true);
            AddColIfMissing("LastName", "nvarchar", maxLen: "50", notNull: true);
            AddColIfMissing("MedicalClearanceFilePath", "nvarchar", maxLen: "max");
            AddColIfMissing("MiddleName", "nvarchar", maxLen: "50");
            AddColIfMissing("MotherFirstName", "nvarchar", maxLen: "50");
            AddColIfMissing("MotherLastName", "nvarchar", maxLen: "50");
            AddColIfMissing("MotherMiddleName", "nvarchar", maxLen: "50");
            AddColIfMissing("NBIClearanceFilePath", "nvarchar", maxLen: "max");
            AddColIfMissing("Nationality", "nvarchar", maxLen: "max");
            AddColIfMissing("PSABirthCertificateFilePath", "nvarchar", maxLen: "max");
            AddColIfMissing("PagIBIGNumber", "nvarchar", maxLen: "max");
            AddColIfMissing("PermanentAddress", "nvarchar", maxLen: "256");
            AddColIfMissing("PhilHealthNumber", "nvarchar", maxLen: "max");
            AddColIfMissing("ProfessionalLicensesCertifications", "nvarchar", maxLen: "512");
            AddColIfMissing("ReferenceNumber", "nvarchar", maxLen: "max", notNull: true);
            AddColIfMissing("SSSNumber", "nvarchar", maxLen: "max");
            AddColIfMissing("Suffix", "nvarchar", maxLen: "50");
            AddColIfMissing("TIN", "nvarchar", maxLen: "max");
            AddColIfMissing("UpdatedAt", "datetime2");
            AddColIfMissing("YearGraduated", "nvarchar", maxLen: "max");

            // ─── AssetAllocations table (idempotent) ─────────────────────────

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[AssetAllocations]') AND type = 'U')
                BEGIN
                    CREATE TABLE [AssetAllocations] (
                        [AssetAllocationId] uniqueidentifier NOT NULL,
                        [EmployeeId] uniqueidentifier NOT NULL,
                        [AssetType] nvarchar(max) NOT NULL,
                        [AssetDescription] nvarchar(max) NOT NULL,
                        [Status] nvarchar(max) NOT NULL,
                        [AllocatedAt] datetime2 NOT NULL,
                        [ReturnedAt] datetime2 NULL,
                        [ApprovedByRequestId] uniqueidentifier NULL,
                        CONSTRAINT [PK_AssetAllocations] PRIMARY KEY ([AssetAllocationId]),
                        CONSTRAINT [FK_AssetAllocations_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE
                    );
                END
            ");

            // Create unique index on Email if not exists
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE object_id = OBJECT_ID(N'[Employees]')
                      AND name = 'IX_Employees_Email'
                )
                CREATE UNIQUE INDEX [IX_Employees_Email] ON [Employees] ([Email]) WHERE [Email] IS NOT NULL;
            ");

            // Create index on AssetAllocations.EmployeeId if not exists
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE object_id = OBJECT_ID(N'[AssetAllocations]')
                      AND name = 'IX_AssetAllocations_EmployeeId'
                )
                CREATE INDEX [IX_AssetAllocations_EmployeeId] ON [AssetAllocations] ([EmployeeId]);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssetAllocations");

            migrationBuilder.DropIndex(
                name: "IX_Employees_Email",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "NTEDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "OffboardingDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ResignationDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "Age",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "BIRForm2316FilePath",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "BankAccountName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "BankAccountNumber",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "BirthDay",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "BirthMonth",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "BirthYear",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "Citizenship",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "CivilStatus",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "CurrentResidentialAddress",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "DeclaredDependents",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "Degree",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "EmailVerificationToken",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "EmailVerificationTokenExpiry",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "EmergencyContactMobileNumber",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "EmergencyContactName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "EmergencyContactRelationship",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "FatherFirstName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "FatherLastName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "FatherMiddleName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "HighestEducationalAttainment",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "Institution",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "InstitutionAndYearGraduated",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "MedicalClearanceFilePath",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "MiddleName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "MotherFirstName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "MotherLastName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "MotherMiddleName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "NBIClearanceFilePath",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "Nationality",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "PSABirthCertificateFilePath",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "PagIBIGNumber",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "PermanentAddress",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "PhilHealthNumber",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "ProfessionalLicensesCertifications",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "ReferenceNumber",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "SSSNumber",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "Suffix",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "TIN",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "YearGraduated",
                table: "ApplicantRecords");

            // Re-add EducationLevel for revert
            migrationBuilder.AddColumn<string>(
                name: "EducationLevel",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EducationDegree",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EducationInstitution",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EducationIsCurrentlyEnrolled",
                table: "Employees",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "EducationYearGraduated",
                table: "Employees",
                type: "int",
                nullable: true);

            // Revert Email type
            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
