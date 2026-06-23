using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskCommentAttachment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AttachmentUrl",
                table: "TaskComments",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AttachmentUrl",
                table: "TaskComments");
        }
    }
}
