using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskFSMAndOverrides : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "AssignedTo",
                table: "Tasks",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "TaskId1",
                table: "TaskReopenRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AdminOverrideRecords",
                columns: table => new
                {
                    OverrideId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AdminId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OverrideReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    AdminRemarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ApprovalConfirmation = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminOverrideRecords", x => x.OverrideId);
                    table.ForeignKey(
                        name: "FK_AdminOverrideRecords_Accounts_AdminId",
                        column: x => x.AdminId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AdminOverrideRecords_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "TaskId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskStatusRecords",
                columns: table => new
                {
                    RecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CurrentStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequestedStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChangeDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsSuccessful = table.Column<bool>(type: "bit", nullable: false),
                    FailureReason = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskStatusRecords", x => x.RecordId);
                    table.ForeignKey(
                        name: "FK_TaskStatusRecords_Accounts_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskStatusRecords_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "TaskId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskReopenRequests_TaskId1",
                table: "TaskReopenRequests",
                column: "TaskId1");

            migrationBuilder.CreateIndex(
                name: "IX_AdminOverrideRecords_AdminId",
                table: "AdminOverrideRecords",
                column: "AdminId");

            migrationBuilder.CreateIndex(
                name: "IX_AdminOverrideRecords_TaskId",
                table: "AdminOverrideRecords",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskStatusRecords_TaskId",
                table: "TaskStatusRecords",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskStatusRecords_UpdatedBy",
                table: "TaskStatusRecords",
                column: "UpdatedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskReopenRequests_Tasks_TaskId1",
                table: "TaskReopenRequests",
                column: "TaskId1",
                principalTable: "Tasks",
                principalColumn: "TaskId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskReopenRequests_Tasks_TaskId1",
                table: "TaskReopenRequests");

            migrationBuilder.DropTable(
                name: "AdminOverrideRecords");

            migrationBuilder.DropTable(
                name: "TaskStatusRecords");

            migrationBuilder.DropIndex(
                name: "IX_TaskReopenRequests_TaskId1",
                table: "TaskReopenRequests");

            migrationBuilder.DropColumn(
                name: "TaskId1",
                table: "TaskReopenRequests");

            migrationBuilder.AlterColumn<Guid>(
                name: "AssignedTo",
                table: "Tasks",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);
        }
    }
}
