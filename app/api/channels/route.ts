export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// --- (1) بدأ: المنطق الذكي للفلترة (من ملفك القديم) ---

const categoryKeywords: Record<string, string[]> = {
  music: [
    'music', 'mtv', 'radio', 'fm', 'hits', 'rap', 'pop', 'rock', 'schlager',
    'vevo', 'musica', 'música', 'musique', 'aghani', 'tarab', 'songtv', 'melody',
    'rotana', 'stereo', 'anghami', 'mazzika'
  ],
  news: [
    'news', 'nachrichten', 'noticias', 'info', 'akhbar', 'إخبارية', 'خبر',
    'jazeera', 'cnn', 'bbc', 'fox', 'dw', 'rt', 'sky news', 'cbs', 'abc',
    'nbc', 'notizie', 'nouvelles', '24/7', '24h', 'alarabiya', 'al hadath',
    'alghad', 'al mayadeen', 'france 24', 'العربية', 'الحدث', 'أخبار'
  ],
  movies: [
    'movie', 'film', 'cinema', 'cine', 'kino', 'aflam', 'أفلام', 'hollywood',
    'action', 'drama', 'fox movies'
  ],
  sports: [
    'sport', 'sports', 'nfl', 'nba', 'mlb', 'football', 'futbol', 'tennis',
    'golf', 'racing', 'carreras', 'f1', 'رياضة', 'bein', 'espn', 'tnt sports',
    'ad sports', 'ssc', 'alkass', 'الكاس', 'trophy'
  ],
  kids: [
    'kids', 'animation', 'cartoon', 'niños', 'enfants', 'kinder', 'أطفال',
    'junior', 'disney', 'nick', 'cn', 'cartoonito', 'spaceto.o.n', 'peppa',
    'gumball', 'smurfs', 'سنافر', 'كرتون', 'اطفال', 'baby'
  ],
  documentary: [
    'documentary', 'doc', 'discovery', 'geo', 'history', 'animal',
    'planet', 'nat geo', 'national geographic', 'وثائقي', 'wathaiqi', 'bookopen'
  ],
  shop: ['shop', 'qvc', 'hse', 'tjc', 'ideal world', 'citruss', 'shoppingbag'],
  religious: [
    'religious', 'quran', 'قرآن', 'sunnah', 'bible', 'ewtn', 'mta', 'islam',
    'makkah', 'mecca', 'saudi quran', 'al majid', 'iqraa', 'heartHandshake'
  ],
  cooking: ['cooking', 'kitchen', 'food', 'chef', 'مطبخ', 'طبخ', 'chefhat'],
  auto: ['auto', 'car', 'motor', 'racing', 'f1', 'vehicle', 'automotive', 'سيارات'],
  animation: ['animation', 'anime', 'أنمي', 'sparkles'],
  business: ['business', 'finance', 'money', 'invest', 'stock', 'market', 'bloomberg', 'cnbc', 'مال', 'أعمال', 'briefcase'],
  classic: ['classic', 'retro', 'vintage', 'oldies', 'golden age', 'كلاسيك', 'scroll'],
  comedy: ['comedy', 'funny', 'laugh', 'standup', 'humor', 'كوميديا', 'ضحك'],
  culture: ['culture', 'arts', 'cultural', 'heritage', 'thakafia', 'ثقافة', 'palette'],
  education: ['education', 'school', 'learn', 'teach', 'university', 'تعليم', 'graduationcap'],
  entertainment: ['entertainment', 'celeb', 'gossip', 'hollywood', 'e!', 'فن', 'ترفيه', 'ticket'],
  family: ['family', 'familia', 'famille', 'عائلة', 'users'],
  general: ['general', 'generalista', 'général', 'عام', 'منوعات', 'globe'],
  legislative: ['legislative', 'government', 'parliament', 'c-span', 'senate', 'parlamento', 'مجلس', 'scale'],
  lifestyle: ['lifestyle', 'life', 'style', 'home', 'garden', 'fashion', 'health', 'wellbeing', 'heart'],
  series: ['series', 'tv show', 'drama', 'sitcom', 'مسلسلات', 'tv'],
  outdoor: ['outdoor', 'nature', 'adventure', 'hunting', 'fishing', 'طبيعة', 'mountain'],
  relax: ['relax', 'chill', 'ambience', 'fireplace', 'calm', 'ambiant', 'استرخاء', 'wind'],
  science: ['science', 'tech', 'technology', 'sci', 'space', 'nasa', 'علوم', 'flaskconical'],
  travel: ['travel', 'tourism', 'voyage', 'safar', 'trip', 'vacation', 'سفر', 'plane'],
  weather: ['weather', 'meteo', 'forecast', 'طقس', 'wetter', 'tiempo', 'cloudsun'],
};

