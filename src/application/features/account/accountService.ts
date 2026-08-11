import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse, UserProfile } from "@/shared/types";

export const accountService = {
  getMyAccount: async () => {
    return apiClient.get<BaseResponse<UserProfile>>("/account");
  },
  updateMyAccount: async (data: { fullName: string; phone?: string | null; address?: string | null; doB?: string | null }) => {
    return apiClient.put<BaseResponse<UserProfile>>("/account", data);
  },
  updateAvatar: async (avatarUrl: string) => {
    return apiClient.put<BaseResponse<UserProfile>>("/account/avatar", { avatarUrl });
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<BaseResponse<UserProfile>>("/account/avatar", formData);
  },
  changePassword: async (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) => {
    return apiClient.post<BaseResponse<object>>("/account/change-password", data);
  },
  getUsers: async (page = 1, pageSize = 10, keyword?: string) => {
    return apiClient.get<BaseResponse<PaginationResponse<UserProfile>>>(`/account/users${buildQuery({ Page: page, PageSize: pageSize, Keyword: keyword })}`);
  },
  getUser: async (userId: string) => {
    return apiClient.get<BaseResponse<UserProfile>>(`/account/users/${userId}`);
  },
  changeUserStatus: async (userId: string, status: number, reason: string) => {
    return apiClient.put<BaseResponse<UserProfile>>(`/account/users/${userId}/status`, { status, reason });
  },
};
