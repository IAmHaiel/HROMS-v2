using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Migrations
{
    /// <inheritdoc />
    public partial class ExpandApplicantRecordFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankAccountName",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountNumber",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CivilStatus",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentResidentialAddress",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeclaredDependents",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailVerificationToken",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailVerificationTokenExpiry",
                table: "ApplicantRecords",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactMobileNumber",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactName",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactRelationship",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "ApplicantRecords",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HighestEducationalAttainment",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstitutionAndYearGraduated",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                table: "ApplicantRecords",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "ApplicantRecords",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MedicalClearanceFilePath",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MiddleName",
                table: "ApplicantRecords",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NBIClearanceFilePath",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PSABirthCertificateFilePath",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PagIBIGNumber",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PermanentAddress",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhilHealthNumber",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfessionalLicensesCertifications",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SSSNumber",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SignedEmploymentContractFilePath",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Suffix",
                table: "ApplicantRecords",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TIN",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
                name: "CivilStatus",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "CurrentResidentialAddress",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "DeclaredDependents",
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
                name: "FirstName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "HighestEducationalAttainment",
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
                name: "NBIClearanceFilePath",
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
                name: "SSSNumber",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "SignedEmploymentContractFilePath",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "Suffix",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "TIN",
                table: "ApplicantRecords");
        }
    }
}