function filterChannel(channel: IPTVChannel, category: string): boolean {
  const lowerCategory = category.toLowerCase().replace("-", " ");
  const chName = channel.name.toLowerCase();
  const chCategory = channel.category?.toLowerCase();

  // 1. البحث بالعلامة (Category) المطابقة تماماً
  if (chCategory === lowerCategory) {
    return true;
  }

  // 2. البحث بالكلمات المفتاحية (Keywords)
  let keywords: string[] | undefined = categoryKeywords[lowerCategory as keyof typeof categoryKeywords];
  
  // (حالة خاصة لفئة Top News)
  if (lowerCategory === 'top news') {
    keywords = categoryKeywords['news'];
  }

  if (keywords) {
    // البحث في اسم القناة
    if (keywords.some(keyword => chName.includes(keyword))) {
      return true;
    }
    // البحث في علامة القناة
    if (chCategory && keywords.some(keyword => chCategory.includes(keyword))) {
        return true;
    }
  } else {
    // 3. إذا لم نجد كلمات مفتاحية، نبحث باسم الفئة نفسها في اسم القناة
    if (chName.includes(lowerCategory)) {
      return true;
    }
  }

  return false;
}

// --- (1) انتهى: المنطق الذكي للفلترة ---


// تعريف نوع القناة
interface IPTVChannel {
  name: string;
  url: string;
  lang: string;
  category: string;
  [key: string]: any;
}

// تعريف بنية ملف JSON
type ChannelData = {
  [country: string]: IPTVChannel[];
};

export async function GET(request: NextRequest) {
  try {
    // 1. قراءة متغيرات البحث
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '50'); 

    // 2. تحديد مسار وقراءة ملف channels.json
    // 🔴 تم التعديل ليقرأ من مجلد lib/
    const filePath = path.join(process.cwd(), 'lib', 'channels.json'); 
    
    let allChannelsData: ChannelData;

    try {
      const fileData = await fs.readFile(filePath, 'utf-8');
      allChannelsData = JSON.parse(fileData);
    } catch (fileError) {
      console.error("خطأ: لم يتم العثور على ملف channels.json في المسار:", filePath, fileError);
      return NextResponse.json({ error: 'Failed to read channel data on server.' }, { status: 500 });
    }

    // 3. فلترة القنوات
    let channelsToFilter: IPTVChannel[] = [];
    
    if (country) {
      // الحالة 1: البحث حسب الدولة
      channelsToFilter = allChannelsData[country] || [];
      if (category && category !== 'all-channels') {
        // نستخدم الفلتر الذكي هنا
        channelsToFilter = channelsToFilter.filter(ch => filterChannel(ch, category));
      }
    } else if (category && category !== 'all-channels' && category !== 'history' && category !== 'favorites') {
      
      // 🔴🔴🔴 بدأ التعديل الخاص بإضافة أعلام الدول 🔴🔴🔴
      // الحالة 2: البحث حسب الفئة (عبر كل الدول)
      const allChannelsWithCountry: IPTVChannel[] = [];
    
      // المرور على كل دولة وإضافة اسمها للقناة
      Object.entries(allChannelsData).forEach(([countryName, channels]) => {
        channels.forEach(channel => {
          allChannelsWithCountry.push({
            ...channel,
            countryName: countryName, // 👈 هذا هو السطر الذي يضيف اسم الدولة
          });
        });
      });
      
      // الآن نقوم بالفلترة على القائمة الكاملة
      channelsToFilter = allChannelsWithCountry.filter(ch => filterChannel(ch, category));
      // 🔴🔴🔴 انتهى التعديل 🔴🔴🔴

    } else {
      return NextResponse.json({ channels: [], hasMore: false, total: 0 });
    }

    // 4. تطبيق الترحيل (Pagination)
    const total = channelsToFilter.length;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedChannels = channelsToFilter.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    // 5. إرجاع الرد
    return NextResponse.json({
      channels: paginatedChannels,
      hasMore: hasMore,
      total: total,
    });

  } catch (error) {
    console.error("Error in channels API route:", error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }

}
