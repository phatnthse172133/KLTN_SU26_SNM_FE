import { apiClient } from "@/infrastructure/api";

export enum FoodTagGroup {
  Category = 0,
  Cuisine = 1,
  Dietary = 2,
  Flavor = 3,
  Ingredient = 4,
  TimeOfDay = 5,
  CookingMethod = 6
}

export enum FoodTagStatus {
  Draft = 0,
  Active = 1,
  Inactive = 2
}

export interface FoodTag {
  id: string;
  name: string;
  code: string;
  description?: string;
  tagGroup: FoodTagGroup;
  tagGroupName?: string;
  status: FoodTagStatus;
  statusName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFoodTagRequest {
  name: string;
  code: string;
  description?: string;
  tagGroup: FoodTagGroup;
  status?: FoodTagStatus;
}

export interface UpdateFoodTagRequest {
  name: string;
  code: string;
  description?: string;
  tagGroup: FoodTagGroup;
  status: FoodTagStatus;
}

export const adminFoodTagService = {
  getTags: async (params: { page?: number; limit?: number; search?: string; tagGroup?: FoodTagGroup }) => {
    const qp = new URLSearchParams();
    if (params.page) qp.append('Page', params.page.toString());
    if (params.limit) qp.append('PageSize', params.limit.toString());
    if (params.search) qp.append('Search', params.search);
    if (params.tagGroup !== undefined) qp.append('TagGroup', params.tagGroup.toString());
    
    const response = await apiClient.get<any>(`/admin/food-tags?${qp.toString()}`);
    return response.data;
  },

  getTagById: async (id: string) => {
    const response = await apiClient.get<any>(`/admin/food-tags/${id}`);
    return response.data;
  },

  createTag: async (data: CreateFoodTagRequest) => {
    const response = await apiClient.post<any>('/admin/food-tags', data);
    return response.data;
  },

  updateTag: async (id: string, data: UpdateFoodTagRequest) => {
    const response = await apiClient.put<any>(`/admin/food-tags/${id}`, data);
    return response.data;
  },

  deleteTag: async (id: string) => {
    const response = await apiClient.delete<any>(`/admin/food-tags/${id}`);
    return response.data;
  }
};
