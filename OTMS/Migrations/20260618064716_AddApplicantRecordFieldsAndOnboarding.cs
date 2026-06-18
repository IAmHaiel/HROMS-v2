using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicantRecordFieldsAndOnboarding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SignedEmploymentContractFilePath",
                table: "ApplicantRecords",
                newName: "Nationality");

            migrationBuilder.AddColumn<int>(
                name: "Age",
                table: "ApplicantRecords",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BIRForm2316FilePath",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Birthday",
                table: "ApplicantRecords",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Citizenship",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FatherFirstName",
                table: "ApplicantRecords",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FatherLastName",
                table: "ApplicantRecords",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FatherMiddleName",
                table: "ApplicantRecords",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotherFirstName",
                table: "ApplicantRecords",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotherLastName",
                table: "ApplicantRecords",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotherMiddleName",
                table: "ApplicantRecords",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Age",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "BIRForm2316FilePath",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "Birthday",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "Citizenship",
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
                name: "MotherFirstName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "MotherLastName",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "MotherMiddleName",
                table: "ApplicantRecords");

            migrationBuilder.RenameColumn(
                name: "Nationality",
                table: "ApplicantRecords",
                newName: "SignedEmploymentContractFilePath");
        }
    }
}
