import type { ThemeConfig } from "antd";

/**
 * Design tokens của bộ nhận diện FoodSafe Quảng Ninh.
 * Dùng chung cho cả hệ thống quản trị và cổng thông tin công khai.
 */
export const brand = {
  /** Xanh chủ đạo — nút chính, liên kết, nhấn mạnh */
  green: "#128A3E",
  greenDark: "#0A6B2E",
  greenMid: "#3FA35D",
  greenLight: "#AFD8B2",
  greenPale: "#E4F3E4",
  greenSoft: "#8FCBA1",
  mint: "#CFEAD0",
  /** Xanh rất đậm — sidebar, footer */
  ink: "#10281A",
  body: "#26332A",
  sub: "#4B5F50",
  muted: "#6B7F70",
  faint: "#96AC9B",
  dim: "#5F7A64",
  /** Đường viền và nền */
  line: "#DCE7DB",
  lineSoft: "#EBF2EA",
  border: "#D1DED0",
  bg: "#F4F7F3",
  bgSoft: "#F6FAF5",
  bgHead: "#F0F5EF",
  /** Màu nhấn phụ */
  gold: "#F0C86B",
  red: "#C0392B",
  redDark: "#96281D",
  amber: "#B45309",
  blue: "#2563EB",
  navy: "#1E3A8A",
  success: "#2E7D32",
} as const;

/** Nền/chữ của các nhãn trạng thái hồ sơ, giấy phép. */
export const statusPalette = {
  valid: { label: "Còn hiệu lực", bg: "#E9F5EB", color: "#2E7D32" },
  expiring: { label: "Sắp hết hạn", bg: "#FBF1E2", color: "#B45309" },
  expired: { label: "Hết hiệu lực", bg: "#EBF2EA", color: "#6B7F70" },
  revoked: { label: "Đã thu hồi", bg: "#FBEAE7", color: "#C0392B" },
} as const;

export const FONT_FAMILY =
  "'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: brand.green,
    colorLink: brand.green,
    colorLinkHover: brand.greenDark,
    colorInfo: brand.blue,
    colorSuccess: brand.success,
    colorWarning: brand.amber,
    colorError: brand.red,
    colorTextBase: brand.body,
    colorBorder: brand.border,
    colorBorderSecondary: brand.line,
    borderRadius: 10,
    fontFamily: FONT_FAMILY,
    colorBgLayout: brand.bg,
  },
  components: {
    Layout: {
      siderBg: brand.ink,
      headerBg: "#ffffff",
      bodyBg: brand.bg,
    },
    Menu: {
      darkItemBg: "transparent",
      darkSubMenuItemBg: "transparent",
      darkItemColor: brand.faint,
      darkItemHoverBg: "rgba(255, 255, 255, 0.06)",
      darkItemHoverColor: "#ffffff",
      darkItemSelectedBg: "rgba(18, 138, 62, 0.3)",
      darkItemSelectedColor: "#ffffff",
      itemHeight: 38,
      itemBorderRadius: 9,
      groupTitleColor: brand.dim,
    },
    Table: {
      headerBg: brand.bgHead,
      headerColor: brand.muted,
      rowHoverBg: brand.bgSoft,
      borderColor: brand.lineSoft,
    },
    Card: {
      paddingLG: 20,
      colorBorderSecondary: brand.line,
      borderRadiusLG: 14,
    },
    Breadcrumb: {
      fontSize: 13,
      itemColor: brand.faint,
      lastItemColor: brand.ink,
      separatorColor: brand.border,
    },
    Button: {
      fontWeight: 600,
      primaryShadow: "none",
      defaultShadow: "none",
    },
    Input: {
      activeShadow: `0 0 0 3px ${brand.greenPale}`,
    },
  },
};

export const SIDEBAR_WIDTH = 248;
export const SIDEBAR_COLLAPSED_WIDTH = 64;
export const HEADER_HEIGHT = 58;
