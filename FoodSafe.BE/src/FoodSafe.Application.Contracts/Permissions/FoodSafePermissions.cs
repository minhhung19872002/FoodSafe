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
}
