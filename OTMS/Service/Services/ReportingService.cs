using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Reporting;
using OTMS.Entities.DTOs.Reporting.Responses;
using OTMS.Service.Interfaces;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace OTMS.Service.Services
{
    public class ReportingService(OTMSDbContext context, IHttpContextAccessor httpContextAccessor, IActivityLogService activityLogService) : IReportingService
    {
        public async Task<ApiResponseDTO<TaskCompletionReportDTO>> GenerateTaskCompletionReportAsync(TaskCompletionReportFilterDTO filter)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim))
            {
                throw new UnauthorizedAccessException("Invalid user session.");
            }
            var loggedInAccountId = Guid.Parse(accountIdClaim);

            if (filter.DateRangeStart > filter.DateRangeEnd)
            {
                return new ApiResponseDTO<TaskCompletionReportDTO>
                {
                    IsSuccess = false,
                    Message = "Invalid date range selected. Start date must not be later than end date.",
                    Data = null
                };
            }

            // Apply Filters
            var query = context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Where(t => !t.Deleted && !t.PermanentlyDeleted)
                .AsQueryable();

            // Note: Depending on business logic, we might filter by CreatedAt or DueAt or UpdatedAt.
            // Requirement specifies "Date Range", usually meaning when the task was created or due. Let's use CreatedAt.
            query = query.Where(t => t.CreatedAt.Date >= filter.DateRangeStart.Date && t.CreatedAt.Date <= filter.DateRangeEnd.Date);

            if (filter.EmployeeId.HasValue)
            {
                query = query.Where(t => t.AssignedTo == filter.EmployeeId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.TaskPriorityLevel))
            {
                query = query.Where(t => t.Priority == filter.TaskPriorityLevel);
            }

            if (!string.IsNullOrWhiteSpace(filter.TaskStatus))
            {
                query = query.Where(t => t.TaskStatus == filter.TaskStatus);
            }

            if (!string.IsNullOrWhiteSpace(filter.TaskCategory))
            {
                query = query.Where(t => t.TaskCategory == filter.TaskCategory);
            }

            var tasks = await query.ToListAsync();

            if (!tasks.Any())
            {
                return new ApiResponseDTO<TaskCompletionReportDTO>
                {
                    IsSuccess = false,
                    Message = "No records found for selected criteria.",
                    Data = null
                };
            }

            var report = new TaskCompletionReportDTO
            {
                TotalTasksAssigned = tasks.Count,
                TotalTasksCompleted = tasks.Count(t => t.TaskStatus == "Completed"),
                TotalTasksInProgress = tasks.Count(t => t.TaskStatus == "In Progress"),
                TotalTasksPendingReview = tasks.Count(t => t.TaskStatus == "Done"),
                TotalOverdueTasks = tasks.Count(t => t.DueAt.HasValue && t.DueAt.Value < DateTime.UtcNow && t.TaskStatus != "Completed")
            };

            if (report.TotalTasksAssigned > 0)
            {
                report.TaskCompletionRate = (double)report.TotalTasksCompleted / report.TotalTasksAssigned * 100.0;
            }

            var completedTasksWithTime = tasks.Where(t => t.TaskStatus == "Completed" && t.UpdatedAt.HasValue).ToList();
            if (completedTasksWithTime.Any())
            {
                double totalHours = completedTasksWithTime.Sum(t => (t.UpdatedAt!.Value - t.CreatedAt).TotalHours);
                report.AverageTaskCompletionTimeHours = totalHours / completedTasksWithTime.Count;
            }

            // Employee Performance Summary
            var employeeGroups = tasks.GroupBy(t => t.Assignee);

            foreach (var group in employeeGroups)
            {
                var employee = group.Key.Employee;
                var employeeName = string.Join(" ", new[] { employee.FirstName, employee.MiddleName, employee.LastName, employee.Suffix }.Where(n => !string.IsNullOrEmpty(n)));

                var totalAssigned = group.Count();
                var totalCompleted = group.Count(t => t.TaskStatus == "Completed");
                var completionRate = totalAssigned > 0 ? (double)totalCompleted / totalAssigned * 100.0 : 0;

                var completedWithTime = group.Where(t => t.TaskStatus == "Completed" && t.UpdatedAt.HasValue).ToList();
                double avgHours = 0;
                if (completedWithTime.Any())
                {
                    avgHours = completedWithTime.Sum(t => (t.UpdatedAt!.Value - t.CreatedAt).TotalHours) / completedWithTime.Count;
                }

                report.EmployeePerformanceSummary.Add(new EmployeePerformanceDTO
                {
                    EmployeeName = employeeName,
                    TotalAssigned = totalAssigned,
                    TotalCompleted = totalCompleted,
                    CompletionRate = completionRate,
                    AverageCompletionTimeHours = avgHours
                });
            }

            await activityLogService.LogActivityAsync(
                loggedInAccountId,
                "Report Generation",
                "Generated Task Completion Report."
            );

            return new ApiResponseDTO<TaskCompletionReportDTO>
            {
                IsSuccess = true,
                Message = "Report generated successfully.",
                Data = report
            };
        }
    }
}
