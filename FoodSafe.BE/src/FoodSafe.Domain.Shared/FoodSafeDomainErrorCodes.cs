namespace FoodSafe;

public static class FoodSafeDomainErrorCodes
{
    public static class Organization
    {
        public const string DuplicateCode = "FoodSafe:Organization:0001";
        public const string InvalidParent = "FoodSafe:Organization:0002";
        public const string CircularHierarchy = "FoodSafe:Organization:0003";
        public const string HasChildren = "FoodSafe:Organization:0004";
        public const string InvalidGeography = "FoodSafe:Organization:0005";
    }

    public static class DataScope
    {
        public const string ExactlyOneGeographyRequired =
            "FoodSafe:DataScope:ExactlyOneGeographyRequired";
        public const string InvalidValidityPeriod =
            "FoodSafe:DataScope:InvalidValidityPeriod";
        public const string OrganizationNotFound =
            "FoodSafe:DataScope:OrganizationNotFound";
    }

    public static class Account
    {
        public const string InvalidCurrentPassword = "FoodSafe:Account:0001";
        public const string PasswordReused = "FoodSafe:Account:0002";
        public const string PasswordChangeFailed = "FoodSafe:Account:0003";
    }

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
        public const string InvalidCountryCode = "FoodSafe:Catalog:0003";
        public const string InvalidDistrictType = "FoodSafe:Catalog:0004";
        public const string InvalidCommuneType = "FoodSafe:Catalog:0005";
    }

    public static class FoodPoisoning
    {
        public const string CaseNotFound = "FoodSafe:FoodPoisoning:0001";
        public const string IncidentNotFound = "FoodSafe:FoodPoisoning:0002";
    }
}
