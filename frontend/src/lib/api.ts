const BASE = "/api";

function getToken() {
  return localStorage.getItem("cld_token") ?? "";
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    // Debug: log outgoing request (do not log passwords in production)
    // eslint-disable-next-line no-console
    console.debug("api.request", { method, path, body, tokenPresent: !!token });
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      cache: "no-store",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Unable to reach the server. Please check your connection.");
  }

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON response from server
    // eslint-disable-next-line no-console
    console.warn("api.request: non-json response", { status: res.status, text: text.slice(0, 200) });
    if (!res.ok) throw new Error(`Server error (${res.status}). Please try again.`);
  }

  if (!res.ok) throw new Error((data.error as string) || "Request failed");
  return data as T;
}

export const authApi = {
  register: (body: { identifier: string; name?: string; password: string; referralCode?: string }) =>
    request<{ token: string; user: ApiUser }>("POST", "/auth/register", body),
  login: (body: { identifier: string; password: string }) =>
    request<{ token: string; user: ApiUser }>("POST", "/auth/login", body),
};

export const userApi = {
  me: () => request<ApiUser>("GET", "/user/me"),
  updateProfile: (body: Partial<ApiUser>) => request<{ ok: boolean }>("PUT", "/user/profile", body),
  stats: () => request<ApiStats>("GET", "/user/stats"),
  tokens: () => request<ApiTokensResponse>("GET", "/user/tokens"),
  transactions: () => request<ApiTransaction[]>("GET", "/user/transactions"),
  draws: () => request<ApiDrawsResponse>("GET", "/user/draws"),
  referrals: () => request<ApiReferralsResponse>("GET", "/user/referrals"),
  notifications: () => request<ApiNotification[]>("GET", "/user/notifications"),
  markNotificationRead: (id: number) => request<{ ok: boolean }>("PUT", `/user/notifications/${id}/read`),
  markAllRead: () => request<{ ok: boolean }>("PUT", "/user/notifications/read-all"),
  submitTransaction: (body: {
    amountPkr: number; tokensCount: number; paymentMethod: string;
    drawId?: string | number; drawName?: string; screenshotUrl?: string;
    transactionId: string; address: string; name: string; phone: string;
  }) => request<{ id: number; ok: boolean }>("POST", "/user/transactions", body),
  joinDraw: (drawId: string | number, tokensCount: number) =>
    request<{ ok: boolean; participationId: number; newTokens: number }>("POST", `/user/draws/${drawId}/join`, { tokensCount }),
};

export const spinApi = {
  status: () => request<ApiSpinStatus>("GET", "/spin/status"),
  spin: () => request<ApiSpinResult>("POST", "/spin"),
};

export const pagesApi = {
  getPage: (slug: string) => request<PageContentResponse>("GET", `/pages/${slug}`),
};

export const contactApi = {
  submit: (body: { name: string; email: string; message: string; phone?: string; subject?: string }) => request<{ ok: boolean }>("POST", "/contact", body),
};

export const publicApi = {
  siteStats: () => request<ApiSiteStats>("GET", "/settings/stats"),
  paymentAccounts: () => request<ApiPaymentAccounts>("GET", "/settings/payment"),
  activeDraws: () => request<ApiPublicDraw[]>("GET", "/draws"),
  draw: (id: string | number) => request<ApiPublicDraw>("GET", `/draws/${id}`),
  winners: () => request<ApiPublicWinner[]>("GET", "/winners"),
};

