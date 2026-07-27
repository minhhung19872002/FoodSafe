import { Button, Result, Space } from "antd";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { NotFoundPage } from "./NotFoundPage";

const NOT_FOUND_STATUS = 404;

function reloadPage() {
  window.location.reload();
}

/**
 * Màn hình lỗi cho toàn bộ cây route (`errorElement` của route gốc).
 *
 * Không có nó, mọi lỗi render / lỗi tải lazy chunk đều rơi vào màn hình mặc định
 * tiếng Anh của React Router ("Unexpected Application Error!") — không header,
 * không menu, không lối quay lại.
 *
 * Hai loại lỗi được phân biệt bằng `isRouteErrorResponse`:
 * - Lỗi điều hướng (`Response` do router ném ra, ví dụ 404) — đường dẫn sai.
 * - Lỗi do component ném ra khi render — sự cố kỹ thuật.
 *
 * Chi tiết kỹ thuật (stack trace, `statusText` tiếng Anh của framework) chỉ ghi
 * ra console cho lập trình viên, tuyệt đối không hiển thị cho người dùng.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  console.error("[FoodSafe] Lỗi điều hướng:", error);

  if (isRouteErrorResponse(error) && error.status === NOT_FOUND_STATUS) {
    return <NotFoundPage />;
  }

  const recoveryActions = (
    <Space>
      <Button type="primary" onClick={reloadPage}>
        Tải lại trang
      </Button>
      <Button href="/">Về trang chủ</Button>
    </Space>
  );

  if (isRouteErrorResponse(error)) {
    return (
      <Result
        status="error"
        title="Không mở được trang"
        subTitle={`Máy chủ từ chối yêu cầu (mã lỗi ${error.status}). Vui lòng tải lại trang; nếu vẫn không được, hãy liên hệ quản trị viên hệ thống.`}
        extra={recoveryActions}
      />
    );
  }

  return (
    <Result
      status="500"
      title="Đã xảy ra lỗi ngoài dự kiến"
      subTitle="Hệ thống không hiển thị được nội dung của trang này. Vui lòng tải lại trang; nếu lỗi vẫn tiếp diễn, hãy liên hệ quản trị viên hệ thống."
      extra={recoveryActions}
    />
  );
}
