using OTMS.Common.Constraints;
using System.Security.Cryptography;
using System.Text;

namespace OTMS.Service.Helper
{
    public static class PasswordGenerator
    {
        private static readonly string[] WordList =
        {
            "river",
            "mountain",
            "orange",
            "falcon",
            "galaxy",
            "thunder",
            "banana",
            "shadow",
            "tiger",
            "forest",
            "rocket",
            "diamond",
            "ocean",
            "planet",
            "sunrise",
            "whisper",
            "coconut",
            "volcano",
            "phoenix",
            "silver"
        };

        public static string Generate(int minimumLength = PasswordLength.MinimumLength)
        {
            if (minimumLength < PasswordLength.MinimumLength)
            {
                throw new ArgumentException(
                    "Passphrase must be at least 15 characters long."
                );
            }

            var words = new List<string>();
            int currentLength = 0;

            while (currentLength < minimumLength)
            {
                string word = GetRandomWord();

                words.Add(word);

                currentLength = string.Join("-", words).Length;
            }

            return string.Join("-", words);
        }

        private static string GetRandomWord()
        {
            int index = RandomNumberGenerator.GetInt32(WordList.Length);

            return WordList[index];
        }
    }
}
