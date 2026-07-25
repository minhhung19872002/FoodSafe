using System.Reflection;
using Microsoft.Extensions.Localization;
using Scriban;
using Scriban.Runtime;
using Scriban.Syntax;
using Volo.Abp;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Localization;
using Volo.Abp.TextTemplating;

namespace FoodSafe.TextTemplating;

/// <summary>
/// Recompiles ABP's Scriban rendering integration against the patched Scriban
/// runtime and applies the member sandbox introduced by newer ABP releases.
/// Remove this adapter once the application can move to an ABP release that
/// natively depends on Scriban 7.2.2 or later.
/// </summary>
public sealed class SecureScribanTemplateRenderingEngine(
    ITemplateDefinitionManager templateDefinitionManager,
    ITemplateContentProvider templateContentProvider,
    IStringLocalizerFactory stringLocalizerFactory)
    : TemplateRenderingEngineBase(
        templateDefinitionManager,
        templateContentProvider,
        stringLocalizerFactory),
      ITransientDependency
{
    public const string EngineName = "Scriban";

    public override string Name => EngineName;

    public override async Task<string> RenderAsync(
        string templateName,
        object? model = null,
        string? cultureName = null,
        Dictionary<string, object>? globalContext = null)
    {
        Check.NotNullOrWhiteSpace(templateName, nameof(templateName));
        globalContext ??= new Dictionary<string, object>();

        if (cultureName is null)
        {
            return await RenderInternalAsync(templateName, globalContext, model);
        }

        using (CultureHelper.Use(cultureName))
        {
            return await RenderInternalAsync(templateName, globalContext, model);
        }
    }

    private async Task<string> RenderInternalAsync(
        string templateName,
        Dictionary<string, object> globalContext,
        object? model = null)
    {
        var definition = await TemplateDefinitionManager.GetAsync(templateName);
        var content = await GetContentOrNullAsync(definition)
            ?? throw new InvalidOperationException(
                $"Template content was not found for '{templateName}'.");
        var context = CreateTemplateContext(definition, globalContext, model);
        var template = Template.Parse(content);

        if (template.HasErrors)
        {
            throw new InvalidOperationException(
                $"Template '{templateName}' could not be parsed: "
                + string.Join("; ", template.Messages));
        }

        var renderedContent = await template.RenderAsync(context);
        if (definition.Layout is null)
        {
            return renderedContent;
        }

        globalContext["content"] = renderedContent;
        return await RenderInternalAsync(definition.Layout, globalContext);
    }

    private TemplateContext CreateTemplateContext(
        TemplateDefinition definition,
        Dictionary<string, object> globalContext,
        object? model)
    {
        var context = new TemplateContext
        {
            MemberFilter = static member => member is PropertyInfo
        };
        var scriptObject = new ScriptObject();
        scriptObject.Import(globalContext);

        if (model is not null)
        {
            scriptObject["model"] = model;
        }

        var localizer = GetLocalizerOrNull(definition);
        if (localizer is not null)
        {
            scriptObject.SetValue(
                "L",
                new SecureScribanTemplateLocalizer(localizer),
                true);
        }

        context.PushGlobal(scriptObject);
        context.PushCulture(System.Globalization.CultureInfo.CurrentCulture);
        return context;
    }

    private sealed class SecureScribanTemplateLocalizer(IStringLocalizer localizer)
        : IScriptCustomFunction
    {
        public int RequiredParameterCount => 1;
        public int ParameterCount => ScriptFunctionCall.MaximumParameterCount - 1;
        public ScriptVarParamKind VarParamKind => ScriptVarParamKind.Direct;
        public Type ReturnType => typeof(object);

        public object? Invoke(
            TemplateContext context,
            ScriptNode? callerContext,
            ScriptArray arguments,
            ScriptBlockStatement? blockStatement)
        {
            return GetString(arguments);
        }

        public ValueTask<object?> InvokeAsync(
            TemplateContext context,
            ScriptNode? callerContext,
            ScriptArray arguments,
            ScriptBlockStatement? blockStatement)
        {
            return ValueTask.FromResult<object?>(GetString(arguments));
        }

        public ScriptParameterInfo GetParameterInfo(int index)
        {
            return index == 0
                ? new ScriptParameterInfo(typeof(string), "template_name")
                : new ScriptParameterInfo(typeof(object), "value");
        }

        private string GetString(ScriptArray arguments)
        {
            if (arguments.Count == 0)
            {
                return string.Empty;
            }

            var name = arguments[0]?.ToString();
            if (string.IsNullOrWhiteSpace(name))
            {
                return string.Empty;
            }

            var values = arguments
                .Skip(1)
                .Where(value => value is not null)
                .Cast<object>()
                .ToArray();
            return values.Length == 0
                ? localizer[name]
                : localizer[name, values];
        }
    }
}
