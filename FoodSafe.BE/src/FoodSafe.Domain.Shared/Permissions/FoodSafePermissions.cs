namespace FoodSafe.Permissions;

public static class FoodSafePermissions
{
    public const string GroupName = "FoodSafe";

    public static class Organizations
    {
        public const string Default = GroupName + ".Organizations";
        public const string View = Default + ".View";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
    }

    public static class GeographicCatalogs
    {
        public const string Default = GroupName + ".GeographicCatalogs";
        public const string View = Default + ".View";
        public const string Manage = Default + ".Manage";
    }

    public static class Catalogs
    {
        public const string Default = GroupName + ".Catalogs";
        public const string View = Default + ".View";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
    }

    public static class BusinessManagement
    {
        public const string Default = GroupName + ".BusinessManagement";

        public static class Businesses
        {
            public const string Default = BusinessManagement.Default + ".Businesses";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string Import = Default + ".Import";
        }

        public static class Products
        {
            public const string Default = BusinessManagement.Default + ".Products";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string Import = Default + ".Import";
        }

        public static class SelfDeclarations
        {
            public const string Default =
                BusinessManagement.Default + ".SelfDeclarations";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }
    }

    public static class Licensing
    {
        public const string Default = GroupName + ".Licensing";

        public static class ProductRegistrations
        {
            public const string Default =
                Licensing.Default + ".ProductRegistrations";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }

        public static class AdRegistrations
        {
            public const string Default =
                Licensing.Default + ".AdRegistrations";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }

        public static class EligibilityCertificates
        {
            public const string Default =
                Licensing.Default + ".EligibilityCertificates";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }

        public static class CfsCertificates
        {
            public const string Default =
                Licensing.Default + ".CfsCertificates";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }

        public static class ExportCertificates
        {
            public const string Default =
                Licensing.Default + ".ExportCertificates";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }
    }

    public static class Inspection
    {
        public const string Default = GroupName + ".Inspection";

        public static class Plans
        {
            public const string Default = Inspection.Default + ".Plans";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string Approve = Default + ".Approve";
        }

        public static class Results
        {
            public const string Default = Inspection.Default + ".Results";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }
    }

    public static class AlertsAndTesting
    {
        public const string Default = GroupName + ".AlertsAndTesting";

        public static class Alerts
        {
            public const string Default = AlertsAndTesting.Default + ".Alerts";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string Publish = Default + ".Publish";
        }

        public static class News
        {
            public const string Default = AlertsAndTesting.Default + ".News";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string Publish = Default + ".Publish";
        }
    }

    public static class FoodPoisoning
    {
        public const string Default = GroupName + ".FoodPoisoning";

        public static class Cases
        {
            public const string Default = FoodPoisoning.Default + ".Cases";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string Verify = Default + ".Verify";
        }

        public static class Incidents
        {
            public const string Default = FoodPoisoning.Default + ".Incidents";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string Verify = Default + ".Verify";
            public const string Conclude = Default + ".Conclude";
        }
    }

    public static class Reporting
    {
        public const string Default = GroupName + ".Reporting";

        public static class NdtpReports
        {
            public const string Default = Reporting.Default + ".NdtpReports";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string Submit = Default + ".Submit";
            public const string Verify = Default + ".Verify";
            public const string Return = Default + ".Return";
            public const string Complete = Default + ".Complete";
        }

        public static class AtpWorkReports
        {
            public const string Default = Reporting.Default + ".AtpWorkReports";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string Submit = Default + ".Submit";
            public const string Verify = Default + ".Verify";
            public const string Return = Default + ".Return";
            public const string Complete = Default + ".Complete";
        }

        public static class ActionMonthReports
        {
            public const string Default = Reporting.Default + ".ActionMonthReports";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string Submit = Default + ".Submit";
            public const string Verify = Default + ".Verify";
            public const string Return = Default + ".Return";
            public const string Complete = Default + ".Complete";
        }
    }

    public static class SystemAdministration
    {
        public const string Default = GroupName + ".SystemAdmin";

        public static class Users
        {
            public const string Default =
                SystemAdministration.Default + ".Users";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string ManageRoles = Default + ".ManageRoles";
            public const string ManageScope = Default + ".ManageScope";
            public const string Activate = Default + ".Activate";
            public const string Lock = Default + ".Lock";
            public const string ResetPassword = Default + ".ResetPassword";
            public const string ViewActivity = Default + ".ViewActivity";
        }

        public static class Roles
        {
            public const string Default =
                SystemAdministration.Default + ".Roles";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
            public const string ManagePermissions =
                Default + ".ManagePermissions";
        }

        public const string AuditLogs = Default + ".AuditLogs";
        public const string Settings = Default + ".Settings";
    }

    public static class DataScope
    {
        public const string All = GroupName + ".DataScope.All";
    }
}
