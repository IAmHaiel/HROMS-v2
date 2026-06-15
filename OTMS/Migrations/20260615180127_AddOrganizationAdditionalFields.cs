using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationAdditionalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "JobPositions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "EffectiveDate",
                table: "JobPositions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "EmploymentType",
                table: "JobPositions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "JobPositions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PositionLevel",
                table: "JobPositions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ReportsToId",
                table: "JobPositions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Departments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "EffectiveDate",
                table: "Departments",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "HeadEmployeeId",
                table: "Departments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Departments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_JobPositions_ReportsToId",
                table: "JobPositions",
                column: "ReportsToId");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_HeadEmployeeId",
                table: "Departments",
                column: "HeadEmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Departments_Employees_HeadEmployeeId",
                table: "Departments",
                column: "HeadEmployeeId",
                principalTable: "Employees",
                principalColumn: "EmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobPositions_JobPositions_ReportsToId",
                table: "JobPositions",
                column: "ReportsToId",
                principalTable: "JobPositions",
                principalColumn: "JobPositionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Departments_Employees_HeadEmployeeId",
                table: "Departments");

            migrationBuilder.DropForeignKey(
                name: "FK_JobPositions_JobPositions_ReportsToId",
                table: "JobPositions");

            migrationBuilder.DropIndex(
                name: "IX_JobPositions_ReportsToId",
                table: "JobPositions");

            migrationBuilder.DropIndex(
                name: "IX_Departments_HeadEmployeeId",
                table: "Departments");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "JobPositions");

            migrationBuilder.DropColumn(
                name: "EffectiveDate",
                table: "JobPositions");

            migrationBuilder.DropColumn(
                name: "EmploymentType",
                table: "JobPositions");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "JobPositions");

            migrationBuilder.DropColumn(
                name: "PositionLevel",
                table: "JobPositions");

            migrationBuilder.DropColumn(
                name: "ReportsToId",
                table: "JobPositions");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Departments");

            migrationBuilder.DropColumn(
                name: "EffectiveDate",
                table: "Departments");

            migrationBuilder.DropColumn(
                name: "HeadEmployeeId",
                table: "Departments");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Departments");
        }
    }
}
