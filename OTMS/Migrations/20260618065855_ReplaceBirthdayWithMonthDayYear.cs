using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OTMS.Migrations
{
    public partial class ReplaceBirthdayWithMonthDayYear : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BirthMonth",
                table: "ApplicantRecords",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BirthDay",
                table: "ApplicantRecords",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BirthYear",
                table: "ApplicantRecords",
                type: "int",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "BirthMonth", table: "ApplicantRecords");
            migrationBuilder.DropColumn(name: "BirthDay", table: "ApplicantRecords");
            migrationBuilder.DropColumn(name: "BirthYear", table: "ApplicantRecords");
        }
    }
}
