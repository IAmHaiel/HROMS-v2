using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OTMS.Data;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace OTMS.Service.Services
{
    public class TaskTemplateSchedulingService : BackgroundService
    {
        private readonly ILogger<TaskTemplateSchedulingService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public TaskTemplateSchedulingService(ILogger<TaskTemplateSchedulingService> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("TaskTemplateSchedulingService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("TaskTemplateSchedulingService is running.");
                
                await ProcessTaskTemplatesAsync(stoppingToken);

                // Run every 5 minutes
                await System.Threading.Tasks.Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }

            _logger.LogInformation("TaskTemplateSchedulingService is stopping.");
        }

        private async System.Threading.Tasks.Task ProcessTaskTemplatesAsync(CancellationToken stoppingToken)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<OTMSDbContext>();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var activityLogService = scope.ServiceProvider.GetRequiredService<IActivityLogService>();
                var dashboardNotificationService = scope.ServiceProvider.GetRequiredService<IDashboardNotificationService>();

                var now = DateTime.UtcNow;

                var activeTemplates = await context.TaskTemplates
                    .Include(t => t.Creator)
                        .ThenInclude(a => a.Employee)
                    .Include(t => t.Assignee)
                        .ThenInclude(a => a.Employee)
                    .Where(t => t.TemplateStatus == "Active" && t.NextGenerationDate <= now)
                    .ToListAsync(stoppingToken);

                foreach (var template in activeTemplates)
                {
                    try
                    {
                        // Check if a task was already generated recently to prevent duplicate generation.
                        // We assume uniqueness based on TaskTemplateId and the LastGeneratedDate being in the current interval.
                        bool alreadyGenerated = template.LastGeneratedDate.HasValue && 
                            template.LastGeneratedDate.Value > now.AddMinutes(-5);

                        if (alreadyGenerated)
                        {
                            continue;
                        }

                        // Generate unique task reference number
                        var refNo = await GenerateTaskReferenceNumberAsync(context);

                        // Generate new Task
                        var newTask = new Entities.Models.Task
                        {
                            TaskId = Guid.NewGuid(),
                            TaskTemplateId = template.TemplateId,
                            TaskTitle = template.TemplateName,
                            TaskDescription = template.TemplateDescription,
                            Priority = template.PriorityLevel,
                            TaskStatus = template.AssignedEmployee.HasValue ? "Assigned" : "Draft",
                            AssignedTo = template.AssignedEmployee,
                            CreatedBy = template.CreatedBy,
                            TaskReferenceNumber = refNo,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                            };

                        await context.Tasks.AddAsync(newTask);

                        // Log Task Status (Initial state)
                        var statusRecord = new TaskStatusRecord
                        {
                            RecordId = Guid.NewGuid(),
                            TaskId = newTask.TaskId,
                            CurrentStatus = "None",
                            RequestedStatus = "Draft",
                            ChangeDate = DateTime.UtcNow,
                            UpdatedBy = template.CreatedBy, // System generation, but logged under template creator
                            IsSuccessful = true
                        };
                        await context.TaskStatusRecords.AddAsync(statusRecord);

                        if (newTask.TaskStatus == "Assigned")
                        {
                            var assignedStatusRecord = new TaskStatusRecord
                            {
                                RecordId = Guid.NewGuid(),
                                TaskId = newTask.TaskId,
                                CurrentStatus = "Draft",
                                RequestedStatus = "Assigned",
                                ChangeDate = DateTime.UtcNow.AddSeconds(1),
                                UpdatedBy = template.CreatedBy,
                                IsSuccessful = true
                            };
                            await context.TaskStatusRecords.AddAsync(assignedStatusRecord);
                        }

                        // Update template generated dates
                        template.LastGeneratedDate = DateTime.UtcNow;
                        template.NextGenerationDate = CalculateNextGenerationDate(template.NextGenerationDate ?? now, template.RecurrenceType);
                        
                        // We must save changes here so NotificationService has the task and its relations properly attached
                        // or we can attach the creator/assignee manually for notification.
                        newTask.Creator = template.Creator;
                        if (template.Assignee != null)
                        {
                            newTask.Assignee = template.Assignee;
                        }

                        await context.SaveChangesAsync(stoppingToken);

                        // Send Notification if assigned
                        if (newTask.AssignedTo.HasValue)
                        {
                            // Create notification logic without depending on HttpContext
                            // The notification logic in NotificationService might require saving again.
                            await notificationService.CreateTaskAssignedNotificationAsync(newTask);
                        }

                        // Notify connected clients to refresh their dashboards and task lists
                        await dashboardNotificationService.NotifyDashboardDataChangedAsync();

                        // Log Activity
                        await activityLogService.LogActivityAsync(
                            template.CreatedBy, 
                            "Scheduled Task Generated", 
                            $"System automatically generated task '{newTask.TaskTitle}' from template.");

                        _logger.LogInformation($"Successfully generated task from template {template.TemplateId}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Failed to generate task from template {template.TemplateId}");
                        // Log failed generation attempt for admin review
                        await activityLogService.LogActivityAsync(
                            template.CreatedBy, 
                            "Scheduled Task Generation Failed", 
                            $"System failed to automatically generate task from template '{template.TemplateName}'. Error: {ex.Message}");
                    }
                }
            }
        }

        private DateTime CalculateNextGenerationDate(DateTime baseDate, string recurrenceType)
        {
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

        private static async System.Threading.Tasks.Task<string> GenerateTaskReferenceNumberAsync(Data.OTMSDbContext context)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            string refNo;
            do
            {
                refNo = new string(Enumerable.Range(0, 8).Select(_ => chars[random.Next(chars.Length)]).ToArray());
            }
            while (await context.Tasks.AnyAsync(t => t.TaskReferenceNumber == refNo));
            return refNo;
        }
    }
}
