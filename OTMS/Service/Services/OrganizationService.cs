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
            var depts = await context.Departments.ToListAsync();
            return depts.Select(d => new DepartmentResponseDTO
            {
                DepartmentId = d.DepartmentId,
                Name = d.Name,
                Description = d.Description
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
                Description = request.Description
            };

            context.Departments.Add(dept);
            await context.SaveChangesAsync();

            return new DepartmentResponseDTO
            {
                DepartmentId = dept.DepartmentId,
                Name = dept.Name,
                Description = dept.Description
            };
        }

        public async Task<DepartmentResponseDTO> UpdateDepartmentAsync(Guid id, CreateDepartmentDTO request)
        {
            var dept = await context.Departments.FindAsync(id);
            if (dept == null) throw new KeyNotFoundException("Department not found.");

            if (dept.Name != request.Name && await context.Departments.AnyAsync(d => d.Name == request.Name))
                throw new InvalidOperationException("Department with that name already exists.");

            dept.Name = request.Name;
            dept.Description = request.Description;

            await context.SaveChangesAsync();

            return new DepartmentResponseDTO
            {
                DepartmentId = dept.DepartmentId,
                Name = dept.Name,
                Description = dept.Description
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
            var positions = await context.JobPositions.Include(jp => jp.Department).ToListAsync();
            return positions.Select(p => new JobPositionResponseDTO
            {
                JobPositionId = p.JobPositionId,
                Name = p.Title,
                Description = p.Description,
                DepartmentId = p.DepartmentId,
                DepartmentName = p.Department?.Name ?? string.Empty
            }).ToList();
        }

        public async Task<List<JobPositionResponseDTO>> GetJobPositionsByDepartmentAsync(Guid departmentId)
        {
            var positions = await context.JobPositions
                .Include(jp => jp.Department)
                .Where(jp => jp.DepartmentId == departmentId)
                .ToListAsync();

            return positions.Select(p => new JobPositionResponseDTO
            {
                JobPositionId = p.JobPositionId,
                Name = p.Title,
                Description = p.Description,
                DepartmentId = p.DepartmentId,
                DepartmentName = p.Department?.Name ?? string.Empty
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
                Description = request.Description,
                DepartmentId = request.DepartmentId
            };

            context.JobPositions.Add(position);
            await context.SaveChangesAsync();

            return new JobPositionResponseDTO
            {
                JobPositionId = position.JobPositionId,
                Name = position.Title,
                Description = position.Description,
                DepartmentId = position.DepartmentId,
                DepartmentName = dept.Name
            };
        }

        public async Task<JobPositionResponseDTO> UpdateJobPositionAsync(Guid id, CreateJobPositionDTO request)
        {
            var position = await context.JobPositions.Include(jp => jp.Department).FirstOrDefaultAsync(jp => jp.JobPositionId == id);
            if (position == null) throw new KeyNotFoundException("Job position not found.");

            var dept = await context.Departments.FindAsync(request.DepartmentId);
            if (dept == null) throw new KeyNotFoundException("Department not found.");

            position.Title = request.Name;
            position.Description = request.Description;
            position.DepartmentId = request.DepartmentId;

            await context.SaveChangesAsync();

            return new JobPositionResponseDTO
            {
                JobPositionId = position.JobPositionId,
                Name = position.Title,
                Description = position.Description,
                DepartmentId = position.DepartmentId,
                DepartmentName = dept.Name
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
