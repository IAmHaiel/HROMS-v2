using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployee201FileData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "LocationOrLink",
                table: "InterviewSchedules",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.CreateTable(
                name: "Employee201FileDatas",
                columns: table => new
                {
                    Employee201FileDataId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SssNumberEncrypted = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhilhealthNumberEncrypted = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PagibigNumberEncrypted = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TinNumberEncrypted = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BankNameEncrypted = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BankAccountNumberEncrypted = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmergencyContactNameEncrypted = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmergencyContactNumberEncrypted = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employee201FileDatas", x => x.Employee201FileDataId);
                    table.ForeignKey(
                        name: "FK_Employee201FileDatas_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OnboardingTokens",
                columns: table => new
                {
                    OnboardingTokenId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicantRecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnboardingTokens", x => x.OnboardingTokenId);
                    table.ForeignKey(
                        name: "FK_OnboardingTokens_Accounts_CreatedByAccountId",
                        column: x => x.CreatedByAccountId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OnboardingTokens_ApplicantRecords_ApplicantRecordId",
                        column: x => x.ApplicantRecordId,
                        principalTable: "ApplicantRecords",
                        principalColumn: "ApplicantRecordId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Employee201FileDatas_EmployeeId",
                table: "Employee201FileDatas",
                column: "EmployeeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTokens_ApplicantRecordId",
                table: "OnboardingTokens",
                column: "ApplicantRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTokens_CreatedByAccountId",
                table: "OnboardingTokens",
                column: "CreatedByAccountId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Employee201FileDatas");

            migrationBuilder.DropTable(
                name: "OnboardingTokens");

            migrationBuilder.AlterColumn<string>(
                name: "LocationOrLink",
                table: "InterviewSchedules",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }
    }
}