export const adminApi = {
  stats: () => request<AdminStats>("GET", "/admin/stats"),
  users: (params?: Record<string, string | number>) => request<AdminUsersResponse>("GET", `/admin/users?${new URLSearchParams(params as any).toString()}`),
  user: (id: string | number) => request<AdminUserDetail>("GET", `/admin/users/${id}`),
  adjustTokens: (id: string | number, delta: number, reason: string) => request<{ ok: boolean }>("PUT", `/admin/users/${id}/tokens`, { delta, reason }),
  suspendUser: (id: string | number, suspended: boolean) => request<{ ok: boolean }>("PUT", `/admin/users/${id}/suspend`, { suspended }),
  setUserFlags: (id: string | number, flags: Partial<AdminUserFlags>) => request<{ ok: boolean }>("PUT", `/admin/users/${id}/flags`, flags),
  generateReferralCode: (id: string | number) => request<{ ok: boolean; referralCode: string }>("POST", `/admin/users/${id}/generate-referral`),
  notifyUser: (id: string | number, title: string, message: string, type?: string) => request<{ ok: boolean }>("POST", `/admin/users/${id}/notify`, { title, message, type }),
  draws: () => request<AdminDraw[]>("GET", "/admin/draws"),
  createDraw: (body: Partial<AdminDraw>) => request<AdminDraw>("POST", "/admin/draws", body),
  updateDraw: (id: string | number, body: Partial<AdminDraw>) => request<AdminDraw>("PUT", `/admin/draws/${id}`, body),
  deleteDraw: (id: number) => request<{ ok: boolean }>("DELETE", `/admin/draws/${id}`),
  triggerDraw: (id: number, count?: number) => request<{ ok: boolean; winner: AdminWinnerInfo | null; winners: AdminWinnerInfoWithToken[] }>("POST", `/admin/draws/${id}/trigger`, { count: count ?? 1 }),
  drawParticipants: (id: number) => request<AdminParticipant[]>("GET", `/admin/draws/${id}/participants`),
  deleteDrawParticipants: (id: number, participantIds: string[]) => request<{ ok: boolean }>("DELETE", `/admin/draws/${id}/participants`, { ids: participantIds }),
  transactions: (params?: Record<string, string | number>) => request<AdminTransactionsResponse>("GET", `/admin/transactions?${new URLSearchParams(params as any).toString()}`),
  approveTransaction: (id: string | number) => request<{ ok: boolean }>("PUT", `/admin/transactions/${id}/approve`),
  rejectTransaction: (id: string | number, reason: string) => request<{ ok: boolean }>("PUT", `/admin/transactions/${id}/reject`, { reason }),
  deleteTransaction: (id: string | number) => request<{ ok: boolean }>("DELETE", `/admin/transactions/${id}`),
  userTokens: (id: string | number) => request<AdminUserTokensResponse>("GET", `/admin/users/${id}/tokens`),
  deleteUserTokens: (id: string | number, options?: { status?: string; drawId?: string }) => {
    const query = new URLSearchParams();
    if (options?.status) query.set("status", options.status);
    if (options?.drawId) query.set("drawId", options.drawId);
    return request<{ ok: boolean; deletedCount: number; tokens?: number }>(
      "DELETE",
      `/admin/users/${id}/tokens${query.toString() ? `?${query.toString()}` : ""}`,
    );
  },
  deleteUserToken: (userId: string | number, tokenId: string | number) =>
    request<{ ok: boolean; deletedCount: number; tokens?: number }>("DELETE", `/admin/users/${userId}/tokens/${tokenId}`),
  winners: () => request<AdminWinner[]>("GET", "/admin/winners"),
  updateWinner: (id: string | number, body: {
    prize?: string | null;
    displayName?: string | null;
    displayCity?: string | null;
    displayPrize?: string | null;
    displayTokenLabel?: string | null;
    displayDateLabel?: string | null;
    displayImageUrl?: string | null;
    displayAvatarUrl?: string | null;
    notes?: string | null;
  }) => request<{ ok: boolean }>("PUT", `/admin/winners/${id}`, body),
  updateDelivery: (id: string | number, status: string, notes?: string) =>
    request<{ ok: boolean }>("PUT", `/admin/winners/${id}/delivery`, { status, notes }),
  deleteWinner: (id: string | number) => request<{ ok: boolean }>("DELETE", `/admin/winners/${id}`),
  referrals: () => request<AdminReferralsResponse>("GET", "/admin/referrals"),
  grantReferral: (id: number) => request<{ ok: boolean }>("POST", `/admin/referrals/${id}/grant`),
  revokeReferral: (id: number) => request<{ ok: boolean }>("DELETE", `/admin/referrals/${id}`),
  settings: () => request<AdminSettings>("GET", "/admin/settings"),
  updateSettings: (body: Partial<AdminSettings>) => request<AdminSettings>("PUT", "/admin/settings", body),
  admins: () => request<AdminUser[]>("GET", "/admin/admins"),
  grantAdmin: (email: string) => request<{ ok: boolean }>("POST", "/admin/admins/grant", { email }),
  revokeAdmin: (userId: string | number) => request<{ ok: boolean }>("POST", "/admin/admins/revoke", { userId }),
  storageStats: () => request<AdminStorageStats>("GET", "/admin/storage"),
  images: (params?: Record<string, string | number>) =>
    request<AdminImagesResponse>("GET", `/admin/images?${new URLSearchParams(params as any).toString()}`),
  deleteImage: (filename: string) => request<{ ok: boolean; fileDeleted?: boolean; dbDeleted?: boolean; message?: string; error?: string }>("DELETE", `/admin/images/${encodeURIComponent(filename)}`),
  analytics: () => request<AdminAnalytics>("GET", "/admin/analytics"),
  contactMessages: (params?: Record<string, string | number>) =>
    request<AdminContactResponse>("GET", `/admin/contact?${new URLSearchParams(params as any).toString()}`),
  updateContactMessage: (id: string | number, body: { status?: string; adminNotes?: string }) =>
    request<{ ok: boolean }>("PUT", `/admin/contact/${id}`, body),
  deleteContactMessage: (id: string | number) =>
    request<{ ok: boolean }>("DELETE", `/admin/contact/${id}`),
};

