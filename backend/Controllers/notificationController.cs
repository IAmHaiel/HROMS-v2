using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.Notification.Responses;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class notificationController(INotificationService notificationService) : ControllerBase
    {
        // Get Notifications
        [Authorize]
        [HttpGet("my-notifications")]
        public async Task<
            ActionResult<PaginationResponseDTO<NotificationResponseDTO>>> GetMyNotifications([FromQuery] PaginationDTO request)
        {
            try
            {
                var result = await notificationService.GetMyNotificationsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // Mark as Read
        [Authorize]
        [HttpPatch("{notificationId}/read")]
        public async Task<IActionResult> MarkAsRead(Guid notificationId)
        {
            var result = await notificationService.MarkNotificationAsReadAsync(notificationId);

            if (!result)
            {
                return NotFound(new
                {
                    message = "Notification not found."
                });
            }

            return Ok(new
            {
                message = "Notification marked as read."
            });
        }
    }
}
