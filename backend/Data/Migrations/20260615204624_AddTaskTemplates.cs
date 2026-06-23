using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TaskTemplateId",
                table: "Tasks",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TaskTemplates",
                columns: table => new
                {
                    TemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TemplateName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    TemplateDescription = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    PriorityLevel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecurrenceType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecurrenceStartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AssignedEmployee = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TemplateStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NextGenerationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastGeneratedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskTemplates", x => x.TemplateId);
                    table.ForeignKey(
                        name: "FK_TaskTemplates_Accounts_AssignedEmployee",
                        column: x => x.AssignedEmployee,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TaskTemplates_Accounts_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_TaskTemplateId",
                table: "Tasks",
                column: "TaskTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskTemplates_AssignedEmployee",
                table: "TaskTemplates",
                column: "AssignedEmployee");

            migrationBuilder.CreateIndex(
                name: "IX_TaskTemplates_CreatedBy",
                table: "TaskTemplates",
                column: "CreatedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_TaskTemplates_TaskTemplateId",
                table: "Tasks",
                column: "TaskTemplateId",
                principalTable: "TaskTemplates",
                principalColumn: "TemplateId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_TaskTemplates_TaskTemplateId",
                table: "Tasks");

            migrationBuilder.DropTable(
                name: "TaskTemplates");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_TaskTemplateId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "TaskTemplateId",
                table: "Tasks");
        }
    }
}