export interface ApiUser {
  id: string; name: string | null; email: string | null; phone: string | null;
  tokens: number; referralCode: string | null; city: string | null;
  address: string | null; province: string | null; cnic: string | null;
  isAdmin: boolean; suspended: boolean; createdAt: string;
}
export interface ApiStats {
  totalTokens: number; activeEntries: number; referralCount: number; unreadNotifications: number;
  recentActivity: { type: string; text: string; time: string; status: string }[];
}
export interface ApiTokensResponse {
  totalTokens: number;
  availableTokens?: number;
  usedTokens?: number;
  tokens: { id: string; tokenNumber?: number; draw: string; status: string; purchased: string; price: string }[];
}
export interface ApiTransaction {
  id: string; draw: string; amount: string; tokens: number;
  method: string; date: string; status: string;
}
export interface ApiUserDraw {
  id: string;
  drawId: string;
  name: string;
  prize: string | null;
  tokens: number;
  joinedAt: string;
  prizeValuePkr: number | null;
  tokenLimit: number | null;
  tokensSold: number | null;
  imageUrl: string | null;
  category: string | null;
  drawStatus: string;
  date?: string;
  result?: string | null;
}
export interface ApiDrawsResponse {
  activeDraws: ApiUserDraw[];
  pastDraws: ApiUserDraw[];
}
export interface ApiReferralsResponse {
  referralCode: string | null; totalReferrals: number; earnedTokens: number;
  isEligible: boolean; referralEnabled?: boolean; totalTokensPurchased: number; message?: string;
  referrals: { name: string; joined: string; rewardGiven: boolean }[];
}
export interface ApiNotification {
  id: string; type: string; title: string; message: string; read: boolean; time: string;
}
export interface ApiSpinStatus {
  canSpin: boolean; nextSpinAt: string | null; secondsUntilNextSpin: number;
  isEligible: boolean; totalTokensPurchased: number;
}
export interface ApiSpinResult {
  resultIndex: number; tokensWon: number; newTotal: number;
  nextSpinAt: string; secondsUntilNextSpin: number;
}
export interface ApiSocialLink {
  platform: string; url: string;
}
export interface AdminSettings {
  happyUsersCount: number;
  tokensSoldCount: number;
  prizesWonCount: number;
  maintenanceMode: boolean;
  announcementText: string | null;
  whatsappNumber: string | null;
  easypaisaTitle: string | null;
  easypaisaNumber: string | null;
  jazzcashTitle: string | null;
  jazzcashNumber: string | null;
  bankTitle: string | null;
  bankIban: string | null;
  sadapayTitle: string | null;
  sadapayNumber: string | null;
  spinEnabled: boolean;
  socialLinks: string | null;
  footerContent: string | null;
  referralForceEnabled: boolean;
}
export interface PageContentResponse {
  slug: string;
  name: string;
  published: boolean;
  sections: { key: string; label: string; value: string }[];
}
export interface ApiFooterContent {
  brandName: string;
  tagline: string;
  email: string;
  quickLinks: { label: string; href: string }[];
  paymentMethods: string[];
  copyright: string;
}
export interface ApiSiteSettings {
}
export interface ApiSiteStats {
  happyUsersCount: number; tokensSoldCount: number; prizesWonCount: number;
  maintenanceMode: boolean; announcementText: string | null;
  socialLinks: string;
  footerContent: string | null;
  whatsappNumber: string | null;
}
export interface ApiPaymentAccounts {
  easypaisa: { title: string | null; number: string | null };
  jazzcash: { title: string | null; number: string | null };
  bank: { title: string | null; iban: string | null };
  sadapay: { title: string | null; number: string | null };
}
export interface ApiPublicDraw {
  id: string; name: string; category: string; prize: string; prizeValuePkr: number;
  tokenPricePkr: number; tokenLimit: number; imageUrl: string | null;
  status: string; badges: string | null; startsAt: string | null; endsAt: string | null;
  tokensSold: number;
  participantCount?: number;
  winner?: { name: string; city: string } | null;
}
export interface ApiPublicWinner {
  id: string; drawName: string; prize: string | null; city: string; name: string; date: string;
  tokenNumber?: number | null;
  tokenLabel?: string | null;
  dateLabel?: string | null;
  imageUrl?: string | null;
  avatarUrl?: string | null;
}
export interface AdminStats {
  totalUsers: number; newUsersToday: number; activeDraws: number; totalTokensSold: number; totalRevenue: number;
  pendingTransactions: number; pendingPayments: number; activeUsers: number; totalAdmins: number;
  totalWinners: number; totalReferrals: number; tokensSoldToday: number; totalRevenuePkr: number;
  totalSpinsToday: number; recentActivity: { type: string; text: string; time: string; status: string }[];
}
export interface AdminUser {
  id: string; name: string | null; email: string | null; phone: string | null; referralCode: string | null;
  city: string | null; province: string | null; tokens: number;
  isAdmin: boolean; suspended: boolean; createdAt: string; referralCount: number;
}
export interface AdminUsersResponse { users: AdminUser[]; total: number; page: number; limit: number; }
export interface AdminUserDetail {
  user: AdminUser & {
    address: string | null;
    cnic: string | null;
    referralCode: string | null;
    referralForceEnabled: boolean;
    spinForceEnabled: boolean;
    lastPaymentTransactionId: string | null;
  };
  transactions: AdminTransaction[]; participations: unknown[]; referrals: unknown[]; spins: unknown[];
}
export interface AdminDraw {
  id: number; name: string; category: string; prize: string; prizeValuePkr: number;
  tokenPricePkr: number; tokenLimit: number; imageUrl: string | null;
  status: string; badges: string | null; startsAt: string | null; endsAt: string | null; createdAt: string;
  tokensSold: number; participantCount: number;
}
export interface AdminTransaction {
  id: string; userId: string; userName: string | null; userEmail: string | null; userPhone: string | null; userAddress: string | null;
  amountPkr: number; tokensCount: number; paymentMethod: string; screenshotUrl: string | null;
  paymentTransactionId: string | null;
  status: string; createdAt: string; approvedAt: string | null; rejectedAt: string | null; rejectionReason: string | null;
  drawId: string | null; drawName: string | null;
}
export interface AdminToken {
  id: string;
  tokenNumber: number;
  drawId: string | null;
  drawName: string | null;
  status: string;
  createdAt: string;
  type?: "purchased" | "spin";
  source?: "transaction" | "daily_spin";
  transactionId?: string;
  transactionAmount?: number | null;
  transactionTokensCount?: number | null;
  transactionStatus?: string | null;
  transactionCreatedAt?: string | null;
}
export interface AdminUserTokensResponse {
  totalPurchasedTokens: number;
  totalSpinTokens: number;
  purchasedTokensList: AdminToken[];
  spinTokensList: AdminToken[];
  spinHistory?: Array<{ id: string; type: string; tokensWon: number; resultIndex: number; createdAt: string }>;
  allTokensCombined?: AdminToken[];
}
export interface AdminTransactionsResponse { transactions: AdminTransaction[]; total: number; page: number; limit: number; }
export interface AdminWinner {
  id: string; userId: string; drawId: string | number; userName: string | null; drawName: string;
  prize: string | null; city: string | null; status: string; deliveredAt: string | null;
  userPhone: string | null; userEmail: string | null; userCity: string | null;
  address: string | null; userAddress: string | null; cnic: string | null;
  winningTokenNumber?: number | null; winningTokenSlot?: number | null;
  displayName?: string | null; displayCity?: string | null; displayPrize?: string | null;
  displayTokenLabel?: string | null; displayDateLabel?: string | null;
  displayImageUrl?: string | null; displayAvatarUrl?: string | null;
  deliveryNotes: string | null; prizeDeliveryStatus: string | null; joinedAt: string;
}
export interface AdminWinnerInfo {
  userId: string; userName: string | null; drawId: string; drawName: string;
  prize: string | null; city: string | null; tokensWon: number;
}
export interface AdminWinnerInfoWithToken extends AdminWinnerInfo {
  tokenId: string; id?: string; name: string | null; phone: string | null; city: string | null;
  tokensUsed: number; tokenSlot: number; totalSlots: number;
  winningTokenNumber?: number | null;
}
export interface AdminParticipant {
  id: string; userId: string; userName: string | null; userPhone: string | null; userCity: string | null;
  tokensUsed: number; result: string | null; status: string; joinedAt: string;
}
export interface AdminReferral {
  id: string; referrerId: string; referrerName: string | null; referrerPhone: string | null;
  referredUserId: string; referredName: string | null; referredPhone: string | null;
  rewardGiven: boolean; createdAt: string;
}
export interface AdminReferralsResponse {
  total: number; totalTokensCredited: number;
  topReferrers: { referrerId: number; count: number; name: string | null }[];
  referrals: AdminReferral[];
}
export interface AdminStorageStats {
  totalImages: number; totalSizeMb: number; storageLimitMb: number; percentageUsed: number;
}
export interface AdminImage {
  id: number; filename: string; url: string; type: string; fileSizeBytes: number;
  fileSizeLabel: string; inUse: boolean; usedByLabel: string | null; createdAt: string;
}
export interface AdminImagesResponse { images: AdminImage[]; total: number; }
export interface AdminUserFlags {
  forceEligible?: boolean; forceSpinEligible?: boolean;
  referralForceEnabled?: boolean; spinForceEnabled?: boolean;
}
export interface AdminAnalytics {
  revenue: { dailyLast30: { date: string; total: number }[]; total: number; thisMonth: number; lastMonth: number; growthPercent: number | null; byMethod: unknown[] };
  users: unknown;
  transactions: unknown;
  tokens: unknown;
  draws: { topDraws: { drawName: string; participants: number; totalTokens: number }[]; total: number; completed: number; totalParticipations: number };
  referrals: unknown;
  spins: unknown;
}
export interface AdminContactMessage {
  id: string; name: string; email: string | null; phone: string | null; subject: string | null;
  message: string; status: string; adminNotes: string | null; createdAt: string; repliedAt: string | null;
  screenshotUrl?: string | null;
}
export interface AdminContactResponse { messages: AdminContactMessage[]; contacts: AdminContactMessage[]; total: number; openCount: number; page: number; limit: number; }
export interface AdminRecentActivity { type: string; text: string; time: string; status: string; }
