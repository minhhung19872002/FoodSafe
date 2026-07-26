import type { ThemeConfig } from "antd";

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#00796B",
    colorInfo: "#0958D9",
    colorSuccess: "#389E0D",
    colorWarning: "#D48806",
    colorError: "#CF1322",
    borderRadius: 6,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'",
    colorBgLayout: "#F0F2F5",
  },
  components: {
    Layout: {
      siderBg: "#001529",
      headerBg: "#ffffff",
      bodyBg: "#F0F2F5",
    },
    Menu: {
      darkItemBg: "transparent",
      darkSubMenuItemBg: "transparent",
      itemHeight: 40,
      groupTitleFontSize: 11,
      groupTitleColor: "rgba(255, 255, 255, 0.45)",
    },
    Table: {
      headerBg: "#FAFAFA",
      rowHoverBg: "#F5F5F5",
    },
    Card: {
      paddingLG: 20,
    },
    Breadcrumb: {
      fontSize: 13,
    },
  },
};

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;
export const HEADER_HEIGHT = 56;
