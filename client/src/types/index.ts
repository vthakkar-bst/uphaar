// User related types
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  address?: string;
  bio?: string;
  location?: string;
  createdAt?: any; // Firebase timestamp
  updatedAt?: any; // Firebase timestamp
}

export interface UserStats {
  givenItemsCount: number;
  offeredItemsCount: number;
  itemsShared: number;
  itemsGivenAway: number;
  itemsClaimed: number;
}

// Item related types
export interface Item {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  category: string;
  condition: string;
  location: string;
  contactPhone?: string;
  contactEmail?: string;
  imageUrls: string[];
  claimCount: number;
  isGivenAway: boolean;
  createdAt: any; // Firebase timestamp
  updatedAt: any; // Firebase timestamp
  isAvailable: boolean;
  claimedBy?: string;
  claimedAt?: any; // Firebase timestamp
}

export interface CreateItemFormData {
  title: string;
  description: string;
  imageUrls: string[];
  location: string;
  contactPhone?: string;
  contactEmail?: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  isFree: boolean;
  price?: number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface ItemsResponse {
  items: Item[];
}

export interface ItemResponse {
  item: Item;
}

export interface UserProfileResponse {
  profile: UserProfile;
  isNew?: boolean;
}

export interface UserStatsResponse {
  stats: UserStats;
}

export interface ApiError {
  error: string;
  status?: number;
}
