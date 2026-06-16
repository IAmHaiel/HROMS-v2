using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;

namespace OTMS.Common.Helpers
{
    public static class DataEncryptionHelper
    {
        private static byte[] GetKey(IConfiguration configuration)
        {
            var keyString = configuration["AppSettings:EncryptionKey"]
                ?? throw new InvalidOperationException("Encryption key not configured.");
            var keyBytes = Convert.FromHexString(keyString);
            if (keyBytes.Length != 32)
                throw new InvalidOperationException("Encryption key must be 32 bytes (64 hex characters).");
            return keyBytes;
        }

        public static string Encrypt(string plainText, IConfiguration configuration)
        {
            if (string.IsNullOrEmpty(plainText))
                return plainText;

            var key = GetKey(configuration);
            using var aes = Aes.Create();
            aes.Key = key;
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor();
            var plainBytes = System.Text.Encoding.UTF8.GetBytes(plainText);
            var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

            var result = new byte[aes.IV.Length + cipherBytes.Length];
            Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
            Buffer.BlockCopy(cipherBytes, 0, result, aes.IV.Length, cipherBytes.Length);

            return Convert.ToBase64String(result);
        }

        public static string Decrypt(string cipherText, IConfiguration configuration)
        {
            if (string.IsNullOrEmpty(cipherText))
                return cipherText;

            var key = GetKey(configuration);
            var combined = Convert.FromBase64String(cipherText);

            using var aes = Aes.Create();
            aes.Key = key;

            var iv = new byte[aes.BlockSize / 8];
            var cipherBytes = new byte[combined.Length - iv.Length];
            Buffer.BlockCopy(combined, 0, iv, 0, iv.Length);
            Buffer.BlockCopy(combined, iv.Length, cipherBytes, 0, cipherBytes.Length);

            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor();
            var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
            return System.Text.Encoding.UTF8.GetString(plainBytes);
        }
    }
}