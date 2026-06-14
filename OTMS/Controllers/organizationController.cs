using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.Organization;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class organizationController(IOrganizationService orgService) : ControllerBase
    {
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
                return Ok(await orgService.CreateDepartmentAsync(request));
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
                return Ok(await orgService.UpdateDepartmentAsync(id, request));
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
                return Ok(await orgService.CreateJobPositionAsync(request));
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
                return Ok(await orgService.UpdateJobPositionAsync(id, request));
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
                return Ok(new { message = "Job Position deleted successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
