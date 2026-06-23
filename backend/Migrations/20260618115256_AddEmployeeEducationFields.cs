using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeEducationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EducationDegree",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EducationInstitution",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EducationIsCurrentlyEnrolled",
                table: "Employees",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "EducationLevel",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EducationYearGraduated",
                table: "Employees",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EducationDegree",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EducationInstitution",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EducationIsCurrentlyEnrolled",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EducationLevel",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EducationYearGraduated",
                table: "Employees");
        }
    }
}
