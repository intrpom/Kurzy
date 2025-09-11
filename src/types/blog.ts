export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  content?: string;
  videoUrl?: string;  // Bunny.net video ID
  videoLibraryId?: string;  // Bunny.net library ID
  thumbnailUrl?: string;
  tags: string[];
  isPublished: boolean;
  views: number;
  duration?: number;  // v minutách
  price: number;      // Cena minikurzu v Kč
  isPaid: boolean;    // Zda je minikurz placený
  hasAccess?: boolean; // Zda má uživatel přístup k minikurzu
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostCreateData {
  slug: string;
  title: string;
  subtitle?: string;
  content?: string;
  videoUrl?: string;
  videoLibraryId?: string;
  thumbnailUrl?: string;
  tags: string[];
  isPublished?: boolean;
  duration?: number;
  price?: number;     // Cena minikurzu v Kč
  isPaid?: boolean;   // Zda je minikurz placený
}

export interface BlogPostUpdateData extends Partial<BlogPostCreateData> {
  id: string;
}
