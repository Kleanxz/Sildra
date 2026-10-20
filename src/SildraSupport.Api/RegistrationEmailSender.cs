using System.Net;
using System.Net.Mail;
using System.Text;

namespace SildraSupport.Api;

internal sealed class RegistrationEmailSender(ILogger<RegistrationEmailSender> logger)
{
    public async Task<bool> SendWelcomeAsync(string recipient, string name)
    {
        var host = Environment.GetEnvironmentVariable("SMTP_HOST")?.Trim();
        var from = Environment.GetEnvironmentVariable("SMTP_FROM")?.Trim();
        var username = Environment.GetEnvironmentVariable("SMTP_USER")?.Trim();
        var password = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
        var port = int.TryParse(Environment.GetEnvironmentVariable("SMTP_PORT"), out var parsedPort) ? parsedPort : 587;
        var useSsl = !bool.TryParse(Environment.GetEnvironmentVariable("SMTP_USE_SSL"), out var parsedSsl) || parsedSsl;

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
        {
            logger.LogWarning("No se envió el aviso de registro: configura SMTP_HOST y SMTP_FROM.");
            return false;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(from, "Sildra Support", Encoding.UTF8),
                Subject = "Tu cuenta de Sildra Support está lista",
                SubjectEncoding = Encoding.UTF8,
                BodyEncoding = Encoding.UTF8,
                IsBodyHtml = false,
                Body = $"Hola {name},\n\nTu cuenta de Sildra Support se registró correctamente con el correo {recipient}. Ya puedes ingresar para consultar y gestionar tus reportes.\n\nSi no creaste esta cuenta, puedes ignorar este mensaje.\n\nSildra Support"
            };
            message.To.Add(new MailAddress(recipient));

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = useSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                Timeout = 12_000
            };
            if (!string.IsNullOrWhiteSpace(username))
                client.Credentials = new NetworkCredential(username, password ?? string.Empty);

            await client.SendMailAsync(message);
            return true;
        }
        catch (Exception exception) when (exception is SmtpException or InvalidOperationException or FormatException)
        {
            logger.LogWarning("No se pudo enviar el aviso de registro a {Email} ({ExceptionType}).", recipient, exception.GetType().Name);
            return false;
        }
    }
}
