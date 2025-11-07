// app/api/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // node runtime لأننا نتعامل مع fetch/شبكات

const ALLOWED_HOSTS = [
  // أضف هنا الدومينات المسموح بها فقط
  "youtube.com",
  "www.youtube.com",
  "rtd.example.com"
];

function isAllowedUrl(urlStr: string) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    // منع الشبكات الداخلية
    if (/^(localhost|127\\.|10\\.|192\\.168\\.|172\\.(1[6-9]|2[0-9]|3[0-1]))/.test(host)) {
      return false;
    }
    return ALLOWED_HOSTS.some(allowed => host.endsWith(allowed));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("api_key");
  const requiredKey = process.env.PROXY_API_KEY;

  if (!requiredKey) {
    return NextResponse.json({ error: "Server proxy key not configured." }, { status: 500 });
  }
  if (!apiKey || apiKey !== requiredKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json({ error: "Invalid or disallowed url" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    const body = await res.arrayBuffer();
    const headers = new Headers();
    // copy some safe headers
    headers.set("Content-Type", res.headers.get("content-type") || "application/octet-stream");

    return new NextResponse(Buffer.from(body), { status: res.status, headers });
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed", details: String(err) }, { status: 502 });
  }
}
