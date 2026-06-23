using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowTrackingAndNotificationAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LastNotifiedAccountId",
                table: "ApprovalRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StatusTrackingText",
                table: "ApprovalRequests",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalTierCount",
                table: "ApprovalRequests",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "NotificationAuditLogs",
                columns: table => new
                {
                    AuditId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApprovalRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipientAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NotificationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Channel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationAuditLogs", x => x.AuditId);
                    table.ForeignKey(
                        name: "FK_NotificationAuditLogs_Accounts_RecipientAccountId",
                        column: x => x.RecipientAccountId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NotificationAuditLogs_ApprovalRequests_ApprovalRequestId",
                        column: x => x.ApprovalRequestId,
                        principalTable: "ApprovalRequests",
                        principalColumn: "ApprovalRequestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationAuditLogs_ApprovalRequestId",
                table: "NotificationAuditLogs",
                column: "ApprovalRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationAuditLogs_RecipientAccountId",
                table: "NotificationAuditLogs",
                column: "RecipientAccountId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NotificationAuditLogs");

            migrationBuilder.DropColumn(
                name: "LastNotifiedAccountId",
                table: "ApprovalRequests");

            migrationBuilder.DropColumn(
                name: "StatusTrackingText",
                table: "ApprovalRequests");

            migrationBuilder.DropColumn(
                name: "TotalTierCount",
                table: "ApprovalRequests");
        }
    }
}
