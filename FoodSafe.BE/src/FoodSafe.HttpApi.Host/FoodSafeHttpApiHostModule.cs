using Asp.Versioning;
using Asp.Versioning.ApplicationModels;
using FoodSafe.EntityFrameworkCore;
using FoodSafe.Security;
using FoodSafe.TextTemplating;
using Hangfire;
using Hangfire.PostgreSql;
using FoodSafe.Licensing;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Threading.RateLimiting;
using Volo.Abp;
using Volo.Abp.Account;
using Volo.Abp.Account.Web;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc.AntiForgery;
using Volo.Abp.AspNetCore.Mvc.Conventions;
using Volo.Abp.AspNetCore.Serilog;
using Volo.Abp.Autofac;
using Volo.Abp.BlobStoring;
using Volo.Abp.BlobStoring.Minio;
using Volo.Abp.Identity;
using Volo.Abp.MailKit;
using Volo.Abp.Modularity;
using Volo.Abp.OpenIddict;
using Volo.Abp.Security.Claims;
using Volo.Abp.Swashbuckle;
using Volo.Abp.Timing;
using Volo.Abp.TextTemplating;
using Volo.Abp.UI.Navigation.Urls;

namespace FoodSafe;

[DependsOn(
    typeof(FoodSafeHttpApiModule),
    typeof(AbpAutofacModule),
    typeof(FoodSafeApplicationModule),
    typeof(FoodSafeEntityFrameworkCoreModule),
    typeof(AbpAccountWebOpenIddictModule),
    typeof(AbpMailKitModule),
    typeof(AbpAspNetCoreSerilogModule),
    typeof(AbpSwashbuckleModule),
    typeof(AbpBlobStoringMinioModule)
)]
public class FoodSafeHttpApiHostModule : AbpModule
{
    public override void PreConfigureServices(ServiceConfigurationContext context)
    {
        PreConfigure<AbpAspNetCoreMvcOptions>(options =>
        {
            options.ConventionalControllers.Create(
                typeof(FoodSafeApplicationModule).Assembly,
                controllerOptions =>
                {
                    controllerOptions.RootPath = ApiContract.ApplicationRootPath;
                    controllerOptions.ApiVersions.Add(new ApiVersion(1, 0));
                });
        });

        PreConfigure<OpenIddictBuilder>(builder =>
        {
            builder.AddValidation(options =>
            {
                options.AddAudiences("FoodSafe");
                options.UseLocalServer();
                options.UseAspNetCore();
            });
        });

        PreConfigure<OpenIddictServerBuilder>(builder =>
        {
            builder.SetAccessTokenLifetime(TimeSpan.FromMinutes(15));
            builder.SetRefreshTokenLifetime(TimeSpan.FromDays(14));
        });
    }

    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        var configuration = context.Services.GetConfiguration();
        var hostingEnvironment = context.Services.GetHostingEnvironment();

