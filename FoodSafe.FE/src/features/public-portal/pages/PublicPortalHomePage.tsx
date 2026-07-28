import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Skeleton } from "antd";
import dayjs from "dayjs";
import { brand } from "@/theme/themeConfig";
import { usePublicCounts } from "@/hooks/usePublicCounts";
import { PublicShell } from "../components/PublicShell";
import { usePublicAlerts, usePublicNews } from "../api/publicPortalQueries";
import {
  ALERT_SEVERITY,
  type AlertSeverity,
} from "../types/publicPortal.types";

interface PortalTile {
  title: string;
  description: string;
  to: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

const PORTAL_TILES: PortalTile[] = [
  {
    title: "Cơ sở SXKD thực phẩm",
    description: "Kiểm tra cơ sở đã đăng ký quản lý ATTP",
    to: "/tra-cuu-co-so",
    icon: "🏭",
    iconBg: brand.greenPale,
    iconColor: brand.greenDark,
  },
  {
    title: "Hồ sơ tự công bố",
    description: "Sản phẩm doanh nghiệp tự công bố chất lượng",
    to: "/tra-cuu-tu-cong-bo",
    icon: "📄",
    iconBg: "#E8EFFD",
    iconColor: brand.navy,
  },
  {
    title: "Đăng ký công bố sản phẩm",
    description: "TPBVSK, phụ gia, sản phẩm dinh dưỡng đặc biệt",
    to: "/tra-cuu-dang-ky-cong-bo",
    icon: "✅",
    iconBg: brand.greenPale,
    iconColor: brand.greenDark,
  },
  {
    title: "Giấy đủ điều kiện ATTP",
    description: "Cơ sở sản xuất, kinh doanh, dịch vụ ăn uống",
    to: "/tra-cuu-giay-du-dieu-kien",
    icon: "🛡️",
    iconBg: "#FBF1E2",
    iconColor: brand.amber,
  },
  {
    title: "Xác nhận quảng cáo",
    description: "Nội dung quảng cáo thực phẩm đã được duyệt",
    to: "/tra-cuu-dang-ky-quang-cao",
    icon: "📢",
    iconBg: "#F3E8FD",
    iconColor: "#6B21A8",
  },
  {
    title: "Chứng nhận CFS",
    description: "Certificate of Free Sale cho sản phẩm xuất khẩu",
    to: "/tra-cuu-cfs",
    icon: "🌐",
    iconBg: "#E8EFFD",
    iconColor: brand.navy,
  },
  {
    title: "GCN xuất khẩu thực phẩm",
    description: "Giấy chứng nhận phục vụ xuất khẩu thực phẩm",
    to: "/tra-cuu-gcn-xuat-khau",
    icon: "🚢",
    iconBg: "#FBEAE7",
    iconColor: brand.red,
  },
  {
    title: "Tra cứu giấy phép (tổng hợp)",
    description: "Tra cứu tất cả loại giấy phép, chứng nhận ATTP",
    to: "/tra-cuu-giay-phep",
    icon: "📋",
    iconBg: brand.greenPale,
    iconColor: brand.greenDark,
  },
  {
    title: "Cơ sở bị cảnh báo",
    description: "Cơ sở đang bị cảnh báo vi phạm an toàn thực phẩm",
    to: "/co-so-bi-canh-bao",
    icon: "⚠️",
    iconBg: "#FBEAE7",
    iconColor: brand.red,
  },
  {
    title: "Tin tức & Cảnh báo",
    description: "Tin tức, cảnh báo và phân tích nguy cơ ATTP",
    to: "/tin-tuc",
    icon: "📰",
    iconBg: "#E8EFFD",
    iconColor: brand.blue,
  },
  {
    title: "Văn bản pháp quy",
    description: "Văn bản quy phạm pháp luật về an toàn thực phẩm",
    to: "/tra-cuu-van-ban",
    icon: "📄",
    iconBg: brand.greenPale,
    iconColor: brand.greenDark,
  },
  {
    title: "Gửi phản ánh",
    description: "Phản ánh sự cố an toàn thực phẩm tới cơ quan quản lý",
    to: "/gui-phan-anh",
    icon: "📣",
    iconBg: "#FBEAE7",
    iconColor: brand.red,
  },
];

const PREVIEW = { SkipCount: 0, MaxResultCount: 4 } as const;

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  [ALERT_SEVERITY.Low]: brand.blue,
  [ALERT_SEVERITY.Medium]: brand.amber,
  [ALERT_SEVERITY.High]: brand.red,
  [ALERT_SEVERITY.Critical]: brand.red,
};

const NEWS_THUMBS = [
  "linear-gradient(135deg,#128A3E,#0A6B2E)",
  "linear-gradient(135deg,#2563EB,#1E3A8A)",
  "linear-gradient(135deg,#B45309,#7C2D12)",
  "linear-gradient(135deg,#0F766E,#134E4A)",
];

function formatCount(value: number | undefined): string {
  return (value ?? 0).toLocaleString("vi-VN");
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : "—";
}

