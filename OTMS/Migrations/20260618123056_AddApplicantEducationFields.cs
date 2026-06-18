using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicantEducationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Degree",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HighestEducationalAttainment",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Institution",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "YearGraduated",
                table: "ApplicantRecords",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Degree",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "HighestEducationalAttainment",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "Institution",
                table: "ApplicantRecords");

            migrationBuilder.DropColumn(
                name: "YearGraduated",
                table: "ApplicantRecords");
        }
    }
}
