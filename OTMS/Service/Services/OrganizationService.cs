using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs.Organization;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class OrganizationService(OTMSDbContext context) : IOrganizationService
    {
        public async Task<List<DepartmentResponseDTO>> GetAllDepartmentsAsync()
        {
            var depts = await context.Departments
                .Include(d => d.HeadEmployee)
                .Include(d => d.Employees)
                .ToListAsync();
            return depts.Select(d => new DepartmentResponseDTO
            {
                DepartmentId = d.DepartmentId,
                Name = d.Name,
                Description = d.Description,
                Code = d.Code,
                IsActive = d.IsActive,
                EffectiveDate = d.EffectiveDate,
                HeadEmployeeId = d.HeadEmployeeId,
                HeadEmployeeName = d.HeadEmployee != null ? $"{d.HeadEmployee.FirstName} {d.HeadEmployee.LastName}".Trim() : null,
                EmployeeCount = d.Employees.Count
            }).ToList();
        }

        public async Task<DepartmentResponseDTO> CreateDepartmentAsync(CreateDepartmentDTO request)
        {
            if (await context.Departments.AnyAsync(d => d.Name == request.Name))
                throw new InvalidOperationException("Department already exists.");

            var dept = new Department
            {
                DepartmentId = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description ?? string.Empty,
                Code = request.Code,
                IsActive = request.ResolvedIsActive,
                EffectiveDate = request.ResolvedEffectiveDate,
                HeadEmployeeId = request.HeadEmployeeId
            };

            context.Departments.Add(dept);
            await context.SaveChangesAsync();

            if (dept.HeadEmployeeId.HasValue)
            {
                await context.Entry(dept).Reference(d => d.HeadEmployee).LoadAsync();
            }

            return new DepartmentResponseDTO
            {
                DepartmentId = dept.DepartmentId,
                Name = dept.Name,
                Description = dept.Description,
                Code = dept.Code,
                IsActive = dept.IsActive,
                EffectiveDate = dept.EffectiveDate,
                HeadEmployeeId = dept.HeadEmployeeId,
                HeadEmployeeName = dept.HeadEmployee != null ? $"{dept.HeadEmployee.FirstName} {dept.HeadEmployee.LastName}".Trim() : null,
                EmployeeCount = 0
            };
        }

        public async Task<DepartmentResponseDTO> UpdateDepartmentAsync(Guid id, CreateDepartmentDTO request)
        {
            var dept = await context.Departments
                .Include(d => d.HeadEmployee)
                .Include(d => d.Employees)
                .FirstOrDefaultAsync(d => d.DepartmentId == id);
            if (dept == null) throw new KeyNotFoundException("Department not found.");

            if (dept.Name != request.Name && await context.Departments.AnyAsync(d => d.Name == request.Name))
                throw new InvalidOperationException("Department with that name already exists.");

            dept.Name = request.Name;
            dept.Description = request.Description ?? string.Empty;
            dept.Code = request.Code;
            dept.IsActive = request.ResolvedIsActive;
            dept.EffectiveDate = request.ResolvedEffectiveDate;
            dept.HeadEmployeeId = request.HeadEmployeeId;
            dept.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            if (dept.HeadEmployeeId.HasValue && dept.HeadEmployee == null)
            {
                await context.Entry(dept).Reference(d => d.HeadEmployee).LoadAsync();
            }

            return new DepartmentResponseDTO
            {
                DepartmentId = dept.DepartmentId,
                Name = dept.Name,
                Description = dept.Description,
                Code = dept.Code,
                IsActive = dept.IsActive,
                EffectiveDate = dept.EffectiveDate,
                HeadEmployeeId = dept.HeadEmployeeId,
                HeadEmployeeName = dept.HeadEmployee != null ? $"{dept.HeadEmployee.FirstName} {dept.HeadEmployee.LastName}".Trim() : null,
                EmployeeCount = dept.Employees.Count
            };
        }

        public async Task<bool> DeleteDepartmentAsync(Guid id)
        {
            var dept = await context.Departments.FindAsync(id);
            if (dept == null) return false;

            if (await context.JobPositions.AnyAsync(jp => jp.DepartmentId == id))
                throw new InvalidOperationException("Cannot delete department because it contains job positions.");

            context.Departments.Remove(dept);
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<List<JobPositionResponseDTO>> GetAllJobPositionsAsync()
        {
            var positions = await context.JobPositions
                .Include(jp => jp.Department)
                .Include(jp => jp.ReportsTo)
                .ToListAsync();
            return positions.Select(p => new JobPositionResponseDTO
            {
                JobPositionId = p.JobPositionId,
                Name = p.Title,
                Description = p.Description,
                DepartmentId = p.DepartmentId,
                DepartmentName = p.Department?.Name ?? string.Empty,
                Code = p.Code,
                IsActive = p.IsActive,
                ReportsToId = p.ReportsToId,
                ReportsToName = p.ReportsTo?.Title,
                EmploymentType = p.EmploymentType,
                PositionLevel = p.PositionLevel,
                EffectiveDate = p.EffectiveDate
            }).ToList();
        }

        public async Task<List<JobPositionResponseDTO>> GetJobPositionsByDepartmentAsync(Guid departmentId)
        {
            var positions = await context.JobPositions
                .Include(jp => jp.Department)
                .Include(jp => jp.ReportsTo)
                .Where(jp => jp.DepartmentId == departmentId)
                .ToListAsync();

            return positions.Select(p => new JobPositionResponseDTO
            {
                JobPositionId = p.JobPositionId,
                Name = p.Title,
                Description = p.Description,
                DepartmentId = p.DepartmentId,
                DepartmentName = p.Department?.Name ?? string.Empty,
                Code = p.Code,
                IsActive = p.IsActive,
                ReportsToId = p.ReportsToId,
                ReportsToName = p.ReportsTo?.Title,
                EmploymentType = p.EmploymentType,
                PositionLevel = p.PositionLevel,
                EffectiveDate = p.EffectiveDate
            }).ToList();
        }

        public async Task<JobPositionResponseDTO> CreateJobPositionAsync(CreateJobPositionDTO request)
        {
            var dept = await context.Departments.FindAsync(request.DepartmentId);
            if (dept == null) throw new KeyNotFoundException("Department not found.");

            if (await context.JobPositions.AnyAsync(jp => jp.Title == request.Name && jp.DepartmentId == request.DepartmentId))
                throw new InvalidOperationException("Job position already exists in this department.");

            var position = new JobPosition
            {
                JobPositionId = Guid.NewGuid(),
                Title = request.Name,
                Description = request.Description ?? string.Empty,
                DepartmentId = request.DepartmentId,
                Code = request.Code,
                IsActive = request.ResolvedIsActive,
                ReportsToId = request.ReportsToId,
                EmploymentType = request.EmploymentType,
                PositionLevel = request.PositionLevel,
                EffectiveDate = request.ResolvedEffectiveDate
            };

            context.JobPositions.Add(position);
            await context.SaveChangesAsync();

            if (position.ReportsToId.HasValue)
            {
                await context.Entry(position).Reference(jp => jp.ReportsTo).LoadAsync();
            }

            return new JobPositionResponseDTO
            {
                JobPositionId = position.JobPositionId,
                Name = position.Title,
                Description = position.Description,
                DepartmentId = position.DepartmentId,
                DepartmentName = dept.Name,
                Code = position.Code,
                IsActive = position.IsActive,
                ReportsToId = position.ReportsToId,
                ReportsToName = position.ReportsTo?.Title,
                EmploymentType = position.EmploymentType,
                PositionLevel = position.PositionLevel,
                EffectiveDate = position.EffectiveDate
            };
        }

        public async Task<JobPositionResponseDTO> UpdateJobPositionAsync(Guid id, CreateJobPositionDTO request)
        {
            var position = await context.JobPositions
                .Include(jp => jp.Department)
                .Include(jp => jp.ReportsTo)
                .FirstOrDefaultAsync(jp => jp.JobPositionId == id);
            if (position == null) throw new KeyNotFoundException("Job position not found.");

            var dept = await context.Departments.FindAsync(request.DepartmentId);
            if (dept == null) throw new KeyNotFoundException("Department not found.");

            position.Title = request.Name;
            position.Description = request.Description ?? string.Empty;
            position.DepartmentId = request.DepartmentId;
            position.Code = request.Code;
            position.IsActive = request.ResolvedIsActive;
            position.ReportsToId = request.ReportsToId;
            position.EmploymentType = request.EmploymentType;
            position.PositionLevel = request.PositionLevel;
            position.EffectiveDate = request.ResolvedEffectiveDate;
            position.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            if (position.ReportsToId.HasValue && position.ReportsTo == null)
            {
                await context.Entry(position).Reference(jp => jp.ReportsTo).LoadAsync();
            }

            return new JobPositionResponseDTO
            {
                JobPositionId = position.JobPositionId,
                Name = position.Title,
                Description = position.Description,
                DepartmentId = position.DepartmentId,
                DepartmentName = dept.Name,
                Code = position.Code,
                IsActive = position.IsActive,
                ReportsToId = position.ReportsToId,
                ReportsToName = position.ReportsTo?.Title,
                EmploymentType = position.EmploymentType,
                PositionLevel = position.PositionLevel,
                EffectiveDate = position.EffectiveDate
            };
        }

        public async Task<bool> DeleteJobPositionAsync(Guid id)
        {
            var position = await context.JobPositions.FindAsync(id);
            if (position == null) return false;

            if (await context.Employees.AnyAsync(e => e.JobPositionId == id))
                throw new InvalidOperationException("Cannot delete job position because it is assigned to employees.");

            context.JobPositions.Remove(position);
            await context.SaveChangesAsync();
            return true;
        }
    }
}
