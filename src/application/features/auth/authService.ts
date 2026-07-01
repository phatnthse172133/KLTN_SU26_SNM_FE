import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, UserProfile } from "@/shared/types";

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  role: string;
  user: UserProfile;
}

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    return apiClient.post<BaseResponse<AuthPayload>>("/auth/login", {
      emailOrUserName: credentials.email,
      password: credentials.password
    });
  },
  registerCustomer: async (data: { userName: string; fullName: string; email: string; password: string; confirmPassword: string }) => {
    return apiClient.post<BaseResponse<{ id: string; email: string; role: string }>>("/auth/register/customer", data);
  },
  registerBoothOwner: async (data: { userName: string; fullName: string; email: string; password: string; confirmPassword: string }) => {
    return apiClient.post<BaseResponse<{ id: string; email: string; role: string }>>("/auth/register/booth-owner", data);
  },
  googleLogin: async (idToken: string) => {
    return apiClient.post<BaseResponse<AuthPayload>>("/auth/google-login", { idToken });
  },
  verifyEmail: async (token: string) => {
    return apiClient.get<BaseResponse<{ id: string }>>(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  },
  resendVerification: async (email: string) => {
    return apiClient.post<BaseResponse<object>>("/auth/resend-verification", { email });
  },
  forgotPassword: async (email: string) => {
    return apiClient.post<BaseResponse<object>>("/auth/forgot-password", { email });
  },
  verifyPasswordResetOtp: async (data: { email: string; otp: string }) => {
    return apiClient.post<BaseResponse<object>>("/auth/verify-password-reset-otp", data);
  },
  resetPassword: async (data: { email: string; otp: string; newPassword: string; confirmNewPassword: string }) => {
    return apiClient.post<BaseResponse<object>>("/auth/reset-password", data);
  },
  resetPasswordByToken: async (data: { token: string; newPassword: string; confirmNewPassword: string }) => {
    return apiClient.post<BaseResponse<object>>("/auth/reset-password-by-token", data);
  },
  refreshToken: async (refreshToken: string) => {
    return apiClient.post<BaseResponse<AuthPayload>>("/auth/refresh-token", { refreshToken });
  },
  logout: async (refreshToken: string) => {
    return apiClient.post<BaseResponse<object>>("/auth/logout", { refreshToken });
  },
};
