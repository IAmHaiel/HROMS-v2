using System.Security.Claims;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs.Notification.Responses;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class NotificationService(
        OTMSDbContext context,
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration
        ) : INotificationService
    {
        private async Task<string> GetEmployeeEmailAsync(Guid accountId)
        {
            var account = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == accountId);
            return account?.Employee?.Email ?? string.Empty;
        }

        private async System.Threading.Tasks.Task<bool> SendEmailAsync(string toEmail, string subject, string body)
        {
            if (string.IsNullOrWhiteSpace(toEmail)) return false;

            try
            {
                var smtpServer = configuration["MailKitOptions:Server"] ?? "smtp.gmail.com";
                var smtpPort = int.TryParse(configuration["MailKitOptions:Port"], out var port) ? port : 587;
                var senderName = configuration["MailKitOptions:SenderName"] ?? "Operational Management System";
                var senderEmail = configuration["MailKitOptions:SenderEmail"] ?? "operationalmanagementsystemoms@gmail.com";
                var account = configuration["MailKitOptions:Account"] ?? "operationalmanagementsystemoms@gmail.com";
                var password = configuration["MailKitOptions:Password"] ?? "fmda mprv nlga haxq";

                using var client = new MailKit.Net.Smtp.SmtpClient();
                await client.ConnectAsync(smtpServer, smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(account, password);

                var message = new MimeKit.MimeMessage();
                message.From.Add(new MimeKit.MailboxAddress(senderName, senderEmail));
                message.To.Add(new MimeKit.MailboxAddress("", toEmail));
                message.Subject = subject;
                message.Body = new MimeKit.TextPart("html") { Text = body };

                await client.SendAsync(message);
                await client.DisconnectAsync(true);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async System.Threading.Tasks.Task CreateEmailNotificationAsync(Guid accountId, string subject, string body)
        {
            var email = await GetEmployeeEmailAsync(accountId);
            await SendEmailAsync(email, subject, body);
        }

        public async System.Threading.Tasks.Task<bool> SendEmailWithStatusAsync(string toEmail, string subject, string body)
        {
            var sent = await SendEmailAsync(toEmail, subject, body);
            if (!sent)
            {
                var queueRecord = new EmailQueueRecord
                {
                    EmailQueueRecordId = Guid.NewGuid(),
                    ToEmail = toEmail,
                    Subject = subject,
                    Body = body,
                    Status = "Pending",
                    RetryCount = 0,
                    CreatedAt = DateTime.UtcNow,
                    LastAttemptAt = DateTime.UtcNow
                };
                context.EmailQueueRecords.Add(queueRecord);
                await context.SaveChangesAsync();
            }
            return sent;
        }

        public async System.Threading.Tasks.Task DispatchApproverNotificationAsync(Guid approverAccountId, ApprovalRequest request)
        {
            var approver = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == approverAccountId);

            if (approver == null) return;

            var requester = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == request.RequesterAccountId);

            var requesterName = requester != null
                ? string.Join(" ", new[] { requester.Employee.FirstName, requester.Employee.MiddleName, requester.Employee.LastName, requester.Employee.Suffix }
                    .Where(n => !string.IsNullOrEmpty(n)))
                : "Unknown";

            var subject = $"Action Required: {request.RequestType} Request Pending Your Approval";
            var body = $@"
                <h2>Approval Request</h2>
                <p>A <strong>{request.RequestType}</strong> request requires your approval.</p>
                <p><strong>Submitted by:</strong> {requesterName}</p>
                <p><strong>Current Tier:</strong> {request.CurrentTierLevel} of {request.TotalTierCount}</p>
                <p><strong>Status:</strong> {request.StatusTrackingText ?? "Pending Approval"}</p>
                <p>Please log in to the system to review and make a decision.</p>
                <hr>
                <p><small>This is an automated notification from the Operational Task Management System.</small></p>";

            // In-app notification
            await CreateGeneralNotificationAsync(
                approverAccountId,
                NotificationTypes.ApprovalRequestPending,
                $"A new {request.RequestType} request from {requesterName} requires your approval at Tier {request.CurrentTierLevel}."
            );

            // Email notification
            await CreateEmailNotificationAsync(approverAccountId, subject, body);

            // Audit log
            await LogNotificationDispatchAsync(request.ApprovalRequestId, approverAccountId,
                NotificationTypes.ApprovalRequestPending, "InApp", "Sent");
            await LogNotificationDispatchAsync(request.ApprovalRequestId, approverAccountId,
                NotificationTypes.ApprovalRequestPending, "Email", "Sent");

            request.LastNotifiedAccountId = approverAccountId;
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task DispatchRequesterNotificationAsync(Guid requesterAccountId, ApprovalRequest request, string outcome)
        {
            var requester = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == requesterAccountId);

            if (requester == null) return;

            string subject, body;

            switch (outcome)
            {
                case "Approved":
                    subject = $"Your {request.RequestType} Request Has Been Fully Approved";
                    body = $@"
                        <h2>Request Approved</h2>
                        <p>Your <strong>{request.RequestType}</strong> request has been fully approved and processed.</p>
                        <p><strong>Submitted on:</strong> {request.CreatedAt:MM/dd/yyyy}</p>
                        <hr>
                        <p><small>This is an automated notification from the Operational Task Management System.</small></p>";
                    break;

                case "Rejected":
                    subject = $"Your {request.RequestType} Request Has Been Rejected";
                    var rejectDecision = request.Decisions
                        .OrderByDescending(d => d.TierLevel)
                        .FirstOrDefault(d => d.Decision == "Rejected");
                    body = $@"
                        <h2>Request Rejected</h2>
                        <p>Your <strong>{request.RequestType}</strong> request has been rejected.</p>
                        <p><strong>Submitted on:</strong> {request.CreatedAt:MM/dd/yyyy}</p>
                        <p><strong>Remarks:</strong> {rejectDecision?.Remarks ?? "No remarks provided."}</p>
                        <hr>
                        <p><small>This is an automated notification from the Operational Task Management System.</small></p>";
                    break;

                case "TierApproved":
                    subject = $"Your {request.RequestType} Request Has Been Approved at Tier {request.CurrentTierLevel - 1}";
                    body = $@"
                        <h2>Request Approved at Current Tier</h2>
                        <p>Your <strong>{request.RequestType}</strong> request has been approved at Tier {request.CurrentTierLevel - 1} and routed to the next level.</p>
                        <p><strong>Current Status:</strong> {request.StatusTrackingText ?? "Routed to next approver"}</p>
                        <hr>
                        <p><small>This is an automated notification from the Operational Task Management System.</small></p>";
                    break;

                default:
                    return;
            }

            // In-app notification
            var notifType = outcome switch
            {
                "Approved" => NotificationTypes.ApprovalRequestFinalApproved,
                "Rejected" => NotificationTypes.ApprovalRequestRejected,
                "TierApproved" => NotificationTypes.ApprovalTierApproved,
                _ => NotificationTypes.ApprovalRequestPending
            };

            var message = outcome switch
            {
                "Approved" => $"Your {request.RequestType} request has been fully approved and processed.",
                "Rejected" => $"Your {request.RequestType} request has been rejected.",
                "TierApproved" => $"Your {request.RequestType} request has been approved at Tier {request.CurrentTierLevel - 1} and routed to the next level.",
                _ => ""
            };

            await CreateGeneralNotificationAsync(requesterAccountId, notifType, message);
            await CreateEmailNotificationAsync(requesterAccountId, subject, body);

            await LogNotificationDispatchAsync(request.ApprovalRequestId, requesterAccountId, notifType, "InApp", "Sent");
            await LogNotificationDispatchAsync(request.ApprovalRequestId, requesterAccountId, notifType, "Email", "Sent");
        }

        public async System.Threading.Tasks.Task LogNotificationDispatchAsync(
            Guid approvalRequestId, Guid recipientId, string notificationType, string channel, string status, string? errorMessage = null)
        {
            var auditLog = new NotificationAuditLog
            {
                AuditId = Guid.NewGuid(),
                ApprovalRequestId = approvalRequestId,
                RecipientAccountId = recipientId,
                NotificationType = notificationType,
                Channel = channel,
                Status = status,
                ErrorMessage = errorMessage,
                SentAt = DateTime.UtcNow
            };

            context.NotificationAuditLogs.Add(auditLog);
            await context.SaveChangesAsync();
        }
        public async System.Threading.Tasks.Task CreateDeadlineNotificationAsync(Entities.Models.Task task)
        {
            if (!task.AssignedTo.HasValue) return;

            var notification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.AssignedTo.Value,
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskDeadlineApproaching,
                Message =
                    $"Task '{task.TaskTitle}' is nearing its deadline.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(notification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateTaskAssignedNotificationAsync(Entities.Models.Task task)
        {
            var creatorNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.CreatedBy, // EmployeeId = Creator's AccountId
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskAssigned,
                Message =
                    $"You assigned a new task: '{task.TaskTitle}' for Employee {task.Assignee.Employee.EmployeeNumber} | {string.Join(" ", new[]
                        {task.Assignee.Employee.FirstName, task.Assignee.Employee.MiddleName, task.Assignee.Employee.LastName, task.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var assigneeNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.AssignedTo.Value, // EmployeeId = Assignee's AccountId
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskAssigned,
                Message =
                    $"You were assigned a new task: '{task.TaskTitle}' by {string.Join(" ", new[]
                        {task.Creator.Employee.FirstName, task.Creator.Employee.MiddleName, task.Creator.Employee.LastName, task.Creator.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(assigneeNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CheckTaskDeadlinesAsync()
        {
            var currentDate = DateTime.UtcNow;

            var upcomingTasks = await context.Tasks
                .Where(t =>
                    t.TaskStatus != "Completed"
                    &&
                    t.DueAt.HasValue
                    &&
                    t.DueAt.Value.Date <=
                        currentDate.AddDays(1).Date
                    &&
                    t.DueAt.Value.Date >= currentDate.Date)
                .ToListAsync();

            foreach (var task in upcomingTasks)
            {
                bool notificationExists =
                    await context.Notifications.AnyAsync(n =>
                        n.TaskId == task.TaskId
                        &&
                        n.NotificationType ==
                            NotificationTypes
                                .TaskDeadlineApproaching);
                if (!notificationExists)
                {
                    await CreateDeadlineNotificationAsync(task);
                }
            }
        }

        public async System.Threading.Tasks.Task CreateTaskReviewRequestedNotificationAsync(Entities.Models.Task task)
        {
            var adminNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.CreatedBy, // Usually Ops Admin who created the task
                TaskId = task.TaskId,
                NotificationType = NotificationTypes.TaskReviewRequested,
                Message = $"Task '{task.TaskTitle}' has been submitted for your review by the assigned employee.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(adminNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateTaskReturnedForReworkNotificationAsync(Entities.Models.Task task)
        {
            if (!task.AssignedTo.HasValue) return;

            var assigneeNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.AssignedTo.Value,
                TaskId = task.TaskId,
                NotificationType = NotificationTypes.TaskReturnedForRework,
                Message = $"Task '{task.TaskTitle}' was returned for rework. Please check the task remarks.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(assigneeNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateTaskApprovedAndClosedNotificationAsync(Entities.Models.Task task)
        {
            if (!task.AssignedTo.HasValue) return;

            var assigneeNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.AssignedTo.Value,
                TaskId = task.TaskId,
                NotificationType = NotificationTypes.TaskApprovedAndClosed,
                Message = $"Task '{task.TaskTitle}' was approved and officially closed.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(assigneeNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateTaskDeletedNotificationAsync(Entities.Models.Task task)
        {
            var creatorNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.CreatedBy,
                TaskId = task.TaskId,
                NotificationType = "Task Deleted",
                Message = $"Task ref#{task.TaskReferenceNumber} '{task.TaskTitle}' was deleted.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(creatorNotification);

            if (task.AssignedTo.HasValue)
            {
                var assigneeNotification = new Notification
                {
                    NotificationId = Guid.NewGuid(),
                    EmployeeId = task.AssignedTo.Value,
                    TaskId = task.TaskId,
                    NotificationType = "Task Deleted",
                    Message = $"Task ref#{task.TaskReferenceNumber} '{task.TaskTitle}' assigned to you was deleted by an administrator.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                await context.Notifications.AddAsync(assigneeNotification);
            }

            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task<PaginationResponseDTO<NotificationResponseDTO>> GetMyNotificationsAsync(PaginationDTO request)
        {
            var accountIdClaim = httpContextAccessor
                .HttpContext?
                .User
                .FindFirst(ClaimTypes.NameIdentifier)?
                .Value;

            if (string.IsNullOrEmpty(accountIdClaim))
            {
                throw new UnauthorizedAccessException(
                    "Invalid user session.");
            }

            var accountId = Guid.Parse(accountIdClaim);

            var query = context.Notifications
                .Where(n => n.EmployeeId == accountId)
                .OrderByDescending(n => n.CreatedAt);

            var totalItems = await query.CountAsync();

            var data = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(n => new NotificationResponseDTO
                {
                    NotificationId = n.NotificationId,
                    TaskId = n.TaskId,
                    NotificationType = n.NotificationType,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                }).ToListAsync();

            var totalUnread = await context.Notifications
                .CountAsync(n => n.EmployeeId == accountId && !n.IsRead);

            return new PaginationResponseDTO<NotificationResponseDTO>
            {
                IsSuccess = true,
                Message = "Notifications retrieved successfully.",
                Data = data,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalRecords = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)request.PageSize),
                TotalUnread = totalUnread
            };

        }

        public async System.Threading.Tasks.Task<bool> MarkNotificationAsReadAsync(Guid notificationId)
        {
            var notification = await context.Notifications
                .FirstOrDefaultAsync(n =>
                    n.NotificationId == notificationId);

            if (notification == null)
            {
                return false;
            }

            notification.IsRead = true;

            await context.SaveChangesAsync();

            return true;
        }

        public async System.Threading.Tasks.Task CreateTaskUpdateNotificationAsync(Entities.Models.Task task)
        {
            var creatorNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.CreatedBy, // EmployeeId = Creator's Account ID
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskUpdated,
                Message =
                    $"You updated the task: '{task.TaskTitle}' at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(creatorNotification);

            if (task.AssignedTo.HasValue)
            {
                var assigneeNotification = new Notification
                {
                    NotificationId = Guid.NewGuid(),
                    EmployeeId = task.AssignedTo.Value,
                    TaskId = task.TaskId,
                    NotificationType = NotificationTypes.TaskUpdated,
                    Message =
                        $"{string.Join(" ", new[]
                            {task.Creator.Employee.FirstName, task.Creator.Employee.MiddleName, task.Creator.Employee.LastName, task.Creator.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the task: '{task.TaskTitle}' at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                await context.Notifications.AddAsync(assigneeNotification);
            }
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateEmployeeTaskUpdateNotificationAsync(Entities.Models.Task task)
        {
            var assigneeNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.AssignedTo.Value, // EmployeeId = Assignee's Account ID
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskUpdated,
                Message =
                    $"You updated the task: '{task.TaskTitle}', its Task Status is now {task.TaskStatus}. Updated at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var creatorNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.CreatedBy, // EmployeeId = Creator's Account ID
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskUpdated,
                Message =
                    $"{string.Join(" ", new[]
                        {task.Assignee.Employee.FirstName, task.Assignee.Employee.MiddleName, task.Assignee.Employee.LastName, task.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the task: '{task.TaskTitle}', its Task Status is now {task.TaskStatus}. Updated at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(creatorNotification);
            await context.Notifications.AddAsync(assigneeNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateCompletedTaskUpdateNotificationAsync(Entities.Models.Task task)
        {
            var assigneeNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.AssignedTo.Value, // EmployeeId = Assignee's Account ID
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskUpdated,
                Message =
                    $"You updated the task: '{task.TaskTitle}', its Task Status is now {task.TaskStatus}. It is ready for Reviewing. Updated at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var creatorNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.CreatedBy, // EmployeeId = Creator's Account ID
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskUpdated,
                Message =
                    $"{string.Join(" ", new[]
                        {task.Assignee.Employee.FirstName, task.Assignee.Employee.MiddleName, task.Assignee.Employee.LastName, task.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the task: '{task.TaskTitle}', its Task Status is now {task.TaskStatus}. It is ready for Reviewing. Updated at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(creatorNotification);
            await context.Notifications.AddAsync(assigneeNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateLeaveRequestNotificationAsync(LeaveRequest leaveRequest)
        {

            var sysAdmin = await context.Accounts
                .Include(a => a.Employee)
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Role != null && a.Role.Name == Roles.SystemAdmin);

            if (sysAdmin == null)
                throw new Exception("sysAdmin is not existing, cannot proceed.");

            var sysAdminNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = sysAdmin.AccountId,
                NotificationType =
                    NotificationTypes.LeaveRequestCreated,
                Message =
                    $"{string.Join(" ", new[]
                        {leaveRequest.Account.Employee.FirstName, leaveRequest.Account.Employee.MiddleName, leaveRequest.Account.Employee.LastName, leaveRequest.Account.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} submitted a Leave Request at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}. ",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var submitterNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = leaveRequest.AccountId,
                NotificationType =
                    NotificationTypes.LeaveRequestCreated,
                Message =
                    $"You submitted a Leave Request at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}. ",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(sysAdminNotification);
            await context.Notifications.AddAsync(submitterNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateEmergencyOverrideNotificationAsync(EmergencyOverrideRequest emergencyOverride)
        {
            var sysAdmin = await context.Accounts
               .Include(a => a.Employee)
               .Include(a => a.Role)
               .FirstOrDefaultAsync(a => a.Role != null && a.Role.Name == Roles.SystemAdmin);

            if (sysAdmin == null)
                throw new Exception("sysAdmin is not existing, cannot proceed.");

            var sysAdminNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = sysAdmin.AccountId,
                NotificationType =
                   NotificationTypes.EmergencyOverrideCreated,
                Message =
                   $"{string.Join(" ", new[]
                       {emergencyOverride.RequestedBy.Employee.FirstName, emergencyOverride.RequestedBy.Employee.MiddleName, emergencyOverride.RequestedBy.Employee.LastName, emergencyOverride.RequestedBy.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} submitted an Emergency Override Request at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}. ",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var submitterNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = emergencyOverride.RequestedById,
                NotificationType =
                    NotificationTypes.LeaveRequestCreated,
                Message =
                    $"You submitted an Emergency Override Request at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}. ",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(sysAdminNotification);
            await context.Notifications.AddAsync(submitterNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateGeneralNotificationAsync(Guid accountId, string title, string message)
        {
            var notification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = accountId,
                NotificationType = title,
                Message = message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(notification);
            await context.SaveChangesAsync();
        }
    }
}
