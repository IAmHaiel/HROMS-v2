using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Approval.Responses;
using OTMS.Entities.DTOs.Dashboard;
using OTMS.Entities.DTOs.Dashboard.Responses;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class WorkloadDashboardService(
        OTMSDbContext context,
        IApprovalRoutingEngine approvalEngine,
        IActivityLogService activityLogService
        ) : IWorkloadDashboardService
    {
        public async Task<ApiResponseDTO<DashboardResponseDTO>> GetWorkloadDashboardAsync(DashboardFilterDTO filter, Guid accountId)
        {
            var query = context.Tasks
                .Include(t => t.Assignee)
                .ThenInclude(a => a!.Employee)
                .Where(t => !t.Deleted && !t.PermanentlyDeleted && t.AssignedTo != null);

            // Apply Filters
            if (filter.DateRangeStart.HasValue)
            {
                query = query.Where(t => t.CreatedAt >= filter.DateRangeStart.Value);
            }

            if (filter.DateRangeEnd.HasValue)
            {
                query = query.Where(t => t.CreatedAt <= filter.DateRangeEnd.Value);
            }

            if (filter.EmployeeId.HasValue)
            {
                query = query.Where(t => t.Assignee != null && t.Assignee.EmployeeId == filter.EmployeeId.Value);
            }

            if (filter.DepartmentId.HasValue)
            {
                query = query.Where(t => t.Assignee != null && t.Assignee.Employee.DepartmentId == filter.DepartmentId.Value);
            }

            if (!string.IsNullOrEmpty(filter.TaskStatus))
            {
                query = query.Where(t => t.TaskStatus == filter.TaskStatus);
            }

            var tasks = await query.ToListAsync();

            if (!tasks.Any())
            {
                return new ApiResponseDTO<DashboardResponseDTO>
                {
                    IsSuccess = false,
                    Message = "No workload data available.",
                    Data = null
                };
            }

            var response = new DashboardResponseDTO();

            // Calculate Totals
            response.TotalTasksAssigned = tasks.Count;

            // "Active" = Not "Completed" and Not "Done"
            bool IsActive(string status) => status != "Completed" && status != "Done";
            
            // "Completed" = "Completed" or "Done"
            bool IsCompleted(string status) => status == "Completed" || status == "Done";

            response.TotalActiveTasks = tasks.Count(t => IsActive(t.TaskStatus));
            response.TotalCompletedTasks = tasks.Count(t => IsCompleted(t.TaskStatus));
            
            // "Overdue" = Active and DueAt < Now
            response.TotalOverdueTasks = tasks.Count(t => IsActive(t.TaskStatus) && t.DueAt.HasValue && t.DueAt.Value < DateTime.UtcNow);

            // Employee Workload Distribution
            var employeeGroups = tasks.GroupBy(t => t.Assignee!.Employee);

            foreach (var group in employeeGroups)
            {
                var employeeTasks = group.ToList();
                var emp = group.Key;
                var employeeName = string.Join(" ", new[] { emp.FirstName, emp.MiddleName, emp.LastName, emp.Suffix }.Where(n => !string.IsNullOrEmpty(n)));

                response.EmployeeWorkloadDistribution.Add(new EmployeeWorkloadDTO
                {
                    EmployeeId = emp.EmployeeId,
                    EmployeeName = employeeName,
                    TotalAssigned = employeeTasks.Count,
                    ActiveTasks = employeeTasks.Count(t => IsActive(t.TaskStatus)),
                    CompletedTasks = employeeTasks.Count(t => IsCompleted(t.TaskStatus)),
                    OverdueTasks = employeeTasks.Count(t => IsActive(t.TaskStatus) && t.DueAt.HasValue && t.DueAt.Value < DateTime.UtcNow)
                });
            }

            // Average Tasks Per Employee
            if (response.EmployeeWorkloadDistribution.Any())
            {
                response.AverageTasksPerEmployee = (double)response.TotalTasksAssigned / response.EmployeeWorkloadDistribution.Count;
                // Optional: round to 2 decimal places
                response.AverageTasksPerEmployee = Math.Round(response.AverageTasksPerEmployee, 2);
            }

            // Task Assignment Distribution
            response.TaskAssignmentDistribution = tasks
                .GroupBy(t => t.TaskStatus)
                .ToDictionary(g => g.Key, g => g.Count());

            await activityLogService.LogActivityAsync(accountId, ActivityTypes.DashboardViewed, "Workload dashboard accessed");

            return new ApiResponseDTO<DashboardResponseDTO>
            {
                IsSuccess = true,
                Message = "Dashboard statistics generated.",
                Data = response
            };
        }

        public async Task<ApiResponseDTO<List<WorkflowTrackerDTO>>> GetEmployeeWorkflowTrackersAsync(Guid accountId)
        {
            return await approvalEngine.GetMyTrackersAsync(accountId);
        }

        public async Task<ApiResponseDTO<List<EmployeeFilterDTO>>> GetFilterEmployeesAsync()
        {
            var employeeData = await context.Employees
                .Where(e => e.Account != null && e.EmploymentStatus == "Active")
                .OrderBy(e => e.LastName)
                .ToListAsync();

            var employees = employeeData.Select(e => new EmployeeFilterDTO
            {
                EmployeeId = e.EmployeeId,
                EmployeeName = string.Join(" ", new[] { e.FirstName, e.MiddleName, e.LastName, e.Suffix }.Where(n => !string.IsNullOrEmpty(n)))
            }).ToList();

            return new ApiResponseDTO<List<EmployeeFilterDTO>>
            {
                IsSuccess = true,
                Message = employees.Any() ? "Employees retrieved." : "No employees available.",
                Data = employees
            };
        }

        public async Task<ApiResponseDTO<List<DepartmentFilterDTO>>> GetFilterDepartmentsAsync()
        {
            var departments = await context.Departments
                .Where(d => d.IsActive)
                .OrderBy(d => d.Name)
                .Select(d => new DepartmentFilterDTO
                {
                    DepartmentId = d.DepartmentId,
                    DepartmentName = d.Name
                })
                .ToListAsync();

            return new ApiResponseDTO<List<DepartmentFilterDTO>>
            {
                IsSuccess = true,
                Message = departments.Any() ? "Departments retrieved." : "No departments available.",
                Data = departments
            };
        }
    }
}
