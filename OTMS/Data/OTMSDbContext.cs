using System;
using Microsoft.EntityFrameworkCore;
using OTMS.Entities.Models;

namespace OTMS.Data
{
    public class OTMSDbContext(DbContextOptions<OTMSDbContext> options) : DbContext(options)
    {
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Entities.Models.Task> Tasks { get; set; }
        public DbSet<TaskComment> TaskComments { get; set; }
        public DbSet<TaskReopenRequest> TaskReopenRequests { get; set; }
        public DbSet<TaskStatusRecord> TaskStatusRecords { get; set; }
        public DbSet<AdminOverrideRecord> AdminOverrideRecords { get; set; }
        public DbSet<TaskTemplate> TaskTemplates { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<EmergencyOverrideRequest> EmergencyOverrideRequests { get; set; }
        public DbSet<EmployeeAttachment> EmployeeAttachments { get; set; }

        public DbSet<Department> Departments { get; set; }
        public DbSet<JobPosition> JobPositions { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<ApprovalRoutingMatrix> ApprovalRoutingMatrices { get; set; }
        public DbSet<ApprovalTier> ApprovalTiers { get; set; }
        public DbSet<ApprovalRequest> ApprovalRequests { get; set; }
        public DbSet<ApprovalDecision> ApprovalDecisions { get; set; }
        public DbSet<NotificationAuditLog> NotificationAuditLogs { get; set; }
        public DbSet<ApplicantRecord> ApplicantRecords { get; set; }
        public DbSet<ApplicantStatusRecord> ApplicantStatusRecords { get; set; }
        public DbSet<InterviewSchedule> InterviewSchedules { get; set; }
        public DbSet<EmailQueueRecord> EmailQueueRecords { get; set; }
        public DbSet<OnboardingToken> OnboardingTokens { get; set; }
        public DbSet<Employee201FileData> Employee201FileDatas { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Employee-Account one-to-one relationship
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Account)
                .WithOne(a => a.Employee)
                .HasForeignKey<Account>(a => a.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Employee-EmployeeAttachment one-to-many relationship
            modelBuilder.Entity<EmployeeAttachment>()
                .HasOne(ea => ea.Employee)
                .WithMany(e => e.Attachments)
                .HasForeignKey(ea => ea.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Department Relationships
            modelBuilder.Entity<Department>()
                .HasMany(d => d.JobPositions)
                .WithOne(jp => jp.Department)
                .HasForeignKey(jp => jp.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Department>()
                .HasMany(d => d.Employees)
                .WithOne(e => e.Department)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // JobPosition Relationships
            modelBuilder.Entity<JobPosition>()
                .HasMany(jp => jp.Employees)
                .WithOne(e => e.JobPosition)
                .HasForeignKey(e => e.JobPositionId)
                .OnDelete(DeleteBehavior.SetNull);

            // Role Relationships
            modelBuilder.Entity<Account>()
                .HasOne(a => a.Role)
                .WithMany(r => r.Accounts)
                .HasForeignKey(a => a.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RolePermission>()
                .HasKey(rp => new { rp.RoleId, rp.PermissionId });

            modelBuilder.Entity<RolePermission>()
                .HasOne(rp => rp.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RolePermission>()
                .HasOne(rp => rp.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(rp => rp.PermissionId)
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

            // TaskReopenRequest Relationships
            modelBuilder.Entity<TaskReopenRequest>()
                .HasKey(tr => tr.RequestId);

            modelBuilder.Entity<TaskReopenRequest>()
                .HasOne(tr => tr.Task)
                .WithMany()
                .HasForeignKey(tr => tr.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskReopenRequest>()
                .HasOne(tr => tr.RequestedBy)
                .WithMany()
                .HasForeignKey(tr => tr.RequestedById)
                .OnDelete(DeleteBehavior.Restrict);

            // TaskStatusRecord Relationships
            modelBuilder.Entity<TaskStatusRecord>()
                .HasOne(tsr => tsr.Task)
                .WithMany(t => t.StatusRecords)
                .HasForeignKey(tsr => tsr.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskStatusRecord>()
                .HasOne(tsr => tsr.Updater)
                .WithMany(a => a.TaskStatusUpdates)
                .HasForeignKey(tsr => tsr.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // AdminOverrideRecord Relationships
            modelBuilder.Entity<AdminOverrideRecord>()
                .HasOne(aor => aor.Task)
                .WithMany(t => t.OverrideRecords)
                .HasForeignKey(aor => aor.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AdminOverrideRecord>()
                .HasOne(aor => aor.Admin)
                .WithMany(a => a.AdminOverrides)
                .HasForeignKey(aor => aor.AdminId)
                .OnDelete(DeleteBehavior.Restrict);

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

            // Task Template Relationships
            modelBuilder.Entity<TaskTemplate>()
                .HasOne(tt => tt.Creator)
                .WithMany(a => a.CreatedTaskTemplates)
                .HasForeignKey(tt => tt.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskTemplate>()
                .HasOne(tt => tt.Assignee)
                .WithMany(a => a.AssignedTaskTemplates)
                .HasForeignKey(tt => tt.AssignedEmployee)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Entities.Models.Task>()
                .HasOne(t => t.TaskTemplate)
                .WithMany(tt => tt.GeneratedTasks)
                .HasForeignKey(t => t.TaskTemplateId)
                .OnDelete(DeleteBehavior.SetNull);

            // Approval Routing Matrix -> ApprovalTier
            modelBuilder.Entity<ApprovalRoutingMatrix>()
                .HasMany(rm => rm.Tiers)
                .WithOne(t => t.RoutingMatrix)
                .HasForeignKey(t => t.RoutingMatrixId)
                .OnDelete(DeleteBehavior.Cascade);

            // ApprovalRequest -> Requester
            modelBuilder.Entity<ApprovalRequest>()
                .HasOne(ar => ar.Requester)
                .WithMany()
                .HasForeignKey(ar => ar.RequesterAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            // ApprovalRequest -> CurrentApprover
            modelBuilder.Entity<ApprovalRequest>()
                .HasOne(ar => ar.CurrentApprover)
                .WithMany()
                .HasForeignKey(ar => ar.CurrentApproverAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            // ApprovalRequest -> ApprovalDecision
            modelBuilder.Entity<ApprovalRequest>()
                .HasMany(ar => ar.Decisions)
                .WithOne(d => d.ApprovalRequest)
                .HasForeignKey(d => d.ApprovalRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            // ApprovalDecision -> Approver
            modelBuilder.Entity<ApprovalDecision>()
                .HasOne(d => d.Approver)
                .WithMany()
                .HasForeignKey(d => d.ApproverAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            // NotificationAuditLog -> ApprovalRequest
            modelBuilder.Entity<NotificationAuditLog>()
                .HasOne(n => n.ApprovalRequest)
                .WithMany()
                .HasForeignKey(n => n.ApprovalRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            // NotificationAuditLog -> Recipient
            modelBuilder.Entity<NotificationAuditLog>()
                .HasOne(n => n.Recipient)
                .WithMany()
                .HasForeignKey(n => n.RecipientAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            // ApplicantRecord -> JobPosition
            modelBuilder.Entity<ApplicantRecord>()
                .HasOne(ar => ar.JobPosition)
                .WithMany()
                .HasForeignKey(ar => ar.JobPositionId)
                .OnDelete(DeleteBehavior.Restrict);

            // ApplicantRecord -> StatusHistory
            modelBuilder.Entity<ApplicantRecord>()
                .HasMany(ar => ar.StatusHistory)
                .WithOne(asr => asr.ApplicantRecord)
                .HasForeignKey(asr => asr.ApplicantRecordId)
                .OnDelete(DeleteBehavior.Cascade);

            // ApplicantStatusRecord -> Updater
            modelBuilder.Entity<ApplicantStatusRecord>()
                .HasOne(asr => asr.Updater)
                .WithMany()
                .HasForeignKey(asr => asr.UpdatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // InterviewSchedule -> ApplicantRecord
            modelBuilder.Entity<InterviewSchedule>()
                .HasOne(i => i.ApplicantRecord)
                .WithMany()
                .HasForeignKey(i => i.ApplicantRecordId)
                .OnDelete(DeleteBehavior.Cascade);

            // OnboardingToken -> ApplicantRecord
            modelBuilder.Entity<OnboardingToken>()
                .HasOne(ot => ot.ApplicantRecord)
                .WithMany()
                .HasForeignKey(ot => ot.ApplicantRecordId)
                .OnDelete(DeleteBehavior.Cascade);

            // OnboardingToken -> CreatedByAccount
            modelBuilder.Entity<OnboardingToken>()
                .HasOne(ot => ot.CreatedByAccount)
                .WithMany()
                .HasForeignKey(ot => ot.CreatedByAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            // Employee201FileData -> Employee (1:1)
            modelBuilder.Entity<Employee201FileData>()
                .HasOne(e => e.Employee)
                .WithOne()
                .HasForeignKey<Employee201FileData>(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
