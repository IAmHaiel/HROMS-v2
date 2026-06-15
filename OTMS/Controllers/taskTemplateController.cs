using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Common.Constraints;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.TaskTemplate;
using OTMS.Service.Interfaces;
using System;
using System.Threading.Tasks;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class taskTemplateController(ITaskTemplateService taskTemplateService) : ControllerBase
    {
        [HttpPost]
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        public async Task<IActionResult> CreateTaskTemplate([FromBody] TaskTemplateCreationDTO request)
        {
            try
            {
                var response = await taskTemplateService.CreateTaskTemplateAsync(request);
                return Ok(new { message = "Task template created successfully.", data = response });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{templateId}")]
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        public async Task<IActionResult> UpdateTaskTemplate(Guid templateId, [FromBody] TaskTemplateUpdateDTO request)
        {
            try
            {
                var response = await taskTemplateService.UpdateTaskTemplateAsync(templateId, request);
                return Ok(new { message = "Task template updated successfully.", data = response });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{templateId}/toggle-status")]
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        public async Task<IActionResult> ToggleTemplateStatus(Guid templateId)
        {
            try
            {
                var response = await taskTemplateService.ToggleTemplateStatusAsync(templateId);
                return Ok(new { message = $"Task template is now {response.TemplateStatus}.", data = response });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        public async Task<IActionResult> GetTaskTemplates([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var pagination = new PaginationDTO { PageNumber = pageNumber, PageSize = pageSize };
                var response = await taskTemplateService.GetTaskTemplatesAsync(pagination);
                return Ok(new { message = "Task templates retrieved successfully.", data = response });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
