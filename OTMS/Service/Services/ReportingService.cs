using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Reporting;
using OTMS.Entities.DTOs.Reporting.Responses;
using OTMS.Service.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
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
                if (group.Key == null) continue;
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
                ActivityTypes.ReportGeneration,
                "Generated Task Completion Report."
            );

            return new ApiResponseDTO<TaskCompletionReportDTO>
            {
                IsSuccess = true,
                Message = "Report generated successfully.",
                Data = report
            };
        }

        public async Task<ApiResponseDTO<OperationalSummaryReportDTO>> GetOperationalSummaryPreviewAsync(OperationalSummaryReportFilterDTO filter)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim))
                throw new UnauthorizedAccessException("Invalid user session.");

            if (filter.DateRangeStart > filter.DateRangeEnd)
            {
                return new ApiResponseDTO<OperationalSummaryReportDTO>
                {
                    IsSuccess = false,
                    Message = "Invalid date range selected. Start date must not be later than end date.",
                    Data = null
                };
            }

            var query = context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                        .ThenInclude(e => e.Department)
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                        .ThenInclude(e => e.JobPosition)
                            .ThenInclude(jp => jp.Department)
                .Where(t => !t.Deleted && !t.PermanentlyDeleted)
                .AsQueryable();

            query = query.Where(t => t.CreatedAt.Date >= filter.DateRangeStart.Date && t.CreatedAt.Date <= filter.DateRangeEnd.Date);

            if (filter.DepartmentId.HasValue)
                query = query.Where(t => t.Assignee != null && t.Assignee.Employee.DepartmentId == filter.DepartmentId.Value);

            if (filter.EmployeeId.HasValue)
                query = query.Where(t => t.AssignedTo == filter.EmployeeId.Value);

            var tasks = await query.ToListAsync();

            if (!tasks.Any())
            {
                return new ApiResponseDTO<OperationalSummaryReportDTO>
                {
                    IsSuccess = false,
                    Message = "No records found for selected criteria.",
                    Data = null
                };
            }

            var report = new OperationalSummaryReportDTO
            {
                TotalTasks = tasks.Count,
                CompletedTasks = tasks.Count(t => t.TaskStatus == "Completed"),
                PendingTasks = tasks.Count(t => t.TaskStatus != "Completed"),
                OverdueTasks = tasks.Count(t => t.DueAt.HasValue && t.DueAt.Value < DateTime.UtcNow && t.TaskStatus != "Completed")
            };

            if (report.TotalTasks > 0)
                report.TaskCompletionRate = (double)report.CompletedTasks / report.TotalTasks * 100.0;

            var employeeGroups = tasks.GroupBy(t => t.Assignee);
            foreach (var group in employeeGroups)
            {
                if (group.Key?.Employee == null) continue;
                var employee = group.Key.Employee;
                var name = string.Join(" ", new[] { employee.FirstName, employee.MiddleName, employee.LastName, employee.Suffix }.Where(n => !string.IsNullOrEmpty(n)));
                var total = group.Count();
                var completed = group.Count(t => t.TaskStatus == "Completed");
                var overdue = group.Count(t => t.DueAt.HasValue && t.DueAt.Value < DateTime.UtcNow && t.TaskStatus != "Completed");

                report.EmployeePerformanceSummary.Add(new OperationalEmployeePerformanceDTO
                {
                    EmployeeName = name,
                    Assigned = total,
                    Completed = completed,
                    Overdue = overdue,
                    CompletionRate = total > 0 ? (double)completed / total * 100.0 : 0
                });
            }

            var categoryGroups = tasks.GroupBy(t => t.TaskCategory ?? "Uncategorized");
            foreach (var group in categoryGroups)
            {
                report.WorkloadByCategory.Add(new WorkloadDistributionDTO
                {
                    CategoryName = group.Key,
                    TaskCount = group.Count(),
                    Percentage = (double)group.Count() / report.TotalTasks * 100.0
                });
            }

            var deptGroups = tasks.GroupBy(t => t.Assignee?.Employee?.Department?.Name
                ?? t.Assignee?.Employee?.JobPosition?.Department?.Name
                ?? "Unassigned");
            foreach (var group in deptGroups)
            {
                report.WorkloadByDepartment.Add(new WorkloadDistributionDTO
                {
                    CategoryName = group.Key,
                    TaskCount = group.Count(),
                    Percentage = (double)group.Count() / report.TotalTasks * 100.0
                });
            }

            var priorityGroups = tasks.GroupBy(t => t.Priority);
            foreach (var group in priorityGroups)
            {
                report.WorkloadByPriority.Add(new WorkloadDistributionDTO
                {
                    CategoryName = group.Key,
                    TaskCount = group.Count(),
                    Percentage = (double)group.Count() / report.TotalTasks * 100.0
                });
            }

            await activityLogService.LogActivityAsync(
                Guid.Parse(accountIdClaim),
                ActivityTypes.ReportGeneration,
                "Viewed Operational Summary Report preview.");

            return new ApiResponseDTO<OperationalSummaryReportDTO>
            {
                IsSuccess = true,
                Message = "Report generated successfully.",
                Data = report
            };
        }

        public async Task<(byte[] FileBytes, string ContentType, string FileName)> GenerateOperationalSummaryDownloadAsync(OperationalSummaryReportFilterDTO filter)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim))
                throw new UnauthorizedAccessException("Invalid user session.");
            var loggedInAccountId = Guid.Parse(accountIdClaim);

            var result = await GetOperationalSummaryPreviewAsync(filter);
            if (!result.IsSuccess || result.Data == null)
                throw new InvalidOperationException(result.Message ?? "No data available for the selected criteria.");

            var report = result.Data;
            var format = filter.ReportFormat?.ToUpperInvariant() ?? "PDF";

            byte[] fileBytes;
            string contentType;
            string fileName;

            if (format == "EXCEL")
            {
                fileBytes = GenerateExcelReport(report);
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                fileName = $"OperationalSummaryReport_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            }
            else
            {
                fileBytes = GeneratePdfReport(report);
                contentType = "application/pdf";
                fileName = $"OperationalSummaryReport_{DateTime.UtcNow:yyyyMMdd_HHmmss}.pdf";
            }

            await activityLogService.LogActivityAsync(
                loggedInAccountId,
                ActivityTypes.ReportGeneration,
                $"Generated Operational Summary Report in {format} format."
            );

            return (fileBytes, contentType, fileName);
        }

        private byte[] GeneratePdfReport(OperationalSummaryReportDTO report)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(c => ComposeHeader(c, "Operational Summary Report"));
                    page.Content().Element(c => ComposePdfContent(c, report));
                    page.Footer().AlignCenter().Text(text =>
                    {
                        text.Span("Page ");
                        text.CurrentPageNumber();
                    });
                });
            }).GeneratePdf();
        }

        private void ComposeHeader(IContainer container, string title)
        {
            container.Column(column =>
            {
                column.Item().Text(title)
                    .FontSize(18).Bold().FontColor(Colors.Blue.Darken3);

                column.Item().Text($"Generated: {DateTime.UtcNow:MMMM dd, yyyy HH:mm} UTC")
                    .FontSize(9).FontColor(Colors.Grey.Darken1);
            });
        }

        private void ComposePdfContent(IContainer container, OperationalSummaryReportDTO report)
        {
            container.Column(column =>
            {
                column.Spacing(15);

                column.Item().Element(c => ComposeSummaryCards(c, report));

                column.Item().Element(c => ComposeEmployeePerformanceTable(c, report));

                column.Item().Element(c => ComposeWorkloadTable(c, "Workload by Category", report.WorkloadByCategory));
                column.Item().Element(c => ComposeWorkloadTable(c, "Workload by Department", report.WorkloadByDepartment));
                column.Item().Element(c => ComposeWorkloadTable(c, "Workload by Priority", report.WorkloadByPriority));
            });
        }

        private void ComposeSummaryCards(IContainer container, OperationalSummaryReportDTO report)
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.RelativeColumn();
                    columns.RelativeColumn();
                    columns.RelativeColumn();
                    columns.RelativeColumn();
                });

                table.Header(header =>
                {
                    header.Cell().Background(Colors.Blue.Darken3).Padding(5)
                        .Text("Total Tasks").FontColor(Colors.White).Bold().FontSize(9).AlignCenter();
                    header.Cell().Background(Colors.Green.Darken2).Padding(5)
                        .Text("Completed").FontColor(Colors.White).Bold().FontSize(9).AlignCenter();
                    header.Cell().Background(Colors.Orange.Darken2).Padding(5)
                        .Text("Pending").FontColor(Colors.White).Bold().FontSize(9).AlignCenter();
                    header.Cell().Background(Colors.Red.Darken2).Padding(5)
                        .Text("Overdue").FontColor(Colors.White).Bold().FontSize(9).AlignCenter();
                    header.Cell().Background(Colors.Teal.Darken2).Padding(5)
                        .Text("Completion Rate").FontColor(Colors.White).Bold().FontSize(9).AlignCenter();
                });

                table.Cell().Border(1).Padding(5).AlignCenter().Text(report.TotalTasks.ToString());
                table.Cell().Border(1).Padding(5).AlignCenter().Text(report.CompletedTasks.ToString());
                table.Cell().Border(1).Padding(5).AlignCenter().Text(report.PendingTasks.ToString());
                table.Cell().Border(1).Padding(5).AlignCenter().Text(report.OverdueTasks.ToString());
                table.Cell().Border(1).Padding(5).AlignCenter().Text($"{report.TaskCompletionRate:F1}%");
            });
        }

        private void ComposeEmployeePerformanceTable(IContainer container, OperationalSummaryReportDTO report)
        {
            container.Column(col =>
            {
                col.Item().PaddingBottom(5).Text("Employee Performance Summary")
                    .FontSize(13).Bold();

                if (report.EmployeePerformanceSummary.Count == 0)
                {
                    col.Item().Text("No data available.").Italic().FontColor(Colors.Grey.Darken1);
                    return;
                }

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3);
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Blue.Darken3).Padding(4)
                            .Text("Employee").FontColor(Colors.White).Bold().FontSize(9);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(4)
                            .Text("Assigned").FontColor(Colors.White).Bold().FontSize(9).AlignCenter();
                        header.Cell().Background(Colors.Blue.Darken3).Padding(4)
                            .Text("Completed").FontColor(Colors.White).Bold().FontSize(9).AlignCenter();
                        header.Cell().Background(Colors.Blue.Darken3).Padding(4)
                            .Text("Overdue").FontColor(Colors.White).Bold().FontSize(9).AlignCenter();
                        header.Cell().Background(Colors.Blue.Darken3).Padding(4)
                            .Text("Rate").FontColor(Colors.White).Bold().FontSize(9).AlignCenter();
                    });

                    foreach (var emp in report.EmployeePerformanceSummary)
                    {
                        table.Cell().Border(1).Padding(4).Text(emp.EmployeeName).FontSize(9);
                        table.Cell().Border(1).Padding(4).AlignCenter().Text(emp.Assigned.ToString()).FontSize(9);
                        table.Cell().Border(1).Padding(4).AlignCenter().Text(emp.Completed.ToString()).FontSize(9);
                        table.Cell().Border(1).Padding(4).AlignCenter().Text(emp.Overdue.ToString()).FontSize(9);
                        table.Cell().Border(1).Padding(4).AlignCenter().Text($"{emp.CompletionRate:F1}%").FontSize(9);
                    }
                });
            });
        }

        private void ComposeWorkloadTable(IContainer container, string title, List<WorkloadDistributionDTO> data)
        {
            container.Column(col =>
            {
                col.Item().PaddingBottom(5).Text(title)
                    .FontSize(13).Bold();

                if (data.Count == 0)
                {
                    col.Item().Text("No data available.").Italic().FontColor(Colors.Grey.Darken1);
                    return;
                }

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3);
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Teal.Darken2).Padding(4)
                            .Text("Name").FontColor(Colors.White).Bold().FontSize(9);
                        header.Cell().Background(Colors.Teal.Darken2).Padding(4)
                            .Text("Count").FontColor(Colors.White).Bold().FontSize(9).AlignCenter();
                        header.Cell().Background(Colors.Teal.Darken2).Padding(4)
                            .Text("Percentage").FontColor(Colors.White).Bold().FontSize(9).AlignCenter();
                    });

                    foreach (var item in data)
                    {
                        table.Cell().Border(1).Padding(4).Text(item.CategoryName).FontSize(9);
                        table.Cell().Border(1).Padding(4).AlignCenter().Text(item.TaskCount.ToString()).FontSize(9);
                        table.Cell().Border(1).Padding(4).AlignCenter().Text($"{item.Percentage:F1}%").FontSize(9);
                    }
                });
            });
        }

        private byte[] GenerateExcelReport(OperationalSummaryReportDTO report)
        {
            using var workbook = new XLWorkbook();

            // Summary Sheet
            var summarySheet = workbook.Worksheets.Add("Summary");
            summarySheet.Cell("A1").Value = "Operational Summary Report";
            summarySheet.Cell("A1").Style.Font.Bold = true;
            summarySheet.Cell("A1").Style.Font.FontSize = 16;
            summarySheet.Range("A1:E1").Merge();

            summarySheet.Cell("A3").Value = "Metric";
            summarySheet.Cell("B3").Value = "Value";
            summarySheet.Range("A3:B3").Style.Font.Bold = true;
            summarySheet.Range("A3:B3").Style.Fill.BackgroundColor = XLColor.BlueGray;
            summarySheet.Range("A3:B3").Style.Font.FontColor = XLColor.White;

            summarySheet.Cell("A4").Value = "Total Tasks";
            summarySheet.Cell("B4").Value = report.TotalTasks;
            summarySheet.Cell("A5").Value = "Completed Tasks";
            summarySheet.Cell("B5").Value = report.CompletedTasks;
            summarySheet.Cell("A6").Value = "Pending Tasks";
            summarySheet.Cell("B6").Value = report.PendingTasks;
            summarySheet.Cell("A7").Value = "Overdue Tasks";
            summarySheet.Cell("B7").Value = report.OverdueTasks;
            summarySheet.Cell("A8").Value = "Completion Rate";
            summarySheet.Cell("B8").Value = $"{report.TaskCompletionRate:F1}%";

            summarySheet.Columns().AdjustToContents();

            // Employee Performance Sheet
            var empSheet = workbook.Worksheets.Add("Employee Performance");
            empSheet.Cell("A1").Value = "Employee";
            empSheet.Cell("B1").Value = "Assigned";
            empSheet.Cell("C1").Value = "Completed";
            empSheet.Cell("D1").Value = "Overdue";
            empSheet.Cell("E1").Value = "Completion Rate";
            empSheet.Range("A1:E1").Style.Font.Bold = true;
            empSheet.Range("A1:E1").Style.Fill.BackgroundColor = XLColor.BlueGray;
            empSheet.Range("A1:E1").Style.Font.FontColor = XLColor.White;

            for (int i = 0; i < report.EmployeePerformanceSummary.Count; i++)
            {
                var emp = report.EmployeePerformanceSummary[i];
                var row = i + 2;
                empSheet.Cell(row, 1).Value = emp.EmployeeName;
                empSheet.Cell(row, 2).Value = emp.Assigned;
                empSheet.Cell(row, 3).Value = emp.Completed;
                empSheet.Cell(row, 4).Value = emp.Overdue;
                empSheet.Cell(row, 5).Value = $"{emp.CompletionRate:F1}%";
            }

            empSheet.Columns().AdjustToContents();

            // Workload by Category Sheet
            WriteWorkloadSheet(workbook, "By Category", report.WorkloadByCategory);
            // Workload by Department Sheet
            WriteWorkloadSheet(workbook, "By Department", report.WorkloadByDepartment);
            // Workload by Priority Sheet
            WriteWorkloadSheet(workbook, "By Priority", report.WorkloadByPriority);

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        private static void WriteWorkloadSheet(XLWorkbook workbook, string sheetName, List<WorkloadDistributionDTO> data)
        {
            var sheet = workbook.Worksheets.Add(sheetName);
            sheet.Cell("A1").Value = "Category Name";
            sheet.Cell("B1").Value = "Task Count";
            sheet.Cell("C1").Value = "Percentage";
            sheet.Range("A1:C1").Style.Font.Bold = true;
            sheet.Range("A1:C1").Style.Fill.BackgroundColor = XLColor.BlueGray;
            sheet.Range("A1:C1").Style.Font.FontColor = XLColor.White;

            for (int i = 0; i < data.Count; i++)
            {
                var item = data[i];
                var row = i + 2;
                sheet.Cell(row, 1).Value = item.CategoryName;
                sheet.Cell(row, 2).Value = item.TaskCount;
                sheet.Cell(row, 3).Value = $"{item.Percentage:F1}%";
            }

            sheet.Columns().AdjustToContents();
        }
    }
}
