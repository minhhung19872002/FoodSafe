import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useBranding } from "@/hooks/useBranding";

interface NavEntry {
  to: string;
  label: string;
}

/** Thứ tự và nhãn theo bản thiết kế; hai mục cuối là route sẵn có của hệ thống. */
const NAV_ITEMS: NavEntry[] = [
  { to: "/cong-thong-tin", label: "Trang chủ" },
  { to: "/tra-cuu-chung", label: "Tra cứu" },
  { to: "/co-so-bi-canh-bao", label: "Cơ sở bị cảnh báo" },
  { to: "/tin-tuc", label: "Tin tức" },
  { to: "/tra-cuu-van-ban", label: "Văn bản" },
  { to: "/gui-phan-anh", label: "Gửi phản ánh" },
  { to: "/tra-cuu-giay-phep", label: "Tra cứu giấy phép" },
  { to: "/gui-tin", label: "Gửi tin" },
];

const DEFAULT_HOTLINE = "0981 815 815";
const DEFAULT_ADDRESS =
  "Tầng 18, Tòa nhà liên cơ quan số 3, P. Hồng Hà, TP. Hạ Long";
const DEFAULT_EMAIL = "ccvsattp@quangninh.gov.vn";

/**
 * Cấu hình branding trả về chuỗi rỗng khi quản trị viên chưa nhập, nên `??`
 * không đủ — phải coi chuỗi rỗng/khoảng trắng là chưa có giá trị.
 */
function orDefault(value: string | undefined, fallback: string): string {
  return value?.trim() ? value.trim() : fallback;
}

interface PublicShellProps {
  children: ReactNode;
  /** Trang chủ tự quản lý chiều rộng để hero tràn viền. */
  fullBleed?: boolean;
}

export function PublicShell({ children, fullBleed = false }: PublicShellProps) {
  const navigate = useNavigate();
  const branding = useBranding();
  const hotline = orDefault(branding.data?.contactPhone, DEFAULT_HOTLINE);
  const email = orDefault(branding.data?.contactEmail, DEFAULT_EMAIL);
  const address = orDefault(branding.data?.contactAddress, DEFAULT_ADDRESS);

  return (
    <div className="portal-layout">
      <div className="portal-strip">
        <span>Chi cục An toàn vệ sinh thực phẩm — Sở Y tế Quảng Ninh</span>
        <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span>
            Hotline: <strong>{hotline}</strong>
          </span>
          <Link to="/login" className="portal-strip-login">
            Đăng nhập cán bộ →
          </Link>
        </span>
      </div>

      <header className="portal-header">
        <div className="portal-header-inner">
          <div
            className="portal-brand"
            role="link"
            tabIndex={0}
            onClick={() => navigate("/cong-thong-tin")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate("/cong-thong-tin");
              }
            }}
          >
            <div className="portal-brand-mark">AT</div>
            <div>
              <div className="portal-brand-name">
                Chi cục An toàn vệ sinh thực phẩm
              </div>
              <div className="portal-brand-sub">
                Sở Y tế Quảng Ninh · Cổng tra cứu công khai
              </div>
            </div>
          </div>

          <nav className="portal-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "portal-nav-link is-active" : "portal-nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="portal-main">
        {fullBleed ? (
          children
        ) : (
          <div className="portal-section">{children}</div>
        )}
      </main>

      <footer className="portal-footer">
        <div className="portal-footer-inner">
          <div>
            <div className="portal-footer-brand">
              <div className="portal-footer-mark">AT</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                Cổng thông tin An toàn thực phẩm Quảng Ninh
              </div>
            </div>
            <div className="portal-footer-text">
              Chi cục An toàn vệ sinh thực phẩm — Sở Y tế Quảng Ninh
              <br />
              {address}
            </div>
          </div>

          <div>
            <div className="portal-footer-title">Tra cứu</div>
            <div className="portal-footer-links">
              <Link to="/tra-cuu-giay-phep">Tra cứu giấy phép</Link>
              <Link to="/co-so-bi-canh-bao">Cơ sở bị cảnh báo</Link>
              <Link to="/tra-cuu-van-ban">Văn bản pháp quy</Link>
            </div>
          </div>

          <div>
            <div className="portal-footer-title">Hỗ trợ</div>
            <div className="portal-footer-text">
              Hotline: <span className="portal-footer-hotline">{hotline}</span>
              <br />
              Email: {email}
              <br />
              Giờ hành chính: T2–T6, 8:00–17:00
            </div>
          </div>
        </div>

        <div className="portal-footer-bottom">
          © {new Date().getFullYear()} Chi cục An toàn vệ sinh thực phẩm Quảng
          Ninh — Cổng thông tin công khai ATTP
        </div>
      </footer>
    </div>
  );
}
