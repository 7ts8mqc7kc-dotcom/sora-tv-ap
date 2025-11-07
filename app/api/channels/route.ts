// 📁 app/api/channels/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

import { join } from "path";
import { readFile } from "fs/promises";

/* =========================
   0) أنواع مساعدة
========================= */

interface IPTVChannel {
  name: string;
  url: string;
  lang: string;
  category?: string;
  [key: string]: any;
}

type ChannelData = Record<string, IPTVChannel[]>;

/* =========================
   1) كلمات مفتاحية للفئات
========================= */

const categoryKeywords: Record<string, string[]> = {
  music: [
    "music","mtv","radio","fm","hits","rap","pop","rock","schlager",
    "vevo","musica","música","musique","aghani","tarab","songtv","melody",
    "rotana","stereo","anghami","mazzika"
  ],
  news: [
    "news","nachrichten","noticias","info","akhbar","إخبارية","خبر",
    "jazeera","cnn","bbc","fox","dw","rt","sky news","cbs","abc",
    "nbc","notizie","nouvelles","24/7","24h","alarabiya","al hadath",
    "alghad","al mayadeen","france 24","العربية","الحدث","أخبار"
  ],
  movies: ["movie","film","cinema","cine","kino","aflam","أفلام","hollywood","action","drama","fox movies"],
  sports: ["sport","sports","nfl","nba","mlb","football","futbol","tennis","golf","racing","carreras","f1","رياضة","bein","espn","tnt sports","ad sports","ssc","alkass","الكاس","trophy"],
  kids: ["kids","animation","cartoon","niños","enfants","kinder","أطفال","junior","disney","nick","cn","cartoonito","peppa","gumball","smurfs","سنافر","كرتون","اطفال","baby"],
  documentary: ["documentary","doc","discovery","geo","history","animal","planet","nat geo","national geographic","وثائقي","wathaiqi","bookopen"],
  shop: ["shop","qvc","hse","tjc","ideal world","citruss","shoppingbag"],
  religious: ["religious","quran","قرآن","sunnah","bible","ewtn","mta","islam","makkah","mecca","saudi quran","al majid","iqraa","heartHandshake"],
  cooking: ["cooking","kitchen","food","chef","مطبخ","طبخ","chefhat"],
  auto: ["auto","car","motor","racing","f1","vehicle","automotive","سيارات"],
  animation: ["animation","anime","أنمي","sparkles"],
  business: ["business","finance","money","invest","stock","market","bloomberg","cnbc","مال","أعمال","briefcase"],
  classic: ["classic","retro","vintage","oldies","golden age","كلاسيك","scroll"],
  comedy: ["comedy","funny","laugh","standup","humor","كوميديا","ضحك"],
  culture: ["culture","arts","cultural","heritage","thakafia","ثقافة","palette"],
  education: ["education","school","learn","teach","university","تعليم","graduationcap"],
  entertainment: ["entertainment","celeb","gossip","hollywood","e!","فن","ترفيه","ticket"],
  family: ["family","familia","famille","عائلة","users"],
  general: ["general","generalista","général","عام","منوعات","globe"],
  legislative: ["legislative","government","parliament","c-span","senate","parlamento","مجلس","scale"],
  lifestyle: ["lifestyle","life","style","home","garden","fashion","health","wellbeing","heart"],
  series: ["series","tv show","drama","sitcom","مسلسلات","tv"],
  outdoor: ["outdoor","nature","adventure","hunting","fishing","طبيعة","mountain"],
  relax: ["relax","chill","ambience","fireplace","calm","ambiant","استرخاء","wind"],
  science: ["science","tech","technology","sci","space","nasa","علوم","flaskconical"],
  travel: ["travel","tourism","voyage","safar","trip","vacation","سفر","plane"],
  weather: ["weather","meteo","forecast","طقس","wetter","tiempo","cloudsun"],
};

function filterChannel(ch: IPTVChannel, category: string): boolean {
  const lowerCategory = category.toLowerCase().replace("-", " ");
  const chName = ch.name?.toLowerCase() || "";
  const chCategory = ch.category?.toLowerCase();

  if (chCategory === lowerCategory) return true;

  let keywords = categoryKeywords[lowerCategory];
  if (lowerCategory === "top news") keywords = categoryKeywords["news"];

  if (keywords?.length) {
    if (keywords.some((k) => chName.includes(k))) return true;
    if (chCategory && keywords.some((k) => chCategory.includes(k))) return true;
  } else {
    if (chName.includes(lowerCategory)) return true;
  }
  return false;
}

/* =========================
   2) معالج GET — واحد فقط
========================= */

export async function GET(request: NextRequest) {
  try {
    // 1) معلمات الاستعلام
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const category = searchParams.get("category");
    const page = Math.max(0, parseInt(searchParams.get("page") || "0"));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") || "50")));

    // 2) قراءة ملف القنوات
    const filePath = join(process.cwd(), "lib", "channels.json");
    const fileData = await readFile(filePath, "utf-8");
    const allChannelsData: ChannelData = JSON.parse(fileData);

    // 3) تحضير القائمة
    let channelsToFilter: IPTVChannel[] = [];

    if (country) {
      channelsToFilter = allChannelsData[country] || [];
      if (category && category !== "all-channels") {
        channelsToFilter = channelsToFilter.filter((c) => filterChannel(c, category));
      }
    } else if (category && !["all-channels", "history", "favorites"].includes(category)) {
      const allWithCountry: IPTVChannel[] = [];
      for (const [countryName, list] of Object.entries(allChannelsData)) {
        for (const c of list) allWithCountry.push({ ...c, countryName });
      }
      channelsToFilter = allWithCountry.filter((c) => filterChannel(c, category));
    } else {
      return NextResponse.json({ channels: [], hasMore: false, total: 0 });
    }

    // 4) الترحيل (Pagination)
    const total = channelsToFilter.length;
    const start = page * pageSize;
    const end = start + pageSize;
    const paginated = channelsToFilter.slice(start, end);
    const hasMore = end < total;

    // 5) الرد
    return NextResponse.json({ channels: paginated, hasMore, total });
  } catch (err) {
    console.error("Error in channels API route:", err);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}



