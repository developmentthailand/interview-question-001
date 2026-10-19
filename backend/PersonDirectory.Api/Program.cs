using Example.Com.InterviewQuestion001.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins("http://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var connectionString = builder.Configuration.GetConnectionString("PersonDirectory")
    ?? $"Data Source={Path.Combine(builder.Environment.ContentRootPath, "person-directory.db")}";

builder.Services.AddDbContext<PersonDbContext>(options => options.UseSqlite(connectionString));

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors("Frontend");
app.MapControllers();

await using (var scope = app.Services.CreateAsyncScope())
{
    var database = scope.ServiceProvider.GetRequiredService<PersonDbContext>();
    await database.Database.MigrateAsync();

    if (app.Environment.IsDevelopment())
    {
        await DevelopmentDataSeeder.SeedAsync(database);
    }
}

await app.RunAsync();

public partial class Program { }
