using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.RoleManagement;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "Permissions.Roles.View")]
    public class rolesController(IRolesService rolesService) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<List<RoleResponseDTO>>> GetAllRoles()
        {
            return Ok(await rolesService.GetAllRolesAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RoleResponseDTO>> GetRoleById(Guid id)
        {
            var role = await rolesService.GetRoleByIdAsync(id);
            if (role == null) return NotFound();
            return Ok(role);
        }

        [Authorize(Policy = "Permissions.Roles.Manage")]
        [HttpPost]
        public async Task<ActionResult<RoleResponseDTO>> CreateRole([FromBody] CreateRoleDTO request)
        {
            try
            {
                var role = await rolesService.CreateRoleAsync(request);
                return Ok(role);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "Permissions.Roles.Manage")]
        [HttpPut("{id}")]
        public async Task<ActionResult<RoleResponseDTO>> UpdateRole(Guid id, [FromBody] UpdateRoleDTO request)
        {
            try
            {
                var role = await rolesService.UpdateRoleAsync(id, request);
                return Ok(role);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "Permissions.Roles.Manage")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRole(Guid id)
        {
            try
            {
                var result = await rolesService.DeleteRoleAsync(id);
                if (!result) return NotFound();
                return Ok(new { message = "Role deleted successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("permissions")]
        public async Task<ActionResult<List<PermissionResponseDTO>>> GetAllPermissions()
        {
            return Ok(await rolesService.GetAllPermissionsAsync());
        }
    }
}
