using Asp.Versioning;
using FoodSafe.Security;
using FoodSafe.Controllers;
using Microsoft.AspNetCore.Mvc;
using Shouldly;
using System.Reflection;
using Xunit;

namespace FoodSafe;

public sealed class ApiContractTests
{
    [Fact]
    public void Application_routes_should_use_the_explicit_v1_root()
    {
        ApiContract.ApplicationRootPath.ShouldBe("v1/app");
        ApiContract.Version.ShouldBe("1.0");
    }

    [Fact]
    public void Captcha_route_should_use_the_same_api_version()
    {
        var controllerType = typeof(CaptchaController);
        var route = controllerType.GetCustomAttribute<RouteAttribute>();
        var versions = controllerType.GetCustomAttribute<ApiVersionAttribute>();

        route.ShouldNotBeNull();
        route.Template.ShouldBe(ApiContract.CaptchaRootPath);
        versions.ShouldNotBeNull();
        versions.Versions.ShouldHaveSingleItem().ToString().ShouldBe(ApiContract.Version);
    }

    [Fact]
    public void Identity_administration_should_use_the_explicit_v1_route()
    {
        var controllerType = typeof(IdentityAdministrationController);
        var route = controllerType.GetCustomAttribute<RouteAttribute>();
        var versions = controllerType.GetCustomAttribute<ApiVersionAttribute>();

        route.ShouldNotBeNull();
        route.Template.ShouldBe("api/v1/administration");
        versions.ShouldNotBeNull();
        versions.Versions.ShouldHaveSingleItem().ToString().ShouldBe(ApiContract.Version);
    }
}
