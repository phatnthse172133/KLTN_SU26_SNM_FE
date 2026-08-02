import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, Booth } from "@/shared/types";

export interface BoothGalleryImage {
  id: string;
  imageUrl: string;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type BoothDocumentType = "BusinessLicense" | "FoodSafetyCertificate" | "OwnerIdentification";

export interface BoothOwnerDocument {
  id: string;
  documentType: string;
  fileUrl: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

const withFile = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
};

export const boothMediaService = {
  getImages: async () => {
    return apiClient.get<BaseResponse<BoothGalleryImage[]>>("/booth-owner/booth/images");
  },
  uploadImage: async (file: File) => {
    return apiClient.post<BaseResponse<BoothGalleryImage[]>>("/booth-owner/booth/images", withFile(file));
  },
  deleteImage: async (imageId: string) => {
    return apiClient.delete<BaseResponse<object>>(`/booth-owner/booth/images/${imageId}`);
  },
  setCoverImage: async (imageId: string) => {
    return apiClient.post<BaseResponse<Booth>>(`/booth-owner/booth/images/${imageId}/cover`, {});
  },
  updateLogo: async (file: File) => {
    return apiClient.put<BaseResponse<Booth>>("/booth-owner/booth/logo", withFile(file));
  },
  getDocuments: async () => {
    return apiClient.get<BaseResponse<BoothOwnerDocument[]>>("/booth-owner/booth/documents");
  },
  uploadDocument: async (documentType: BoothDocumentType, file: File) => {
    const formData = withFile(file);
    formData.append("documentType", documentType);
    return apiClient.post<BaseResponse<BoothOwnerDocument>>("/booth-owner/booth/documents", formData);
  },
  deleteDocument: async (documentId: string) => {
    return apiClient.delete<BaseResponse<object>>(`/booth-owner/booth/documents/${documentId}`);
  },
};
