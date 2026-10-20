using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SildraSupport.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketAuthenticationAndRequester : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Channel",
                table: "Tickets",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Portal");

            migrationBuilder.AddColumn<Guid>(
                name: "RequesterId",
                table: "Tickets",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_RequesterId",
                table: "Tickets",
                column: "RequesterId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_Users_RequesterId",
                table: "Tickets",
                column: "RequesterId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_Users_RequesterId",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_RequesterId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Channel",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "RequesterId",
                table: "Tickets");
        }
    }
}
