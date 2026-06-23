using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovalRoutingEngine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ApprovalRequests",
                columns: table => new
                {
                    ApprovalRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SourceEntityType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SourceEntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequesterAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CurrentTierLevel = table.Column<int>(type: "int", nullable: false),
                    CurrentApproverAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalRequests", x => x.ApprovalRequestId);
                    table.ForeignKey(
                        name: "FK_ApprovalRequests_Accounts_CurrentApproverAccountId",
                        column: x => x.CurrentApproverAccountId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ApprovalRequests_Accounts_RequesterAccountId",
                        column: x => x.RequesterAccountId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ApprovalRoutingMatrices",
                columns: table => new
                {
                    RoutingMatrixId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalRoutingMatrices", x => x.RoutingMatrixId);
                });

            migrationBuilder.CreateTable(
                name: "ApprovalDecisions",
                columns: table => new
                {
                    ApprovalDecisionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApprovalRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TierLevel = table.Column<int>(type: "int", nullable: false),
                    ApproverAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Decision = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalDecisions", x => x.ApprovalDecisionId);
                    table.ForeignKey(
                        name: "FK_ApprovalDecisions_Accounts_ApproverAccountId",
                        column: x => x.ApproverAccountId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ApprovalDecisions_ApprovalRequests_ApprovalRequestId",
                        column: x => x.ApprovalRequestId,
                        principalTable: "ApprovalRequests",
                        principalColumn: "ApprovalRequestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ApprovalTiers",
                columns: table => new
                {
                    TierId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoutingMatrixId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TierLevel = table.Column<int>(type: "int", nullable: false),
                    ApproverRole = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FallbackApproverRole = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsFinalTier = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalTiers", x => x.TierId);
                    table.ForeignKey(
                        name: "FK_ApprovalTiers_ApprovalRoutingMatrices_RoutingMatrixId",
                        column: x => x.RoutingMatrixId,
                        principalTable: "ApprovalRoutingMatrices",
                        principalColumn: "RoutingMatrixId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalDecisions_ApprovalRequestId",
                table: "ApprovalDecisions",
                column: "ApprovalRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalDecisions_ApproverAccountId",
                table: "ApprovalDecisions",
                column: "ApproverAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalRequests_CurrentApproverAccountId",
                table: "ApprovalRequests",
                column: "CurrentApproverAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalRequests_RequesterAccountId",
                table: "ApprovalRequests",
                column: "RequesterAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalTiers_RoutingMatrixId",
                table: "ApprovalTiers",
                column: "RoutingMatrixId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApprovalDecisions");

            migrationBuilder.DropTable(
                name: "ApprovalTiers");

            migrationBuilder.DropTable(
                name: "ApprovalRequests");

            migrationBuilder.DropTable(
                name: "ApprovalRoutingMatrices");
        }
    }
}
