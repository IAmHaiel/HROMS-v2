using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddRecruitmentAndScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ApplicantRecords",
                columns: table => new
                {
                    ApplicantRecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmailAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    JobPositionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResumeFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicantRecords", x => x.ApplicantRecordId);
                    table.ForeignKey(
                        name: "FK_ApplicantRecords_JobPositions_JobPositionId",
                        column: x => x.JobPositionId,
                        principalTable: "JobPositions",
                        principalColumn: "JobPositionId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EmailQueueRecords",
                columns: table => new
                {
                    EmailQueueRecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ToEmail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RetryCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastAttemptAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailQueueRecords", x => x.EmailQueueRecordId);
                });

            migrationBuilder.CreateTable(
                name: "ApplicantStatusRecords",
                columns: table => new
                {
                    ApplicantStatusRecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicantRecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OldStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NewStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicantStatusRecords", x => x.ApplicantStatusRecordId);
                    table.ForeignKey(
                        name: "FK_ApplicantStatusRecords_Accounts_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ApplicantStatusRecords_ApplicantRecords_ApplicantRecordId",
                        column: x => x.ApplicantRecordId,
                        principalTable: "ApplicantRecords",
                        principalColumn: "ApplicantRecordId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewSchedules",
                columns: table => new
                {
                    InterviewScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicantRecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InterviewDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    InterviewTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LocationOrLink = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    InterviewerName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewSchedules", x => x.InterviewScheduleId);
                    table.ForeignKey(
                        name: "FK_InterviewSchedules_ApplicantRecords_ApplicantRecordId",
                        column: x => x.ApplicantRecordId,
                        principalTable: "ApplicantRecords",
                        principalColumn: "ApplicantRecordId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApplicantRecords_JobPositionId",
                table: "ApplicantRecords",
                column: "JobPositionId");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicantStatusRecords_ApplicantRecordId",
                table: "ApplicantStatusRecords",
                column: "ApplicantRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicantStatusRecords_UpdatedById",
                table: "ApplicantStatusRecords",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewSchedules_ApplicantRecordId",
                table: "InterviewSchedules",
                column: "ApplicantRecordId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApplicantStatusRecords");

            migrationBuilder.DropTable(
                name: "EmailQueueRecords");

            migrationBuilder.DropTable(
                name: "InterviewSchedules");

            migrationBuilder.DropTable(
                name: "ApplicantRecords");
        }
    }
}
