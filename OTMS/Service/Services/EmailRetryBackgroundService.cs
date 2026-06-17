using System;
using System.Threading;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MimeKit;
using OTMS.Data;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using Task = System.Threading.Tasks.Task;

namespace OTMS.Service.Services
{
    public class EmailRetryBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailRetryBackgroundService> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

        public EmailRetryBackgroundService(
            IServiceScopeFactory scopeFactory,
            IConfiguration configuration,
            ILogger<EmailRetryBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _configuration = configuration;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Email Retry Background Service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessQueueAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing email retry queue.");
                }

                try
                {
                    await Task.Delay(_interval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }

            _logger.LogInformation("Email Retry Background Service stopped.");
        }

        private async Task ProcessQueueAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<OTMSDbContext>();

            var pendingEmails = await context.EmailQueueRecords
                .Where(e => e.Status == "Pending" && e.RetryCount < 3)
                .OrderBy(e => e.CreatedAt)
                .Take(10)
                .ToListAsync(cancellationToken);

            if (pendingEmails.Count == 0)
            {
                return;
            }

            _logger.LogInformation("Processing {Count} pending emails from queue.", pendingEmails.Count);

            foreach (var email in pendingEmails)
            {
                if (cancellationToken.IsCancellationRequested) break;

                try
                {
                    bool sent = await SendEmailAsync(email.ToEmail, email.Subject, email.Body);

                    if (sent)
                    {
                        email.Status = "Sent";
                        email.LastAttemptAt = DateTime.UtcNow;
                        _logger.LogInformation("Email to {Email} sent successfully on retry {RetryCount}.", email.ToEmail, email.RetryCount + 1);
                    }
                    else
                    {
                        email.RetryCount++;
                        email.LastAttemptAt = DateTime.UtcNow;
                        if (email.RetryCount >= 3)
                        {
                            email.Status = "Failed";
                            _logger.LogWarning("Email to {Email} failed after {RetryCount} retries.", email.ToEmail, email.RetryCount);
                        }
                        else
                        {
                            _logger.LogWarning("Email to {Email} failed. Retry count: {RetryCount}.", email.ToEmail, email.RetryCount);
                        }
                    }
                }
                catch (Exception ex)
                {
                    email.RetryCount++;
                    email.LastAttemptAt = DateTime.UtcNow;
                    if (email.RetryCount >= 3)
                    {
                        email.Status = "Failed";
                    }
                    _logger.LogError(ex, "Exception sending email to {Email}. Retry count: {RetryCount}.", email.ToEmail, email.RetryCount);
                }

                await context.SaveChangesAsync(cancellationToken);
            }
        }

        private async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                var smtpServer = _configuration["MailKitOptions:Server"] ?? "smtp.gmail.com";
                var smtpPort = int.TryParse(_configuration["MailKitOptions:Port"], out var port) ? port : 587;
                var senderName = _configuration["MailKitOptions:SenderName"] ?? "Operational Management System";
                var senderEmail = _configuration["MailKitOptions:SenderEmail"] ?? "operationalmanagementsystemoms@gmail.com";
                var account = _configuration["MailKitOptions:Account"] ?? "operationalmanagementsystemoms@gmail.com";
                var password = _configuration["MailKitOptions:Password"] ?? "fmda mprv nlga haxq";

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(senderName, senderEmail));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = subject;
                message.Body = new TextPart("html") { Text = body };

                using var client = new SmtpClient();
                await client.ConnectAsync(smtpServer, smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(account, password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}