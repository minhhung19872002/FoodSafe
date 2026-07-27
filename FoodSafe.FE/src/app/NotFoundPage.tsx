import { Button, Result } from "antd";

/**
 * Màn hình 404 dùng chung cho route `*` và cho lỗi điều hướng 404 của
 * React Router ({@link RouteErrorBoundary}).
 *
 * Nút "Về trang chủ" là thẻ `<a href="/">` chứ không dùng `useNavigate`: component
 * này còn được render từ `errorElement` — lúc đó cây route hiện tại có thể đang ở
 * trạng thái hỏng — nên tải lại trang từ đầu là cách quay về chắc chắn nhất.
 */
export function NotFoundPage() {
  return (
    <Result
      status="404"
      title="Không tìm thấy trang"
      subTitle="Đường dẫn bạn truy cập không tồn tại hoặc đã được chuyển sang địa chỉ khác. Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ."
      extra={
        <Button type="primary" href="/">
          Về trang chủ
        </Button>
      }
    />
  );
}
