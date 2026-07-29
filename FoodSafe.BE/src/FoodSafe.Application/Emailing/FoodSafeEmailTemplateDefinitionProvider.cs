using Volo.Abp.Account.Emailing.Templates;
using Volo.Abp.Emailing.Templates;
using Volo.Abp.TextTemplating;

namespace FoodSafe.Emailing;

/// <summary>
/// Replaces ABP's stock English account emails with Vietnamese ones.
/// </summary>
/// <remarks>
/// The templates live in <c>FoodSafe.Domain.Shared</c> as embedded virtual
/// files, which is where the localization JSON already sits, so they ship with
/// the same file set.
/// </remarks>
public class FoodSafeEmailTemplateDefinitionProvider : TemplateDefinitionProvider
{
    public override void Define(ITemplateDefinitionContext context)
    {
        // The stock layout hard-codes lang="en", which makes mail clients offer
        // to translate a Vietnamese message.
        context
            .GetOrNull(StandardEmailTemplates.Layout)
            ?.WithVirtualFilePath(
                "/Templates/EmailLayout.tpl",
                isInlineLocalized: true);

        context
            .GetOrNull(AccountEmailTemplates.PasswordResetLink)
            ?.WithVirtualFilePath(
                "/Templates/PasswordResetLink.tpl",
                isInlineLocalized: true);
    }
}
