using System.Security.Cryptography;
using System.Text;
using OTMS.Common.Constraints;

namespace OTMS.Service.Helper
{
    public static class PasswordGenerator
    {
        private const string Uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        private const string Lowercase = "abcdefghijklmnopqrstuvwxyz";
        private const string Digits = "0123456789";
        private const string Symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";

        private const string AllChars = Uppercase + Lowercase + Digits + Symbols;

        public static string Generate(int minimumLength = PasswordLength.MinimumLength)
        {
            if (minimumLength < PasswordLength.MinimumLength)
                throw new ArgumentException($"Password must be at least {PasswordLength.MinimumLength} characters long.");

            var password = new char[minimumLength];
            var randomBytes = new byte[minimumLength];

            RandomNumberGenerator.Fill(randomBytes);

            password[0] = PickRandomChar(Uppercase, randomBytes[0]);
            password[1] = PickRandomChar(Lowercase, randomBytes[1]);
            password[2] = PickRandomChar(Digits, randomBytes[2]);
            password[3] = PickRandomChar(Symbols, randomBytes[3]);

            for (int i = 4; i < minimumLength; i++)
                password[i] = PickRandomChar(AllChars, randomBytes[i]);

            var shuffled = Shuffle(password, randomBytes);
            return new string(shuffled);
        }

        private static char PickRandomChar(string charset, byte seed) =>
            charset[seed % charset.Length];

        private static char[] Shuffle(char[] chars, byte[] randomBytes)
        {
            for (int i = chars.Length - 1; i > 0; i--)
            {
                int j = randomBytes[i] % (i + 1);
                (chars[i], chars[j]) = (chars[j], chars[i]);
            }
            return chars;
        }
    }
}
