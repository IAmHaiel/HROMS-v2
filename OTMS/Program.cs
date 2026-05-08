using Azure.Core;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OTMS.Data;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using OTMS.Service.Services;
using System;
using System.Reflection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// for frontend development, allowing cross-origin requests from the frontend development server
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Authorize Button
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "OTMS API", Version = "v1" });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);

    options.IncludeXmlComments(xmlPath);
});

// Authorize / Securing Endpoints
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["AppSettings:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["AppSettings:Audience"],
        ValidateLifetime = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["AppSettings:Token"]!)),
        ValidateIssuerSigningKey = true
    };
});

builder.Services.AddDbContext<OTMSDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


// Registered Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAccountManagementService, AccountManagementService>();

static async System.Threading.Tasks.Task SeedSystemAdminAsync(OTMSDbContext context)
{
    const string employeeNumber = "SPDX-SPR-01";

    // Check if the system admin already exists
    var exists = await context.Employees
        .Include(e => e.Account)
        .AnyAsync(e => e.EmployeeNumber == employeeNumber);

    if (exists)
        return;

    // Create the system admin employee
    var employee = new Employee
    {
        EmployeeId = Guid.NewGuid(),
        EmployeeNumber = employeeNumber,
        EmployeeName = "System Admin",
        ContactNumber = "0912 671 9251",
        CreatedAt = DateTime.UtcNow
    };

    var account = new Account
    {
        AccountId = Guid.NewGuid(),
        EmployeeId = employee.EmployeeId, // FK
        Role = "SystemAdmin",
        AccountStatus = "Active",
        CreatedAt = DateTime.UtcNow
    };

    // Hash Password
    var passwordHasher = new PasswordHasher<Account>();
    account.PasswordHash = passwordHasher.HashPassword(
        account,
        "SuperAdmin123"
        );

    // Link navigation
    employee.Account = account;

    // Save
    context.Employees.Add(employee);
    context.Accounts.Add(account);

    await context.SaveChangesAsync();
}

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    var context = services.GetRequiredService<OTMSDbContext>();

    // Apply migrations automatically
    context.Database.Migrate();

    await SeedSystemAdminAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseCors("DevPolicy");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("index.html");

app.Run();