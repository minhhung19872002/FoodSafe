using System.Reflection;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.FileManagement;

public sealed class ProductAttachmentAuthorizationContractTests
{
    [Fact]
    public void Service_requires_product_view_permission()
    {
        typeof(ProductAttachmentAppService)
            .GetCustomAttributes<AuthorizeAttribute>()
            .Select(x => x.Policy)
            .ShouldContain(
                FoodSafePermissions.BusinessManagement.Products.View);
    }

    [Theory]
    [InlineData("UploadAsync")]
    [InlineData("DeleteAsync")]
    public void Mutations_also_require_product_edit_permission(
        string methodName)
    {
        typeof(ProductAttachmentAppService)
            .GetMethod(methodName)!
            .GetCustomAttributes<AuthorizeAttribute>()
            .Select(x => x.Policy)
            .ShouldContain(
                FoodSafePermissions.BusinessManagement.Products.Edit);
    }
}
