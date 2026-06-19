namespace OTMS.Service.Helper
{
    public static class GeneralHelper
    {
        public static string ContactNumberFormatter(string contactNumber)
        {
            if (string.IsNullOrEmpty(contactNumber))
            {
                return contactNumber;
            }

            // Ensuring only digits
            contactNumber = new string(contactNumber.Where(char.IsDigit).ToArray());

            // Validate the length
            if (contactNumber.Length != 11 || !contactNumber.StartsWith("09"))
            {
                throw new Exception("Contact Number must be exactly 11 digits and start with 09.");
            }

            // Return raw digits — formatting is a display-layer concern
            return contactNumber;
        }
    }
}
