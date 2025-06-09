using LaundryOrderAPI.Data;
using LaundryOrderAPI.Models;
using LaundryOrderAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options => {
    // Configurer la sérialisation des enums comme des nombres
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

// Configure DbContext
// Check for PostgreSQL connection first (from environment variable or production config)
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
Console.WriteLine($"[DEBUG] Environment: {builder.Environment.EnvironmentName}");
Console.WriteLine($"[DEBUG] Raw DATABASE_URL from env: '{connectionString}'");

if (string.IsNullOrEmpty(connectionString))
{
    // Fallback vers la configuration si pas de variable d'environnement
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    Console.WriteLine($"[DEBUG] Fallback connection string from config: '{connectionString}'");
}

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("DATABASE_URL environment variable or connection string not found");
}

// Always use PostgreSQL - convert URI format if needed
if (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://"))
{
    try
    {
        // Transformation d'URI en chaîne de connexion conventionnelle
        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':');
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        var user = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";
            
        connectionString = $"Host={host};Port={port};Database={database};Username={user};Password={password};SSL Mode=Require;Trust Server Certificate=True";
        Console.WriteLine($"[DEBUG] Transformed connection string: Host={host};Port={port};Database={database};Username={user};Password=***;SSL Mode=Require;Trust Server Certificate=True");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] Failed to parse DATABASE_URL: {ex.Message}");
        throw;
    }
}

// Always use PostgreSQL for consistency
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    // Ignorer l'avertissement pour les migrations en attente en production
    if (builder.Environment.IsProduction())
    {
        options.ConfigureWarnings(warnings => 
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }
});

// Configure Identity
builder.Services.AddIdentity<AppUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    
    var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? 
                 builder.Configuration["Jwt:Key"] ?? 
                 throw new InvalidOperationException("JWT Key not found in configuration or environment variables");
    
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "LaundryOrderAPI";
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "LaundryOrderApp";
    
    Console.WriteLine($"[DEBUG] JWT Issuer: {jwtIssuer}");
    Console.WriteLine($"[DEBUG] JWT Audience: {jwtAudience}");
    Console.WriteLine($"[DEBUG] JWT Key length: {jwtKey.Length}");
    
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOrderService, OrderService>();

// Add CORS
builder.Services.AddCors(options =>
{
    var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:4200";
    var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]?.Split(',') ?? new[] { frontendUrl };
    
    Console.WriteLine($"[DEBUG] CORS allowed origins: {string.Join(", ", allowedOrigins)}");
    
    options.AddPolicy("AllowSpecificOrigin",
        policy => policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// Add Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "LaundryOrderAPI", Version = "v1" });
    
    // Configure Swagger to use JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
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
});

var app = builder.Build();

// Appliquer automatiquement les migrations au démarrage
await ApplyMigrations(app.Services);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "LaundryOrderAPI v1"));
}

app.UseHttpsRedirection();

// Use CORS
app.UseCors("AllowSpecificOrigin");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
await SeedData(app.Services);
app.Run();

async Task ApplyMigrations(IServiceProvider serviceProvider)
{
    using (var scope = serviceProvider.CreateScope())
    {
        try
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Console.WriteLine("[INFO] Checking database connection...");
            
            // Test de la connexion
            await context.Database.CanConnectAsync();
            Console.WriteLine("[INFO] Database connection successful!");
            
            Console.WriteLine("[INFO] Checking for pending migrations...");
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
            
            if (pendingMigrations.Any())
            {
                Console.WriteLine($"[INFO] Found {pendingMigrations.Count()} pending migrations:");
                foreach (var migration in pendingMigrations)
                {
                    Console.WriteLine($"[INFO] - {migration}");
                }
                
                Console.WriteLine("[INFO] Applying migrations...");
                await context.Database.MigrateAsync();
                Console.WriteLine("[INFO] Migrations applied successfully!");
            }
            else
            {
                Console.WriteLine("[INFO] Database is up to date, no migrations needed.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Database operation failed: {ex.Message}");
            Console.WriteLine($"[ERROR] Stack trace: {ex.StackTrace}");
            throw; // Re-throw pour empêcher le démarrage si les migrations échouent
        }
    }
}

async Task SeedData(IServiceProvider serviceProvider)
{
    using (var scope = serviceProvider.CreateScope())
    {
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // Créer le rôle Admin s'il n'existe pas
        if (!await roleManager.RoleExistsAsync("Admin"))
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
        }        // Créer un utilisateur Admin
        var adminUser = await userManager.FindByNameAsync("admin");
        if (adminUser == null)
        {
            adminUser = new AppUser
            {
                UserName = "admin",
                Email = "admin@example.com",
                EmailConfirmed = true,
                FirstName = "Admin",
                LastName = "User"
            };
            await userManager.CreateAsync(adminUser, "Admin123!"); // Mot de passe fort
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }

        // Créer un utilisateur normal
        var normalUser = await userManager.FindByNameAsync("user");
        if (normalUser == null)
        {
            normalUser = new AppUser
            {
                UserName = "user",
                Email = "user@example.com",
                EmailConfirmed = true,
                FirstName = "Regular",
                LastName = "User"
            };
            await userManager.CreateAsync(normalUser, "User123!"); // Mot de passe fort
        }
    }
}
