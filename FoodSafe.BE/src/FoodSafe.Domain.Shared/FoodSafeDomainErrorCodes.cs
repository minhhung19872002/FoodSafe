namespace FoodSafe;

public static class FoodSafeDomainErrorCodes
{
    public static class Business
    {
        public const string NotFound = "FoodSafe:Business:0001";
        public const string DuplicateTaxCode = "FoodSafe:Business:0002";
        public const string CannotModifyInactive = "FoodSafe:Business:0003";
    }

    public static class Inspection
    {
        public const string PlanNotFound = "FoodSafe:Inspection:0001";
        public const string CannotModifyNonDraft = "FoodSafe:Inspection:0002";
        public const string DuplicateBusiness = "FoodSafe:Inspection:0003";
    }

    public static class Report
    {
        public const string NotFound = "FoodSafe:Report:0001";
        public const string CannotSubmitNonDraft = "FoodSafe:Report:0002";
        public const string CannotVerifyNonSubmitted = "FoodSafe:Report:0003";
        public const string CannotReturnNonSubmitted = "FoodSafe:Report:0004";
    }

    public static class Catalog
    {
        public const string DuplicateCode = "FoodSafe:Catalog:0001";
        public const string InUse = "FoodSafe:Catalog:0002";
    }

    public static class FoodPoisoning
    {
        public const string CaseNotFound = "FoodSafe:FoodPoisoning:0001";
        public const string IncidentNotFound = "FoodSafe:FoodPoisoning:0002";
    }
}