        ConfigureAuthentication(context);
        ConfigureSecureTextTemplating();
        ConfigureCaptcha(context, configuration, hostingEnvironment);
        ValidateEmailDelivery(configuration, hostingEnvironment);
        ValidateCoreSecrets(configuration, hostingEnvironment);
        ValidatePostgreSqlSsl(configuration, hostingEnvironment);
        ConfigureDataProtection(context, configuration, hostingEnvironment);
        ConfigureUrls(configuration);
        ConfigureProblemDetails(context);
        ConfigureApiVersioning(context);
        ConfigureCors(context, configuration);
        ConfigureSwagger(context, configuration);
        ConfigureHangfire(context, configuration);
        ConfigureBlobStorage(configuration);
        ConfigureClock();
        ConfigureForwardedHeaders(context, configuration);
        ConfigureResponseCompression(context);
        ConfigureAntiForgery(hostingEnvironment);
        ConfigureIdentity(context, hostingEnvironment);
        ConfigureRateLimiting(context, hostingEnvironment);
        context.Services.AddHealthChecks();
        context.Services.AddHsts(options =>
        {
            options.MaxAge = TimeSpan.FromDays(365);
            options.IncludeSubDomains = true;
        });
    }

    private void ConfigureAuthentication(ServiceConfigurationContext context)
    {
        Configure<AbpClaimsPrincipalFactoryOptions>(options =>
        {
            options.IsDynamicClaimsEnabled = true;
        });
    }

    private void ConfigureUrls(IConfiguration configuration)
    {
        Configure<AppUrlOptions>(options =>
        {
            options.Applications["MVC"].RootUrl = configuration["App:SelfUrl"];
            options.RedirectAllowedUrls.AddRange(
                configuration["App:RedirectAllowedUrls"]?.Split(',') ?? []);
            options.Applications["Angular"].RootUrl = configuration["App:ClientUrl"];
            options.Applications["Angular"].Urls[AccountUrlNames.PasswordReset] =
                "account/reset-password";
        });
    }

    private void ConfigureBlobStorage(IConfiguration configuration)
    {
        Configure<AbpBlobStoringOptions>(options =>
        {
            options.Containers.ConfigureDefault(container =>
            {
                container.UseMinio(minio =>
                {
                    minio.EndPoint = configuration["BlobStorage:Endpoint"]!;
                    minio.AccessKey = configuration["BlobStorage:AccessKey"]!;
                    minio.SecretKey = configuration["BlobStorage:SecretKey"]!;
                    minio.BucketName = configuration["BlobStorage:BucketName"]!;
                    minio.WithSSL = configuration.GetValue(
                        "BlobStorage:WithSsl",
                        false);
                    minio.CreateBucketIfNotExists = true;
                });
            });
        });
    }

    private static void ConfigureProblemDetails(ServiceConfigurationContext context)
    {
        context.Services.AddProblemDetails(options =>
        {
            options.CustomizeProblemDetails = problemContext =>
            {
                var httpContext = problemContext.HttpContext;
                var correlationId =
                    httpContext.Response.Headers["X-Correlation-Id"].FirstOrDefault()
                    ?? httpContext.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                    ?? httpContext.TraceIdentifier;

                problemContext.ProblemDetails.Extensions["correlationId"] =
                    correlationId;
            };
        });
    }

    private void ConfigureApiVersioning(ServiceConfigurationContext context)
    {
        var preConfigureActions =
            context.Services.GetPreConfigureActions<AbpAspNetCoreMvcOptions>();

        Configure<AbpAspNetCoreMvcOptions>(options =>
        {
            preConfigureActions.Configure(options);
            options.ChangeControllerModelApiExplorerGroupName = false;
        });

        context.Services.AddTransient<IApiControllerFilter, NoControllerFilter>();
        context.Services.AddAbpApiVersioning(
            options =>
            {
                options.DefaultApiVersion = new ApiVersion(1, 0);
                options.ReportApiVersions = true;
                options.AssumeDefaultVersionWhenUnspecified = true;
            },
            options => options.ConfigureAbp(preConfigureActions.Configure()));
    }

    private void ConfigureCors(ServiceConfigurationContext context, IConfiguration configuration)
    {
        context.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(builder =>
            {
                builder
                    .WithOrigins(configuration["App:CorsOrigins"]?
                        .Split(",", StringSplitOptions.RemoveEmptyEntries)
                        .Select(o => o.TrimEnd('/'))
                        .ToArray() ?? [])
                    .WithExposedHeaders("Grpc-Status", "Grpc-Message", "Grpc-Encoding", "Grpc-Accept-Encoding")
                    .SetIsOriginAllowedToAllowWildcardSubdomains()
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials()
                    .SetPreflightMaxAge(TimeSpan.FromHours(1));
            });
        });
    }

    private void ConfigureSwagger(ServiceConfigurationContext context, IConfiguration configuration)
    {
        context.Services.AddAbpSwaggerGenWithOAuth(
            configuration["AuthServer:Authority"]!,
            new Dictionary<string, string>
            {
                { "FoodSafe", "FoodSafe API" }
            },
            options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "FoodSafe API",
                    Description = "Hệ thống quản lý an toàn thực phẩm — Chi cục ATVSTP tỉnh Quảng Ninh",
                    Version = "v1"
                });
                options.DocInclusionPredicate((_, _) => true);
                options.CustomSchemaIds(t => t.FullName);
            });
    }

    private void ConfigureHangfire(ServiceConfigurationContext context, IConfiguration configuration)
    {
        context.Services.AddHangfire(config =>
        {
            config.UsePostgreSqlStorage(opts =>
            {
                opts.UseNpgsqlConnection(
                    configuration.GetConnectionString("Default"));
            });
        });

        context.Services.AddHangfireServer(opts =>
        {
            opts.WorkerCount = 2;
        });
    }

    private void ConfigureClock()
    {
        Configure<AbpClockOptions>(options =>
        {
            options.Kind = DateTimeKind.Utc;
        });
    }

    private void ConfigureForwardedHeaders(
        ServiceConfigurationContext context,
        IConfiguration configuration)
    {
        context.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor
                | ForwardedHeaders.XForwardedProto
                | ForwardedHeaders.XForwardedHost;

            foreach (var configuredProxy in
                     configuration.GetSection("App:KnownProxies").Get<string[]>() ?? [])
            {
                if (IPAddress.TryParse(configuredProxy, out var proxyAddress))
                {
                    options.KnownProxies.Add(proxyAddress);
                }
            }
        });
    }

    private void ConfigureSecureTextTemplating()
    {
        Configure<AbpTextTemplatingOptions>(options =>
        {
            options.DefaultRenderingEngine =
                SecureScribanTemplateRenderingEngine.EngineName;
            options.RenderingEngines[
                    SecureScribanTemplateRenderingEngine.EngineName] =
                typeof(SecureScribanTemplateRenderingEngine);
        });
    }

    private static void ConfigureCaptcha(
        ServiceConfigurationContext context,
        IConfiguration configuration,
        IHostEnvironment hostingEnvironment)
    {
        var section = configuration.GetSection(CaptchaOptions.SectionName);
        var options = section.Get<CaptchaOptions>() ?? new CaptchaOptions();
        CaptchaConfiguration.Validate(options, hostingEnvironment.IsProduction());

        context.Services.Configure<CaptchaOptions>(section);
        context.Services.AddHttpClient<ICaptchaVerifier, TurnstileCaptchaVerifier>(
            client => client.Timeout = TimeSpan.FromSeconds(10));
    }

    private static void ValidatePostgreSqlSsl(
        IConfiguration configuration,
        IHostEnvironment hostingEnvironment)
    {
        PostgreSqlSslValidator.Validate(
            configuration.GetConnectionString("Default"),
            hostingEnvironment.IsProduction());
    }

    private static void ValidateCoreSecrets(
        IConfiguration configuration,
        IHostEnvironment hostingEnvironment)
    {
        CoreSecretsValidator.Validate(
            configuration.GetConnectionString("Default"),
            configuration["StringEncryption:DefaultPassPhrase"],
            hostingEnvironment.IsProduction());
    }

    private static void ValidateEmailDelivery(
        IConfiguration configuration,
        IHostEnvironment hostingEnvironment)
    {
        if (!hostingEnvironment.IsProduction())
        {
            return;
        }

        var host = configuration["Settings:Abp.Mailing.Smtp.Host"];
        var fromAddress = configuration["Settings:Abp.Mailing.DefaultFromAddress"];
        var enableSsl =
            configuration.GetValue<bool>("Settings:Abp.Mailing.Smtp.EnableSsl");
        var useDefaultCredentials =
            configuration.GetValue<bool>(
                "Settings:Abp.Mailing.Smtp.UseDefaultCredentials");
        var userName = configuration["Settings:Abp.Mailing.Smtp.UserName"];
        var password = configuration["Settings:Abp.Mailing.Smtp.Password"];

        if (string.IsNullOrWhiteSpace(host)
            || string.IsNullOrWhiteSpace(fromAddress)
            || !enableSsl
            || (!useDefaultCredentials
                && (string.IsNullOrWhiteSpace(userName)
                    || string.IsNullOrWhiteSpace(password))))
        {
            throw new InvalidOperationException(
                "Production password recovery requires an SSL-enabled SMTP host, "
                + "from address, and credentials.");
        }
    }

    private static void ConfigureDataProtection(
        ServiceConfigurationContext context,
        IConfiguration configuration,
        IHostEnvironment hostingEnvironment)
    {
        var builder = context.Services
            .AddDataProtection()
            .SetApplicationName("FoodSafe");

        var keysPath = configuration["DataProtection:KeysPath"];
        if (!string.IsNullOrWhiteSpace(keysPath))
        {
            builder.PersistKeysToFileSystem(new DirectoryInfo(keysPath));
        }

        if (!hostingEnvironment.IsProduction())
        {
            return;
        }

        var certificatePath = configuration["DataProtection:CertificatePath"];
        var certificatePassword = configuration["DataProtection:CertificatePassword"];
        if (string.IsNullOrWhiteSpace(certificatePath)
            || string.IsNullOrWhiteSpace(certificatePassword))
        {
            throw new InvalidOperationException(
                "Production requires DataProtection:CertificatePath and "
                + "DataProtection:CertificatePassword.");
        }

        var certificate = X509CertificateLoader.LoadPkcs12FromFile(
            certificatePath,
            certificatePassword,
            X509KeyStorageFlags.EphemeralKeySet);
        builder.ProtectKeysWithCertificate(certificate);
    }

    private void ConfigureResponseCompression(ServiceConfigurationContext context)
    {
        context.Services.AddResponseCompression(opts =>
        {
            opts.EnableForHttps = true;
            opts.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
            opts.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
        });
        context.Services.Configure<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProviderOptions>(opts =>
        {
            opts.Level = System.IO.Compression.CompressionLevel.Optimal;
        });
        context.Services.Configure<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProviderOptions>(opts =>
        {
            opts.Level = System.IO.Compression.CompressionLevel.Optimal;
        });
    }

    private void ConfigureAntiForgery(IHostEnvironment hostingEnvironment)
    {
        Configure<AbpAntiForgeryOptions>(options =>
        {
            options.AutoValidate = true;
            options.TokenCookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Strict;
            options.TokenCookie.SecurePolicy = hostingEnvironment.IsDevelopment()
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
        });
    }

    private static void ConfigureIdentity(
        ServiceConfigurationContext context,
        IHostEnvironment hostingEnvironment)
    {
        context.Services.Configure<IdentityOptions>(options =>
        {
            options.Lockout.AllowedForNewUsers = true;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);

            options.Password.RequiredLength = 8;
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
        });

        context.Services.AddScoped<
            IPasswordValidator<Volo.Abp.Identity.IdentityUser>,
            Security.MaximumPasswordLengthValidator>();

        context.Services.Configure<DataProtectionTokenProviderOptions>(options =>
        {
            options.TokenLifespan = TimeSpan.FromHours(8);
        });
        context.Services.Configure<SecurityStampValidatorOptions>(options =>
        {
            options.ValidationInterval = TimeSpan.Zero;
        });

        context.Services.PostConfigure<CookieAuthenticationOptions>(
            IdentityConstants.ApplicationScheme,
            options =>
            {
                options.Cookie.Name = hostingEnvironment.IsDevelopment()
                    ? "FoodSafe.Auth"
                    : "__Host-FoodSafe.Auth";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Strict;
                options.Cookie.SecurePolicy = hostingEnvironment.IsDevelopment()
                    ? CookieSecurePolicy.SameAsRequest
                    : CookieSecurePolicy.Always;
                options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
                options.SlidingExpiration = true;

                var previousRedirectToLogin = options.Events.OnRedirectToLogin;
                options.Events.OnRedirectToLogin = redirectContext =>
                {
                    if (redirectContext.Request.Path.StartsWithSegments("/api"))
                    {
                        redirectContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    }
                    return previousRedirectToLogin(redirectContext);
                };

                var previousRedirectToAccessDenied = options.Events.OnRedirectToAccessDenied;
                options.Events.OnRedirectToAccessDenied = redirectContext =>
                {
                    if (redirectContext.Request.Path.StartsWithSegments("/api"))
                    {
                        redirectContext.Response.StatusCode = StatusCodes.Status403Forbidden;
                        return Task.CompletedTask;
                    }
                    return previousRedirectToAccessDenied(redirectContext);
                };
            });
    }

    private static void ConfigureRateLimiting(
        ServiceConfigurationContext context,
        IWebHostEnvironment hostingEnvironment)
    {
        var isDev = hostingEnvironment.IsDevelopment();

        context.Services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
                httpContext =>
                {
                    var path = httpContext.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;
                    var identity = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
                    var client = identity is not null
                        ? $"user:{identity}"
                        : $"ip:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";

                    if (path == "/api/account/login")
                    {
                        var loginLimit = isDev ? 1000 : 10;
                        return FixedWindow($"login:{client}", loginLimit, TimeSpan.FromMinutes(5));
                    }

                    if (path.Contains("password-reset", StringComparison.Ordinal)
                        || path.Contains("reset-password", StringComparison.Ordinal))
                    {
                        var passwordLimit = isDev ? 100 : 5;
                        return FixedWindow($"password:{client}", passwordLimit, TimeSpan.FromMinutes(15));
                    }

                    if (path == "/api/v1/public/alert-reports"
                        && HttpMethods.IsPost(httpContext.Request.Method))
                    {
                        var submissionLimit = isDev ? 100 : 5;
                        return FixedWindow(
                            $"citizen-report:{client}", submissionLimit, TimeSpan.FromMinutes(15));
                    }

                    if (path.StartsWith("/api/v1/public", StringComparison.Ordinal))
                    {
                        var publicLimit = isDev ? 600 : 60;
                        return FixedWindow($"public:{client}", publicLimit, TimeSpan.FromMinutes(1));
                    }

                    var apiLimit = isDev ? 5000 : 300;
                    return FixedWindow($"api:{client}", apiLimit, TimeSpan.FromMinutes(1));
                });

            options.OnRejected = async (rejectedContext, cancellationToken) =>
            {
                var response = rejectedContext.HttpContext.Response;
                response.ContentType = "application/json; charset=utf-8";

                if (rejectedContext.Lease.TryGetMetadata(
                        MetadataName.RetryAfter,
                        out var retryAfter))
                {
                    response.Headers.RetryAfter =
                        Math.Ceiling(retryAfter.TotalSeconds).ToString(
                            System.Globalization.CultureInfo.InvariantCulture);
                }

                var correlationId =
                    rejectedContext.HttpContext.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                    ?? rejectedContext.HttpContext.TraceIdentifier;

                await response.WriteAsJsonAsync(
                    new
                    {
                        error = new
                        {
                            code = "FoodSafe:RateLimit:0001",
                            message = "Too many requests. Please retry later.",
                            details = (string?)null,
                            data = new { correlationId }
                        }
                    },
                    cancellationToken);
            };
        });

        static RateLimitPartition<string> FixedWindow(
            string partitionKey,
            int permitLimit,
            TimeSpan window)
        {
            return RateLimitPartition.GetFixedWindowLimiter(
                partitionKey,
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = window,
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
        }
    }

    public override void OnApplicationInitialization(ApplicationInitializationContext context)
    {
        var app = context.GetApplicationBuilder();
        var env = context.GetEnvironment();

        var recurringJobs =
            context.ServiceProvider.GetRequiredService<IRecurringJobManager>();
        recurringJobs.AddOrUpdate<IProductRegistrationExpiryJob>(
            "product-registration-expiry",
            job => job.ExecuteAsync(),
            Cron.Daily,
            new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.FindSystemTimeZoneById(
                    OperatingSystem.IsWindows()
                        ? "SE Asia Standard Time"
                        : "Asia/Bangkok")
            });
        recurringJobs.AddOrUpdate<IAdvertisementRegistrationExpiryJob>(
            "advertisement-registration-expiry",
            job => job.ExecuteAsync(),
            Cron.Daily,
            new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.FindSystemTimeZoneById(
                    OperatingSystem.IsWindows()
                        ? "SE Asia Standard Time"
                        : "Asia/Bangkok")
            });
        recurringJobs.AddOrUpdate<IEligibilityCertificateExpiryJob>(
            "eligibility-certificate-expiry",
            job => job.ExecuteAsync(),
            Cron.Daily,
            new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.FindSystemTimeZoneById(
                    OperatingSystem.IsWindows()
                        ? "SE Asia Standard Time"
                        : "Asia/Bangkok")
            });
        recurringJobs.AddOrUpdate<ICfsCertificateExpiryJob>(
            "cfs-certificate-expiry",
            job => job.ExecuteAsync(),
            Cron.Daily,
            new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.FindSystemTimeZoneById(
                    OperatingSystem.IsWindows()
                        ? "SE Asia Standard Time"
                        : "Asia/Bangkok")
            });
        recurringJobs.AddOrUpdate<IExportFoodCertificateExpiryJob>(
            "export-food-certificate-expiry",
            job => job.ExecuteAsync(),
            Cron.Daily,
            new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.FindSystemTimeZoneById(
                    OperatingSystem.IsWindows()
                        ? "SE Asia Standard Time"
                        : "Asia/Bangkok")
            });

        app.UseForwardedHeaders();

        if (!env.IsDevelopment())
        {
            app.UseHsts();
            app.UseHttpsRedirection();
        }

        app.UseResponseCompression();
        app.Use(async (httpContext, next) =>
        {
            if (httpContext.Request.Path.StartsWithSegments("/Account/Register")
                || httpContext.Request.Path.StartsWithSegments("/api/account/register"))
            {
                httpContext.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            await next();
        });

        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        app.UseAbpRequestLocalization();
        app.UseCorrelationId();
        app.UseStaticFiles();
        app.UseCors();
        app.UseRouting();
        app.UseAuthentication();
        app.UseRateLimiter();
        app.UseMiddleware<LoginCaptchaMiddleware>();
        app.UseAbpOpenIddictValidation();
        app.UseUnitOfWork();
        app.UseDynamicClaims();
        app.UseMiddleware<PasswordExpiryMiddleware>();
        app.UseAuthorization();
        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseAbpSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/swagger/v1/swagger.json", "FoodSafe API v1");
                var swaggerConfiguration = context.GetConfiguration();
                options.OAuthClientId(swaggerConfiguration["AuthServer:SwaggerClientId"]);
                options.OAuthScopes("FoodSafe");
            });
        }

        app.UseAuditing();
        app.UseAbpSerilogEnrichers();
        app.UseHangfireDashboard("/hangfire", new DashboardOptions
        {
            Authorization = [new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter()]
        });
        app.UseConfiguredEndpoints(endpoints =>
        {
            endpoints.MapHealthChecks("/health");
        });
    }
}
