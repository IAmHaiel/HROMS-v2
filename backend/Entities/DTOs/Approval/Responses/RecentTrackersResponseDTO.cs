using System.Collections.Generic;
using OTMS.Entities.DTOs.Dashboard.Responses;

namespace OTMS.Entities.DTOs.Approval.Responses
{
    public class RecentTrackersResponseDTO
    {
        public int ActiveCount { get; set; }
        public List<WorkflowTrackerDTO> RecentTrackers { get; set; } = new();
    }
}
