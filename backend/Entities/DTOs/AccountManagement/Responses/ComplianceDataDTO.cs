namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class ComplianceDataDTO
    {
        public string SssNumber { get; set; } = string.Empty;
        public string PhilhealthNumber { get; set; } = string.Empty;
        public string PagibigNumber { get; set; } = string.Empty;
        public string? TinNumber { get; set; }
        public string BankName { get; set; } = string.Empty;
        public string BankAccountNumber { get; set; } = string.Empty;
        public string EmergencyContactName { get; set; } = string.Empty;
        public string EmergencyContactNumber { get; set; } = string.Empty;
    }
}