import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { describeApiError } from "@/lib/apiError";
import { authApi } from "./authApi";
import { useAuthStore } from "../store/authStore";
import type {
  ChangePasswordRequest,
  CompleteInitialPasswordChangeRequest,
  LoginRequest,
} from "../types/auth.types";

/**
 * `LoginResultType` mà `POST /api/account/login` trả về.
 *
 * Giá trị số đọc trực tiếp từ assembly đang dùng — `Volo.Abp.Account.Web` 9.3.7,
 * `Areas/Account/Controllers/Models/LoginResultType.cs` — không suy đoán.
 * `AccountController.GetAbpLoginResult` ánh xạ `SignInResult` sang các mã này
 * theo thứ tự: khóa tài khoản → 2FA → không được phép → thành công → sai mật khẩu.
 */
const LOGIN_RESULT = {
  success: 1,
  invalidUserNameOrPassword: 2,
  notAllowed: 3,
  lockedOut: 4,
  requiresTwoFactor: 5,
} as const;

/**
 * Mỗi lý do từ chối một thông điệp riêng. Gộp tất cả thành "sai mật khẩu" khiến
 * người dùng bị khóa tài khoản tiếp tục thử và tự kéo dài thời gian khóa —
 * trong khi chính sách khóa là tính năng cấu hình được của quản trị viên.
 *
 * `notAllowed` không nằm ở đây: nó được xử lý bằng điều hướng (xem
 * {@link InitialPasswordChangeRequiredError}).
 */
const LOGIN_FAILURE_MESSAGES: Readonly<Record<number, string | undefined>> = {
  [LOGIN_RESULT.invalidUserNameOrPassword]:
    "Tên đăng nhập hoặc mật khẩu không đúng.",
  [LOGIN_RESULT.lockedOut]:
    "Tài khoản đã bị tạm khóa do đăng nhập sai quá số lần cho phép. Vui lòng đợi hết thời gian khóa rồi thử lại, hoặc liên hệ quản trị viên để được mở khóa.",
  [LOGIN_RESULT.requiresTwoFactor]:
    "Tài khoản yêu cầu xác thực hai bước. Vui lòng liên hệ quản trị viên để được hỗ trợ đăng nhập.",
};

const UNKNOWN_LOGIN_FAILURE_MESSAGE =
  "Không đăng nhập được. Vui lòng thử lại hoặc liên hệ quản trị viên.";

/** Mã lỗi của middleware CAPTCHA phía máy chủ — thông điệp gốc là tiếng Anh. */
const CAPTCHA_ERROR_CODE = "FoodSafe:Captcha:0001";

const CAPTCHA_FAILURE_MESSAGE =
  "Xác minh CAPTCHA không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại xác minh rồi đăng nhập.";

/**
 * Dữ liệu nghiệp vụ trong QueryClient được giới hạn theo người dùng hiện tại.
 * Giữ lại cache khi đổi tài khoản có thể làm phiên mới nhìn thấy lựa chọn đơn
 * vị của phiên cũ; thao tác sau đó sẽ bị backend từ chối vì ngoài phạm vi.
 */
function clearSessionQueryCache(queryClient: QueryClient): void {
  queryClient.removeQueries();
}

/**
 * ABP trả `NotAllowed` khi tài khoản chưa được phép đăng nhập bằng mật khẩu hiện
 * tại. `AbpSignInManager.PreSignInCheck` trả mã này cho ba trường hợp: bắt buộc
 * đổi mật khẩu ở lần đăng nhập tới, mật khẩu đã hết hạn theo chu kỳ, và tài khoản
 * bị vô hiệu hóa. Hai trường hợp đầu chiếm gần như toàn bộ thực tế và đều được
 * giải quyết ở màn hình đổi mật khẩu, nên điều hướng sang đó; tài khoản bị vô
 * hiệu hóa sẽ bị máy chủ từ chối tiếp tại đúng màn hình này.
 */
class InitialPasswordChangeRequiredError extends Error {
  readonly userNameOrEmailAddress: string;

  constructor(userNameOrEmailAddress: string) {
    super("Initial password change required");
    this.userNameOrEmailAddress = userNameOrEmailAddress;
  }
}

/** Máy chủ đã phản hồi nhưng từ chối đăng nhập, kèm mã `LoginResultType`. */
class LoginRejectedError extends Error {
  readonly result: number;

  constructor(result: number) {
    super(`Login rejected with LoginResultType ${result}`);
    this.result = result;
  }
}

/**
 * Chọn thông điệp tiếng Việt đúng với lý do thất bại.
 *
 * - Máy chủ từ chối đăng nhập → thông điệp theo `LoginResultType`. Trường
 *   `description` của ABP luôn chỉ là tên enum tiếng Anh (`AbpLoginResult
 *   .Description => Result.ToString()`) nên không bao giờ được hiển thị.
 * - Không có phản hồi (mất mạng, máy chủ chết) hoặc phản hồi lỗi HTTP (CAPTCHA
 *   sai, vượt giới hạn tần suất, lỗi 5xx) → `describeApiError` phân loại và trả
 *   thông điệp tiếng Việt tương ứng, tuyệt đối không phải "sai mật khẩu".
 */
function describeLoginFailure(error: unknown): string {
  if (error instanceof LoginRejectedError) {
    return (
      LOGIN_FAILURE_MESSAGES[error.result] ?? UNKNOWN_LOGIN_FAILURE_MESSAGE
    );
  }

  const info = describeApiError(error);
  return info.code === CAPTCHA_ERROR_CODE
    ? CAPTCHA_FAILURE_MESSAGE
    : info.message;
}

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await authApi.login(data);
      if (response.result === LOGIN_RESULT.notAllowed) {
        throw new InitialPasswordChangeRequiredError(
          data.userNameOrEmailAddress,
        );
      }
      if (response.result !== LOGIN_RESULT.success) {
        throw new LoginRejectedError(response.result);
      }
      const user = await authApi.getCurrentUser();
      return user;
    },
    onSuccess: (user) => {
      clearSessionQueryCache(queryClient);
      queryClient.setQueryData(["auth", "current-user"], user);
      setAuth({
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        roles: user.roles,
        permissions: user.permissions,
      });

      if (user.passwordMustChange) {
        navigate("/account/change-password");
      } else {
        navigate("/");
      }
    },
    onError: (error) => {
      if (error instanceof InitialPasswordChangeRequiredError) {
        navigate("/account/complete-password-change", {
          state: { userName: error.userNameOrEmailAddress },
        });
        return;
      }
      message.error(describeLoginFailure(error));
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearSessionQueryCache(queryClient);
      clearAuth();
      navigate("/login");
    },
  });
}

export function useCompleteInitialPasswordChange() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: CompleteInitialPasswordChangeRequest) =>
      authApi.completeInitialPasswordChange(data),
    onSuccess: () => {
      message.success("Mật khẩu đã được thay đổi. Vui lòng đăng nhập.");
      navigate("/login");
    },
    onError: () => {
      message.error(
        "Không thể thay đổi mật khẩu. Kiểm tra thông tin và thử lại.",
      );
    },
  });
}

export function useChangePassword() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      await authApi.changePassword(data);
      return authApi.getCurrentUser();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "current-user"], user);
      setAuth(user);
      message.success("Đổi mật khẩu thành công.");
      navigate("/");
    },
    onError: () => {
      message.error(
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.",
      );
    },
  });
}
