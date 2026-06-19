using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.DTOs.TaskTemplate;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace OTMS.Service.Services
{
    public class TaskTemplateService(OTMSDbContext context, IHttpContextAccessor httpContextAccessor, IActivityLogService activityLogService, INotificationService notificationService) : ITaskTemplateService
    {
        public async Task<TaskTemplateResponseDTO> CreateTaskTemplateAsync(TaskTemplateCreationDTO request)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim)) throw new UnauthorizedAccessException("Invalid user session.");
            var loggedInAccountId = Guid.Parse(accountIdClaim);

            var template = new TaskTemplate
            {
                TemplateId = Guid.NewGuid(),
                TemplateName = request.TemplateName,
                TemplateDescription = request.TemplateDescription,
                PriorityLevel = request.PriorityLevel,
                RecurrenceType = request.RecurrenceType,
                RecurrenceStartDate = request.RecurrenceStartDate,
                AssignedEmployee = request.AssignedEmployee,
                TemplateStatus = request.TemplateStatus,
                CreatedBy = loggedInAccountId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // If the start date is in the past, trigger first generation immediately
            if (template.RecurrenceStartDate <= DateTime.UtcNow)
            {
                template.NextGenerationDate = DateTime.UtcNow;
            }
            else
            {
                template.NextGenerationDate = CalculateNextGenerationDate(template.RecurrenceStartDate, template.RecurrenceType);
            }

            await context.TaskTemplates.AddAsync(template);
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(loggedInAccountId, "Task Template Created", $"Operations Admin created task template '{template.TemplateName}'.");

            await notificationService.CreateGeneralNotificationAsync(loggedInAccountId, "Task Template Created", $"Task template '{template.TemplateName}' was created successfully.");

            return await MapToResponseDTOAsync(template.TemplateId);
        }

        public async Task<TaskTemplateResponseDTO> UpdateTaskTemplateAsync(Guid templateId, TaskTemplateUpdateDTO request)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim)) throw new UnauthorizedAccessException("Invalid user session.");
            var loggedInAccountId = Guid.Parse(accountIdClaim);

            var template = await context.TaskTemplates.FindAsync(templateId);
            if (template == null) throw new Exception("Task Template not found.");

            template.TemplateName = request.TemplateName;
            template.TemplateDescription = request.TemplateDescription;
            template.PriorityLevel = request.PriorityLevel;

            bool typeChanged = template.RecurrenceType != request.RecurrenceType;
            bool startDateChanged = template.RecurrenceStartDate != request.RecurrenceStartDate;

            if (typeChanged)
            {
                template.RecurrenceType = request.RecurrenceType;
            }

            if (startDateChanged || typeChanged)
            {
                template.RecurrenceStartDate = request.RecurrenceStartDate;
                DateTime baseDate = template.LastGeneratedDate ?? template.RecurrenceStartDate;
                template.NextGenerationDate = CalculateNextGenerationDate(baseDate, template.RecurrenceType);
            }

            template.AssignedEmployee = request.AssignedEmployee;
            template.TemplateStatus = request.TemplateStatus;
            template.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(loggedInAccountId, "Task Template Updated", $"Operations Admin updated task template '{template.TemplateName}'.");

            await notificationService.CreateGeneralNotificationAsync(loggedInAccountId, "Task Template Updated", $"Task template '{template.TemplateName}' was updated.");

            return await MapToResponseDTOAsync(template.TemplateId);
        }

        public async Task<TaskTemplateResponseDTO> ToggleTemplateStatusAsync(Guid templateId)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim)) throw new UnauthorizedAccessException("Invalid user session.");
            var loggedInAccountId = Guid.Parse(accountIdClaim);

            var template = await context.TaskTemplates.FindAsync(templateId);
            if (template == null) throw new Exception("Task Template not found.");

            template.TemplateStatus = template.TemplateStatus == "Active" ? "Inactive" : "Active";
            template.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(loggedInAccountId, "Task Template Status Toggled", $"Operations Admin changed template '{template.TemplateName}' status to {template.TemplateStatus}.");

            await notificationService.CreateGeneralNotificationAsync(loggedInAccountId, "Task Template Status Changed", $"Task template '{template.TemplateName}' is now {template.TemplateStatus}.");

            return await MapToResponseDTOAsync(template.TemplateId);
        }

        public async System.Threading.Tasks.Task DeleteTaskTemplateAsync(Guid templateId)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim)) throw new UnauthorizedAccessException("Invalid user session.");
            var loggedInAccountId = Guid.Parse(accountIdClaim);

            var template = await context.TaskTemplates.FindAsync(templateId);
            if (template == null) throw new Exception("Task Template not found.");

            context.TaskTemplates.Remove(template);
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(loggedInAccountId, "Task Template Deleted", $"Operations Admin deleted task template '{template.TemplateName}'.");
            await notificationService.CreateGeneralNotificationAsync(loggedInAccountId, "Task Template Deleted", $"Task template '{template.TemplateName}' was deleted.");
        }

        public async Task<PaginationResponseDTO<TaskTemplateResponseDTO>> GetTaskTemplatesAsync(PaginationDTO request)
        {
            var query = context.TaskTemplates
                .OrderByDescending(tt => tt.CreatedAt);

            var totalRecords = await query.CountAsync();

            var rawData = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(tt => new
                {
                    tt.TemplateId,
                    tt.TemplateName,
                    tt.TemplateDescription,
                    tt.PriorityLevel,
                    tt.RecurrenceType,
                    tt.RecurrenceStartDate,
                    tt.AssignedEmployee,
                    tt.TemplateStatus,
                    tt.NextGenerationDate,
                    tt.LastGeneratedDate,
                    tt.CreatedBy,
                    tt.CreatedAt,
                    AssigneeFirstName = tt.Assignee != null ? tt.Assignee.Employee.FirstName : null,
                    AssigneeLastName = tt.Assignee != null ? tt.Assignee.Employee.LastName : null,
                    CreatorFirstName = tt.Creator.Employee.FirstName,
                    CreatorLastName = tt.Creator.Employee.LastName,
                })
                .ToListAsync();

            var data = rawData.Select(tt => new TaskTemplateResponseDTO
            {
                TemplateId = tt.TemplateId,
                TemplateName = tt.TemplateName,
                TemplateDescription = tt.TemplateDescription,
                PriorityLevel = tt.PriorityLevel,
                RecurrenceType = tt.RecurrenceType,
                RecurrenceStartDate = tt.RecurrenceStartDate,
                AssignedEmployeeId = tt.AssignedEmployee,
                AssignedEmployeeName = tt.AssigneeFirstName != null
                    ? string.Join(" ", new[] { tt.AssigneeFirstName, tt.AssigneeLastName }.Where(n => !string.IsNullOrEmpty(n)))
                    : null,
                TemplateStatus = tt.TemplateStatus,
                NextGenerationDate = tt.NextGenerationDate,
                LastGeneratedDate = tt.LastGeneratedDate,
                CreatedBy = tt.CreatedBy,
                CreatedByName = string.Join(" ", new[] { tt.CreatorFirstName, tt.CreatorLastName }.Where(n => !string.IsNullOrEmpty(n))),
                CreatedAt = tt.CreatedAt
            }).ToList();

            return new PaginationResponseDTO<TaskTemplateResponseDTO>
            {
                Data = data,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)request.PageSize)
            };
        }

        private async Task<TaskTemplateResponseDTO> MapToResponseDTOAsync(Guid templateId)
        {
            var tt = await context.TaskTemplates
                .Include(t => t.Creator).ThenInclude(a => a.Employee)
                .Include(t => t.Assignee).ThenInclude(a => a.Employee)
                .FirstAsync(t => t.TemplateId == templateId);

            return new TaskTemplateResponseDTO
            {
                TemplateId = tt.TemplateId,
                TemplateName = tt.TemplateName,
                TemplateDescription = tt.TemplateDescription,
                PriorityLevel = tt.PriorityLevel,
                RecurrenceType = tt.RecurrenceType,
                RecurrenceStartDate = tt.RecurrenceStartDate,
                AssignedEmployeeId = tt.AssignedEmployee,
                AssignedEmployeeName = tt.Assignee != null ? string.Join(" ", new[] { tt.Assignee.Employee.FirstName, tt.Assignee.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))) : null,
                TemplateStatus = tt.TemplateStatus,
                NextGenerationDate = tt.NextGenerationDate,
                LastGeneratedDate = tt.LastGeneratedDate,
                CreatedBy = tt.CreatedBy,
                CreatedByName = string.Join(" ", new[] { tt.Creator.Employee.FirstName, tt.Creator.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))),
                CreatedAt = tt.CreatedAt
            };
        }

        private DateTime CalculateNextGenerationDate(DateTime baseDate, string recurrenceType)
        {
            // If baseDate is in the past, calculate the next future date based on recurrence
            var nextDate = baseDate;
            var now = DateTime.UtcNow;

            if (nextDate <= now)
            {
                while (nextDate <= now)
                {
                    nextDate = recurrenceType switch
                    {
                        "Daily" => nextDate.AddDays(1),
                        "Weekly" => nextDate.AddDays(7),
                        "Monthly" => nextDate.AddMonths(1),
                        _ => nextDate.AddDays(1)
                    };
                }
            }
            return nextDate;
        }
    }
}
