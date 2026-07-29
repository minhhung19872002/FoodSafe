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

    public static class IdentityAdministration
    {
        public const string SelfLifecycleChange = "FoodSafe:Identity:0001";
        public const string RoleInUse = "FoodSafe:Identity:0002";
        public const string LastAdministrator = "FoodSafe:Identity:0003";
        public const string IncompatibleRole = "FoodSafe:Identity:0004";
        public const string InactiveRole = "FoodSafe:Identity:0005";
        public const string SelfPermissionChange = "FoodSafe:Identity:0006";
        public const string InvalidScope = "FoodSafe:Identity:0007";
    }

    public static class Business
    {
        public const string NotFound = "FoodSafe:Business:0001";
        public const string DuplicateTaxCode = "FoodSafe:Business:0002";
        public const string CannotModifyInactive = "FoodSafe:Business:0003";
        public const string InvalidStatus = "FoodSafe:Business:0004";
        public const string SuspensionReasonRequired = "FoodSafe:Business:0005";
        public const string InvalidGeography = "FoodSafe:Business:0006";
        public const string InvalidCoordinates = "FoodSafe:Business:0007";
        public const string InvalidEmployeeCount = "FoodSafe:Business:0008";
        public const string InvalidCertificateDates = "FoodSafe:Business:0009";
        public const string BusinessInUse = "FoodSafe:Business:0010";
        public const string CannotModifyConfirmedCommitment = "FoodSafe:Business:0011";
        public const string CommitmentAlreadyConfirmed = "FoodSafe:Business:0012";
    }

    public static class Product
    {
        public const string NotFound = "FoodSafe:Product:0001";
        public const string InvalidStatus = "FoodSafe:Product:0002";
        public const string InvalidExpiryPeriod = "FoodSafe:Product:0003";
        public const string OrganizationMismatch = "FoodSafe:Product:0004";
        public const string DuplicateCode = "FoodSafe:Product:0005";
    }

    public static class SelfDeclaration
    {
        public const string DuplicateNumber =
            "FoodSafe:SelfDeclaration:0001";
        public const string InvalidDateRange =
            "FoodSafe:SelfDeclaration:0002";
        public const string ProductMismatch =
            "FoodSafe:SelfDeclaration:0003";
        public const string AlreadyRevoked =
            "FoodSafe:SelfDeclaration:0004";
        public const string RevokeReasonRequired =
            "FoodSafe:SelfDeclaration:0005";
        public const string CannotModifyRevoked =
            "FoodSafe:SelfDeclaration:0006";
    }

    public static class ProductRegistration
    {
        public const string DuplicateNumber =
            "FoodSafe:ProductRegistration:0001";
        public const string InvalidDateRange =
            "FoodSafe:ProductRegistration:0002";
        public const string ProductMismatch =
            "FoodSafe:ProductRegistration:0003";
        public const string AlreadyRevoked =
            "FoodSafe:ProductRegistration:0004";
        public const string CannotModifyRevoked =
            "FoodSafe:ProductRegistration:0005";
        public const string InvalidRegistrationDate =
            "FoodSafe:ProductRegistration:0006";
    }

    public static class AdvertisementRegistration
    {
        public const string DuplicateNumber =
            "FoodSafe:AdvertisementRegistration:0001";
        public const string InvalidDateRange =
            "FoodSafe:AdvertisementRegistration:0002";
        public const string ProductMismatch =
            "FoodSafe:AdvertisementRegistration:0003";
        public const string AlreadyRevoked =
            "FoodSafe:AdvertisementRegistration:0004";
        public const string CannotModifyRevoked =
            "FoodSafe:AdvertisementRegistration:0005";
        public const string AdvertisementTypeNotFound =
            "FoodSafe:AdvertisementRegistration:0006";
        public const string ProductsRequired =
            "FoodSafe:AdvertisementRegistration:0007";
    }

    public static class EligibilityCertificate
    {
        public const string DuplicateNumber =
            "FoodSafe:EligibilityCertificate:0001";
        public const string InvalidDateRange =
            "FoodSafe:EligibilityCertificate:0002";
        public const string AlreadyRevoked =
            "FoodSafe:EligibilityCertificate:0003";
        public const string CannotModifyRevoked =
            "FoodSafe:EligibilityCertificate:0004";
        public const string CannotChangeBusiness =
            "FoodSafe:EligibilityCertificate:0005";
    }

    public static class CfsCertificate
    {
        public const string DuplicateNumber =
            "FoodSafe:CfsCertificate:0001";
        public const string InvalidDateRange =
            "FoodSafe:CfsCertificate:0002";
        public const string ProductMismatch =
            "FoodSafe:CfsCertificate:0003";
        public const string AlreadyRevoked =
            "FoodSafe:CfsCertificate:0004";
        public const string CannotModifyRevoked =
            "FoodSafe:CfsCertificate:0005";
        public const string CountryNotFound =
            "FoodSafe:CfsCertificate:0006";
    }

    public static class ExportFoodCertificate
    {
        public const string DuplicateNumber =
            "FoodSafe:ExportFoodCertificate:0001";
        public const string InvalidDateRange =
            "FoodSafe:ExportFoodCertificate:0002";
        public const string ProductMismatch =
            "FoodSafe:ExportFoodCertificate:0003";
        public const string AlreadyRevoked =
            "FoodSafe:ExportFoodCertificate:0004";
        public const string CannotModifyRevoked =
            "FoodSafe:ExportFoodCertificate:0005";
        public const string CountryNotFound =
            "FoodSafe:ExportFoodCertificate:0006";
        public const string InvalidIssueDate =
            "FoodSafe:ExportFoodCertificate:0007";
    }

    public static class Inspection
    {
        public const string PlanNotFound = "FoodSafe:Inspection:0001";
        public const string CannotModifyNonDraft = "FoodSafe:Inspection:0002";
        public const string DuplicateBusiness = "FoodSafe:Inspection:0003";
        public const string EmptyPlan = "FoodSafe:Inspection:0004";
        public const string InvalidStatusTransition = "FoodSafe:Inspection:0005";
        public const string CannotCancelCompleted = "FoodSafe:Inspection:0006";
        public const string BusinessNotInPlan = "FoodSafe:Inspection:0007";
        public const string InvalidDateRange = "FoodSafe:Inspection:0008";
        public const string RejectReasonRequired = "FoodSafe:Inspection:0009";
        public const string CancelReasonRequired = "FoodSafe:Inspection:0010";
        public const string ResultNotFound = "FoodSafe:Inspection:0011";
        public const string ViolationNotFound = "FoodSafe:Inspection:0012";
        public const string ViolationAlreadyRemedied = "FoodSafe:Inspection:0013";
        public const string DuplicatePlanCode = "FoodSafe:Inspection:0014";
        public const string PlanNotApproved = "FoodSafe:Inspection:0015";
        public const string ResultAlreadyFinalized = "FoodSafe:Inspection:0016";
        public const string CannotModifyFinalizedResult =
            "FoodSafe:Inspection:0017";
        public const string PlanItemWithoutPlan = "FoodSafe:Inspection:0018";
        public const string ResultBusinessMismatch = "FoodSafe:Inspection:0019";
        public const string FutureInspectionDate = "FoodSafe:Inspection:0020";
    }

    public static class Report
    {
        public const string NotFound = "FoodSafe:Report:0001";
        public const string CannotSubmitNonDraft = "FoodSafe:Report:0002";
        public const string CannotVerifyNonSubmitted = "FoodSafe:Report:0003";
        public const string CannotReturnNonSubmittedOrVerified = "FoodSafe:Report:0004";
        public const string CannotCompleteNonVerified = "FoodSafe:Report:0005";
        public const string CannotModifyNonDraft = "FoodSafe:Report:0006";
        public const string ReturnReasonRequired = "FoodSafe:Report:0007";
        public const string CanOnlyNotifyErrorOnSubmittedOrVerified = "FoodSafe:Report:0008";
        public const string InvalidPeriod = "FoodSafe:Report:0009";
        public const string DuplicatePeriod = "FoodSafe:Report:0010";
        public const string CannotReturnToDraftNonReturned = "FoodSafe:Report:0011";
        public const string CannotInternallyApproveNonDraft = "FoodSafe:Report:0012";
        public const string CannotSubmitNonInternallyApproved = "FoodSafe:Report:0013";
    }

    public static class Catalog
    {
        public const string DuplicateCode = "FoodSafe:Catalog:0001";
        public const string InUse = "FoodSafe:Catalog:0002";
        public const string InvalidCountryCode = "FoodSafe:Catalog:0003";
        public const string InvalidDistrictType = "FoodSafe:Catalog:0004";
        public const string InvalidCommuneType = "FoodSafe:Catalog:0005";
        public const string InvalidRiskLevel = "FoodSafe:Catalog:0006";
        public const string InvalidProductGroupHierarchy = "FoodSafe:Catalog:0007";
        public const string InvalidTestingService = "FoodSafe:Catalog:0008";
    }

    public static class FoodPoisoning
    {
        public const string CaseNotFound = "FoodSafe:FoodPoisoning:0001";
        public const string IncidentNotFound = "FoodSafe:FoodPoisoning:0002";
        public const string InvalidStatusTransition = "FoodSafe:FoodPoisoning:0003";
        public const string CanOnlyReportErrorOnVerified = "FoodSafe:FoodPoisoning:0004";
        public const string ConclusionRequired = "FoodSafe:FoodPoisoning:0005";
        public const string CannotModifyNonDraft = "FoodSafe:FoodPoisoning:0006";
        public const string ErrorReportNotFound = "FoodSafe:FoodPoisoning:0007";
        public const string ErrorReportAlreadyProcessed = "FoodSafe:FoodPoisoning:0008";
        public const string IncidentNotConcluded = "FoodSafe:FoodPoisoning:0009";
    }

    public static class Alert
    {
        public const string NotFound = "FoodSafe:Alert:0001";
        public const string InvalidStatusTransition = "FoodSafe:Alert:0002";
        public const string CanOnlyRecallPublished = "FoodSafe:Alert:0003";
        public const string CannotModifyNonDraft = "FoodSafe:Alert:0004";
        public const string BusinessNotAccessible = "FoodSafe:Alert:0005";
    }

    public static class News
    {
        public const string NotFound = "FoodSafe:News:0001";
        public const string InvalidStatusTransition = "FoodSafe:News:0002";
        public const string CanOnlyRecallPublished = "FoodSafe:News:0003";
        public const string CannotModifyNonDraft = "FoodSafe:News:0004";
        public const string DuplicateLinkedAlert = "FoodSafe:News:0005";
        public const string LinkedAlertNotFound = "FoodSafe:News:0006";
        public const string LinkedAlertNotAccessible = "FoodSafe:News:0007";
    }

    public static class RiskAnalysis
    {
        public const string NotFound = "FoodSafe:RiskAnalysis:0001";
        public const string CannotModifyNonDraft = "FoodSafe:RiskAnalysis:0002";
    }

    public static class TestingResult
    {
        public const string NotFound = "FoodSafe:TestingResult:0001";
        public const string TestingCenterRequired = "FoodSafe:TestingResult:0002";
        public const string TestingCenterNotFound = "FoodSafe:TestingResult:0003";
        public const string TestingServiceNotFound = "FoodSafe:TestingResult:0004";
        public const string BusinessOutOfScope = "FoodSafe:TestingResult:0005";
        public const string ProductMismatch = "FoodSafe:TestingResult:0006";
        public const string InspectionResultMismatch = "FoodSafe:TestingResult:0007";
    }

    public static class Document
    {
        public const string NotFound = "FoodSafe:Document:0001";
        public const string DocumentTypeNotFound = "FoodSafe:Document:0002";
        public const string InvalidStatus = "FoodSafe:Document:0003";
    }

    public static class DataIntegration
    {
        public const string EndpointNotFound = "FoodSafe:DataIntegration:0001";
        public const string CallLogNotFound = "FoodSafe:DataIntegration:0002";
        public const string PartnerNotFound = "FoodSafe:DataIntegration:0003";
        public const string PartnerCodeAlreadyExists = "FoodSafe:DataIntegration:0004";
        public const string PartnerKeyNotFound = "FoodSafe:DataIntegration:0005";
        public const string SubmissionNotFound = "FoodSafe:DataIntegration:0006";
        public const string SpecNotFound = "FoodSafe:DataIntegration:0007";
        public const string SpecVersionAlreadyPublished = "FoodSafe:DataIntegration:0008";
        public const string SubmissionAlreadyDisposed = "FoodSafe:DataIntegration:0009";
    }
}