export default function PublicPortalHomePage() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState("");

  const counts = usePublicCounts();
  const alerts = usePublicAlerts(PREVIEW);
  const news = usePublicNews(PREVIEW);

  const runSearch = () => {
    const trimmed = heroQuery.trim();
    navigate(
      trimmed
        ? `/tra-cuu-chung?q=${encodeURIComponent(trimmed)}`
        : "/tra-cuu-chung",
    );
  };

  const stats = [
    {
      label: "Cơ sở SXKD được quản lý",
      value: formatCount(counts.data?.businesses),
      color: brand.green,
    },
    {
      label: "Giấy đủ điều kiện ATTP",
      value: formatCount(counts.data?.eligibilityCertificates),
      color: brand.green,
    },
    {
      label: "Hồ sơ tự công bố",
      value: formatCount(counts.data?.selfDeclarations),
      color: brand.blue,
    },
    {
      label: "Cảnh báo đang công khai",
      value: formatCount(counts.data?.alerts),
      color: brand.red,
    },
  ].map((stat) => ({ ...stat, loading: counts.isLoading }));

  return (
    <PublicShell fullBleed>
      {/* ── Hero tra cứu ── */}
      <section className="portal-hero">
        <div className="portal-hero-inner">
          <div className="portal-hero-eyebrow">
            TRA CỨU CÔNG KHAI — MIỄN PHÍ
          </div>
          <h1 className="portal-hero-title">
            Kiểm tra giấy phép an toàn thực phẩm
            <br />
            trước khi bạn tin tưởng
          </h1>
          <p className="portal-hero-lead">
            Tra cứu cơ sở sản xuất kinh doanh, hồ sơ tự công bố, giấy chứng nhận
            ATTP trên địa bàn tỉnh Quảng Ninh.
          </p>

          <div className="portal-hero-search">
            <Input
              value={heroQuery}
              onChange={(event) => setHeroQuery(event.target.value)}
              onPressEnter={runSearch}
              placeholder="Nhập tên cơ sở, số giấy phép, mã số thuế..."
              variant="borderless"
              size="large"
              aria-label="Từ khóa tra cứu"
            />
            <Button type="primary" size="large" onClick={runSearch}>
              Tra cứu
            </Button>
          </div>

          <div className="portal-hero-hint">
            Không rõ bắt đầu từ đâu?{" "}
            <button type="button" onClick={() => navigate("/tra-cuu-chung")}>
              Xem toàn bộ cơ sở và sản phẩm
            </button>
          </div>
        </div>
      </section>

      {/* ── Dải số liệu ── */}
      <section className="portal-stats">
        <div className="portal-stats-inner">
          {stats.map((stat) => (
            <div key={stat.label} className="portal-stat">
              {stat.loading ? (
                <Skeleton
                  active
                  title={{ width: 90 }}
                  paragraph={{ rows: 1, width: 140 }}
                />
              ) : (
                <>
                  <div
                    className="portal-stat-value"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="portal-stat-label">{stat.label}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Dịch vụ tra cứu ── */}
      <section className="portal-section" style={{ paddingTop: 56 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 4px",
            color: brand.ink,
            letterSpacing: "-0.5px",
          }}
        >
          Dịch vụ tra cứu
        </h2>
        <p style={{ color: brand.muted, fontSize: 14, margin: "0 0 24px" }}>
          Chọn loại hồ sơ, giấy phép bạn muốn kiểm tra
        </p>

        <div className="portal-tiles">
          {PORTAL_TILES.map((tile) => (
            <Link key={tile.to} to={tile.to} className="portal-tile">
              <div
                className="portal-tile-icon"
                style={{ background: tile.iconBg, color: tile.iconColor }}
              >
                {tile.icon}
              </div>
              <div>
                <div className="portal-tile-title">{tile.title}</div>
                <div className="portal-tile-desc">{tile.description}</div>
                <div className="portal-tile-more">Tra cứu →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Cảnh báo mới nhất + Tin tức ── */}
      <section className="portal-section" style={{ paddingBottom: 64 }}>
        <div className="portal-split">
          <div className="page-card">
            <div className="portal-block-head">
              <h3 className="portal-block-title">⚠️ Cảnh báo mới nhất</h3>
              <Link to="/co-so-bi-canh-bao" style={{ fontSize: 13 }}>
                Xem tất cả
              </Link>
            </div>

            {alerts.isLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : alerts.data?.items.length ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {alerts.data.items.map((alert) => (
                  <div key={alert.id} className="portal-alert-item">
                    <span
                      className="portal-alert-dot"
                      style={{
                        background: SEVERITY_DOT[alert.severity] ?? brand.amber,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div className="portal-alert-title">{alert.title}</div>
                      <div className="portal-alert-meta">
                        {formatDate(alert.publishedAt)}
                        {alert.affectedArea ? ` · ${alert.affectedArea}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "32px 12px" }}>
                <div className="empty-state-description">
                  Hiện chưa có cảnh báo nào được công khai.
                </div>
              </div>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div className="portal-block-head">
              <h3 className="portal-block-title">Tin tức &amp; truyền thông</h3>
              <Link to="/tin-tuc" style={{ fontSize: 13 }}>
                Xem tất cả
              </Link>
            </div>

            {news.isLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : news.data?.items.length ? (
              <div className="portal-news-grid">
                {news.data.items.map((item, index) => (
                  <Link
                    key={item.id}
                    to={`/tin-tuc/${item.id}`}
                    className="portal-news-card"
                  >
                    <div
                      className="portal-news-thumb"
                      style={{
                        background: NEWS_THUMBS[index % NEWS_THUMBS.length],
                      }}
                    >
                      <span className="portal-news-tag">
                        {item.category || "TIN TỨC"}
                      </span>
                    </div>
                    <div className="portal-news-body">
                      <div className="portal-news-title">{item.title}</div>
                      <div className="portal-news-date">
                        {formatDate(item.publishedAt)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "32px 12px" }}>
                <div className="empty-state-description">
                  Chưa có tin tức nào được đăng tải.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
