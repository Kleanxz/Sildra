using Npgsql;

namespace SildraSupport.Api;

internal sealed class SlaBreachWorker(PostgresSupportStore store, ILogger<SlaBreachWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        do
        {
            try
            {
                await store.RecordBreachedSlasAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (NpgsqlException exception)
            {
                logger.LogDebug("No se pudo actualizar el vencimiento de SLA (SQLSTATE {SqlState}).", exception.SqlState);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
