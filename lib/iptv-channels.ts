// 📁 lib/iptv-channels.ts

/**
 * 1. تعريف الأنواع الأساسية
 */
export interface IPTVChannel {
  name: string;
  url: string;
  lang?: string;
  category?: string;
  countryName?: string; 
}

export interface PaginatedResult {
  channels: IPTVChannel[];
  hasMore: boolean;
  total: number;
}

// 2. تحديد رابط الـ API الذي أنشأناه
const API_BASE_URL = '/api/channels';

/**
 * 🔴 الدالة رقم 1: جلب القنوات حسب الدولة (مع فلتر الفئة)
 * هذه هي الدالة التي يتصل بها الهوك useChannelsManagement
 */
export async function getChannelsPaginated(
  country: string, 
  category: string | null, 
  page: number, 
  pageSize: number
): Promise<PaginatedResult> {
  
  // بناء الرابط الذي سيتم طلبه
  const params = new URLSearchParams({
    country: country,
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  // إضافة الفئة فقط إذا لم تكن "all-channels"
  if (category && category !== 'all-channels') {
    params.append('category', category);
  }

  const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error("API Error Response:", errorData);
    throw new Error(`Failed to fetch channels for ${country}. Status: ${response.status}`);
  }
  
  return response.json();
}

/**
 * 🔴 الدالة رقم 2: جلب القنوات حسب الفئة (عبر كل الدول)
 * هذه هي الدالة التي يتصل بها الهوك useChannelsManagement
 */
export async function getCategoryChannelsPaginated(
  category: string, 
  page: number, 
  pageSize: number
): Promise<PaginatedResult> {

  // (لا نرسل دولة، فقط فئة)
  const params = new URLSearchParams({
    category: category,
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error("API Error Response:", errorData);
    throw new Error(`Failed to fetch channels for category ${category}. Status: ${response.status}`);
  }
  
  return response.json();
}

// --- 3. دوال السجل والمفضلة (تبقى كما هي) ---
// (هذه تعمل في المتصفح ولا تحتاج API)

export async function getHistoryChannels(): Promise<IPTVChannel[]> {
  if (typeof window === 'undefined') return [];
  try {
    const historyJson = localStorage.getItem('sora_tv_history');
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
}

export async function getFavoriteChannels(): Promise<IPTVChannel[]> {
  if (typeof window === 'undefined') return [];
  try {
    const favoritesJson = localStorage.getItem('sora_tv_favorites');
    return favoritesJson ? JSON.parse(favoritesJson) : [];
  } catch (e) {
    console.error("Failed to parse favorites", e);
    return [];
  }
}

// (هذه الدالة لم تعد ضرورية، لكن نتركها فارغة)
export async function preloadPriorityCountries() {
  return Promise.resolve();
}