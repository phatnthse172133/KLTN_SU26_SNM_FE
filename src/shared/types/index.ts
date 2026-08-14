// Shared Layer - Types
// This directory contains global TypeScript type declarations and interfaces used across multiple layers.

export type Nullable<T> = T | null;

export interface BaseResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginationResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserProfile {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  doB?: string | null;
  avatarUrl?: string | null;
  role: string;
  status: string;
  mustChangePassword?: boolean;
  createdAt?: string;
}

export type BoothStatus = 'Active' | 'Inactive' | 'Banned';

export interface Booth {
  id: string;
  nightMarketId: string;
  nightMarketName?: string | null;
  boothOwnerId: string;
  boothOwnerName?: string | null;
  boothOwnerEmail?: string | null;
  zoneId?: string | null;
  zoneName?: string | null;
  boothName: string;
  boothCode?: string | null;
  description?: string | null;
  phoneNumber?: string | null;
  slotNumber?: string | null;
  thumbnailUrl?: string | null;
  logoUrl?: string | null;
  paymentQrImage?: string | null;
  mapPositionX?: number | null;
  mapPositionY?: number | null;
  openTime?: string | null;
  closeTime?: string | null;
  averageRating?: number | null;
  isFeatured: boolean;
  status: BoothStatus;
  banReason?: string | null;
  marketOpeningHours?: string | null;
  marketClosingHours?: string | null;
}

export interface NightMarket {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: string | null;
  closingHours?: string | null;
  totalBooth: number;
  activeBooth?: number;
  boundaryWidthMeters?: number | null;
  boundaryHeightMeters?: number | null;
  mapWidth?: number | null;
  mapHeight?: number | null;
  thumbnailUrl?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Zone {
  id: string;
  nightMarketId: string;
  zoneName: string;
  description?: string | null;
  color?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPackage {
  id: string;
  packageName: string;
  code?: string | null;
  price: number;
  durationDays: number;
  type: number;
  description?: string | null;
  entitlements?: string | null;
  imageUrl?: string | null;
  features: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackagePolicy {
  id: string;
  packageId: string;
  version: string;
  displayVersion: string;
  title: string;
  terms: string[];
  effectiveFrom: string;
  isActive: boolean;
  createdAt: string;
}

export interface FoodCategory {
  id: string;
  boothId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FoodItem {
  id: string;
  boothId: string;
  categoryId: string;
  categoryName?: string | null;
  name: string;
  description?: string | null;
  price: number;
  thumbnailUrl?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  boothId: string;
  boothName?: string | null;
  customerId: string;
  customerName?: string | null;
  orderId: string;
  orderCode?: string | null;
  rating: number;
  content?: string | null;
  imageUrl?: string | null;
  isVisible: boolean;
  reply?: {
    id: string;
    reviewId: string;
    boothOwnerId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Complaint {
  id: string;
  customerId: string;
  boothId: string;
  orderId: string;
  title: string;
  description: string;
  adminResponse?: string | null;
  status: string;
  resolutionAction?: string | null;
  policyViolation?: string | null;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BoothRegistration {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  requestedNightMarketId: string;
  preferredZoneId?: string | null;
  boothName: string;
  description?: string | null;
  phone?: string | null;
  status: string;
  rejectReason?: string | null;
  createdAt: string;
  boothId?: string | null;
  documents: {
    id: string;
    documentType: string;
    fileUrl: string;
    verificationStatus: string;
  }[];
}
