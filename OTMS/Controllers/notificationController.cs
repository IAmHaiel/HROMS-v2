using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.Notification.Responses;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class notificationController(INotificationService notificationService) : ControllerBase
    {
        // Get Notifications
        [Authorize(Roles = "OperationsAdmin,Coordinator,Encoder")]
        [HttpGet("my-notifications")]
        public async Task<
            ActionResult<List<NotificationResponseDTO>>> GetMyNotifications()
        {
            try
            {
                var result = await notificationService.GetMyNotificationsAsync();
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
        [Authorize(Roles = "OperationsAdmin,Coordinator,Encoder")]
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
