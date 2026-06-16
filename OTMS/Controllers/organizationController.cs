using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.Organization;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class organizationController(
        IOrganizationService orgService,
        IActivityLogService activityLogService
    ) : ControllerBase
    {
        private Guid? GetActorId() =>
            Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;

        [Authorize(Policy = "Permissions.Departments.View")]
        [HttpGet("departments")]
        public async Task<ActionResult<List<DepartmentResponseDTO>>> GetAllDepartments()
        {
            return Ok(await orgService.GetAllDepartmentsAsync());
        }

        [Authorize(Policy = "Permissions.Departments.Manage")]
        [HttpPost("departments")]
        public async Task<ActionResult<DepartmentResponseDTO>> CreateDepartment([FromBody] CreateDepartmentDTO request)
        {
            try
            {
                var result = await orgService.CreateDepartmentAsync(request);
                var actor = GetActorId();
                if (actor.HasValue)
                    await activityLogService.LogActivityAsync(actor.Value, "Create", $"Created department '{result.Name}' (Code: {result.Code})");
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "Permissions.Departments.Manage")]
        [HttpPut("departments/{id}")]
        public async Task<ActionResult<DepartmentResponseDTO>> UpdateDepartment(Guid id, [FromBody] CreateDepartmentDTO request)
        {
            try
            {
                var result = await orgService.UpdateDepartmentAsync(id, request);
                var actor = GetActorId();
                if (actor.HasValue)
                    await activityLogService.LogActivityAsync(actor.Value, "Update", $"Updated department '{result.Name}' (Code: {result.Code})");
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "Permissions.Departments.Manage")]
        [HttpDelete("departments/{id}")]
        public async Task<ActionResult> DeleteDepartment(Guid id)
        {
            try
            {
                var result = await orgService.DeleteDepartmentAsync(id);
                if (!result) return NotFound();
                var actor = GetActorId();
                if (actor.HasValue)
                    await activityLogService.LogActivityAsync(actor.Value, "Delete", $"Deleted department ID: {id}");
                return Ok(new { message = "Department deleted successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "Permissions.JobPositions.View")]
        [HttpGet("job-positions")]
        public async Task<ActionResult<List<JobPositionResponseDTO>>> GetAllJobPositions()
        {
            return Ok(await orgService.GetAllJobPositionsAsync());
        }

        [Authorize(Policy = "Permissions.JobPositions.View")]
        [HttpGet("departments/{departmentId}/job-positions")]
        public async Task<ActionResult<List<JobPositionResponseDTO>>> GetJobPositionsByDepartment(Guid departmentId)
        {
            return Ok(await orgService.GetJobPositionsByDepartmentAsync(departmentId));
        }

        [Authorize(Policy = "Permissions.JobPositions.Manage")]
        [HttpPost("job-positions")]
        public async Task<ActionResult<JobPositionResponseDTO>> CreateJobPosition([FromBody] CreateJobPositionDTO request)
        {
            try
            {
                var result = await orgService.CreateJobPositionAsync(request);
                var actor = GetActorId();
                if (actor.HasValue)
                    await activityLogService.LogActivityAsync(actor.Value, "Create", $"Created job position '{result.Name}' in dept '{result.DepartmentName}'");
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "Permissions.JobPositions.Manage")]
        [HttpPut("job-positions/{id}")]
        public async Task<ActionResult<JobPositionResponseDTO>> UpdateJobPosition(Guid id, [FromBody] CreateJobPositionDTO request)
        {
            try
            {
                var result = await orgService.UpdateJobPositionAsync(id, request);
                var actor = GetActorId();
                if (actor.HasValue)
                    await activityLogService.LogActivityAsync(actor.Value, "Update", $"Updated job position '{result.Name}' in dept '{result.DepartmentName}'");
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "Permissions.JobPositions.Manage")]
        [HttpDelete("job-positions/{id}")]
        public async Task<ActionResult> DeleteJobPosition(Guid id)
        {
            try
            {
                var result = await orgService.DeleteJobPositionAsync(id);
                if (!result) return NotFound();
                var actor = GetActorId();
                if (actor.HasValue)
                    await activityLogService.LogActivityAsync(actor.Value, "Delete", $"Deleted job position ID: {id}");
                return Ok(new { message = "Job Position deleted successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
