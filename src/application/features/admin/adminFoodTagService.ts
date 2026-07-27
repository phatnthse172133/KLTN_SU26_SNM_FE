import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse } from "@/shared/types";

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
  createdAt?: string;
  updatedAt?: string;
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

interface FoodTagApiResponse {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  tagGroup: string | number;
  status: string | number;
}

const FOOD_TAG_GROUPS: Record<string, FoodTagGroup> = {
  Category: FoodTagGroup.Category,
  Cuisine: FoodTagGroup.Cuisine,
  Dietary: FoodTagGroup.Dietary,
  Flavor: FoodTagGroup.Flavor,
  Ingredient: FoodTagGroup.Ingredient,
  TimeOfDay: FoodTagGroup.TimeOfDay,
  CookingMethod: FoodTagGroup.CookingMethod,
};

const FOOD_TAG_STATUSES: Record<string, FoodTagStatus> = {
  Draft: FoodTagStatus.Draft,
  Active: FoodTagStatus.Active,
  Inactive: FoodTagStatus.Inactive,
};

function normalizeFoodTag(tag: FoodTagApiResponse): FoodTag {
  const tagGroup = typeof tag.tagGroup === 'number' ? tag.tagGroup : FOOD_TAG_GROUPS[tag.tagGroup];
  const status = typeof tag.status === 'number' ? tag.status : FOOD_TAG_STATUSES[tag.status];
  return {
    ...tag,
    description: tag.description ?? undefined,
    tagGroup: tagGroup ?? FoodTagGroup.Category,
    status: status ?? FoodTagStatus.Draft,
  };
}

export const adminFoodTagService = {
  getTags: async (params: { page?: number; limit?: number; search?: string; tagGroup?: FoodTagGroup }) => {
    const qp = new URLSearchParams();
    if (params.page) qp.append('Page', params.page.toString());
    if (params.limit) qp.append('PageSize', params.limit.toString());
    if (params.search) qp.append('Search', params.search);
    if (params.tagGroup !== undefined) qp.append('TagGroup', params.tagGroup.toString());
    
    const response = await apiClient.get<BaseResponse<PaginationResponse<FoodTagApiResponse>>>(`/admin/food-tags?${qp.toString()}`);
    return {
      ...response.data,
      items: (response.data.items ?? []).map(normalizeFoodTag),
    };
  },

  createTag: async (data: CreateFoodTagRequest) => {
    const response = await apiClient.post<BaseResponse<FoodTagApiResponse>>('/admin/food-tags', data);
    return normalizeFoodTag(response.data);
  },

  updateTag: async (id: string, data: UpdateFoodTagRequest) => {
    const response = await apiClient.put<BaseResponse<FoodTagApiResponse>>(`/admin/food-tags/${id}`, data);
    return normalizeFoodTag(response.data);
  },

  deleteTag: async (id: string) => {
    const response = await apiClient.delete<BaseResponse<object>>(`/admin/food-tags/${id}`);
    return response.data;
  }
};
