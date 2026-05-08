using System.Security.Cryptography;
using System.Text;

namespace OTMS.Service.Helper
{
    public static class PasswordGenerator
    {
        private const string Uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        private const string Lowercase = "abcdefghijklmnopqrstuvwxyz";
        private const string Numbers = "0123456789";
        private const string Special = "!@#$%^&*()_-+=<>?";

        public static string Generate(int length = 12)
        {
            if (length < 8)
                throw new ArgumentException(
                    "Password length must be at least 8 characters."
                );

            string allChars = Uppercase + Lowercase + Numbers + Special;

            var password = new StringBuilder();

            // Ensure the password contains at least one character from each category
            password.Append(GetRandomChar(Uppercase));
            password.Append(GetRandomChar(Lowercase));
            password.Append(GetRandomChar(Numbers));
            password.Append(GetRandomChar(Special));

            // Fill the remaining length with random characters from all categories
            for (int i = password.Length; i < length; i++)
            {
                password.Append(GetRandomChar(allChars));
            }

            // Shuffle the characters to avoid predictable patterns
            return Shuffle(password.ToString());
        }

        // Helpers
        private static char GetRandomChar(string chars)
        {
            int index = RandomNumberGenerator.GetInt32(chars.Length);
            return chars[index];
        }

        private static string Shuffle(string input)
        {
            char[] array = input.ToCharArray();

            for(int i = array.Length - 1; i > 0; i--)
            {
                int j = RandomNumberGenerator.GetInt32(i + 1);
                
                (array[i], array[j]) = (array[j], array[i]);
            }

            return new string(array);
        }
    }
}
