namespace FoodSafe.ProductRecalls;

/// <summary>Recall form per Circular 23/2018/TT-BYT.</summary>
public enum RecallType : short
{
    /// <summary>Thu hồi tự nguyện — initiated by the business itself.</summary>
    Voluntary = 1,

    /// <summary>Thu hồi bắt buộc — ordered by a competent authority.</summary>
    Mandatory = 2
}

/// <summary>Post-recall handling per Circular 23/2018/TT-BYT.</summary>
public enum PostRecallAction : short
{
    /// <summary>Khắc phục lỗi ghi nhãn.</summary>
    FixLabeling = 1,

    /// <summary>Chuyển mục đích sử dụng.</summary>
    RepurposeUse = 2,

    /// <summary>Tái xuất.</summary>
    ReExport = 3,

    /// <summary>Tiêu hủy.</summary>
    Destroy = 4
}

public enum ProductRecallStatus : short
{
    Draft = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4
}
