using Microsoft.EntityFrameworkCore;
using OTMS.Entities.Models;
using System;

namespace OTMS.Data
{
    public class OTMSDbContext(DbContextOptions<OTMSDbContext> options) : DbContext(options)
    {
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Entities.Models.Task> Tasks { get; set; }
        public DbSet<TaskComment> TaskComments { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<EmergencyOverrideRequest> EmergencyOverrideRequests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Employee-Account one-to-one relationship
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Account)
                .WithOne(a => a.Employee)
                .HasForeignKey<Account>(a => a.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Task Relationships
            modelBuilder.Entity<Entities.Models.Task>()
                .HasOne(t => t.Creator)
                .WithMany(a => a.CreatedTasks)
                .HasForeignKey(t => t.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Entities.Models.Task>()
                .HasOne(t => t.Assignee)
                .WithMany(a => a.AssignedTasks)
                .HasForeignKey(t => t.AssignedTo)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Entities.Models.Task>()
                .HasOne(t => t.Evaluator)
                .WithMany()
                .HasForeignKey(t => t.EvaluatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // TaskComment Relationships
            modelBuilder.Entity<TaskComment>()
                .HasOne(tc => tc.Employee)
                .WithMany(e => e.Comments)
                .HasForeignKey(tc => tc.EmployeeId);

            modelBuilder.Entity<TaskComment>()
                .HasOne(tc => tc.Task)
                .WithMany(t => t.Comments)
                .HasForeignKey(tc => tc.TaskId);

            // Notifications Relationship
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Account)
                .WithMany(a => a.Notifications)
                .HasForeignKey(n => n.EmployeeId);

            // ActivityLog Relationship
            modelBuilder.Entity<ActivityLog>()
                .HasOne(a => a.Account)
                .WithMany()
                .HasForeignKey(a => a.AccountId);
            modelBuilder.Entity<ActivityLog>()
                .HasOne(al => al.Account)
                .WithMany(a => a.ActivityLogs)
                .HasForeignKey(al => al.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            // Leave Request Relationships
            modelBuilder.Entity<LeaveRequest>()
                .HasOne(lr => lr.Account)
                .WithMany(a => a.SubmittedLeaveRequests)
                .HasForeignKey(lr => lr.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LeaveRequest>()
                .HasOne(lr => lr.ApprovedByAccount)
                .WithMany(a => a.ApprovedLeaveRequests)
                .HasForeignKey(lr => lr.Approved_By)
                .OnDelete(DeleteBehavior.Restrict);

            // Emergency Override Request Relationships
            modelBuilder.Entity<EmergencyOverrideRequest>()
                .HasOne(e => e.RequestedBy)
                .WithMany(a => a.RequestedEmergencyOverrides)
                .HasForeignKey(e => e.RequestedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<EmergencyOverrideRequest>()
                .HasOne(e => e.ApprovedBy)
                .WithMany(a => a.ApprovedEmergencyOverrides)
                .HasForeignKey(e => e.ApprovedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<EmergencyOverrideRequest>()
                .HasOne(e => e.LeaveRequest)
                .WithMany()
                .HasForeignKey(e => e.LeaveId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
