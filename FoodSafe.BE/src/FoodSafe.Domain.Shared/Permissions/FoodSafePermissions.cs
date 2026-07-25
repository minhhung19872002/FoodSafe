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
