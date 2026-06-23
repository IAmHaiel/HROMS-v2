using OTMS.Entities.DTOs;
using System;
using System.Collections.Generic;

namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class Digital201FileResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public string? DepartmentName { get; set; }
        public string? JobPositionTitle { get; set; }
        public DateTime DateHired { get; set; }

        public string Role { get; set; } = string.Empty;
        public string AccountStatus { get; set; } = string.Empty;

        public bool Success { get; set; }

        public List<EmployeeAttachmentDTO> Attachments { get; set; } = new List<EmployeeAttachmentDTO>();

        public ComplianceDataDTO? Compliance { get; set; }
    }
}
