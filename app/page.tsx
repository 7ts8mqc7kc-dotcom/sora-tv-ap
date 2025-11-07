// 📁 app/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

import TopNavbar from "@/components/top-navbar";
import CountrySidebar from "@/components/country-sidebar";
import CategorySidebar from "@/components/CategorySidebar";
import { IPTVChannel, preloadPriorityCountries } from "@/lib/iptv-channels";

// المكونات التي تعمل على المتصفح فقط
const GlobeViewer = dynamic(() => import("@/components/globe-viewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />,
});

const CountryDetail = dynamic(() => import("@/components/country-detail"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400" />
    </div>
  ),
});

type CategoryKey =
  | "all-channels"
  | "sports"
  | "news"
  | "kids"
  | "movies"
  | "music"
  | "religion"
  | "documentary"
  | "other";

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<IPTVChannel | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all-channels");

  // تحميل أولي
  useEffect(() => {
    setMounted(true);
    preloadPriorityCountries().catch(console.error);
  }, []);

  // كشف الجوال
  useEffect(() => {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    setIsMobile(isMobileDevice);
  }, []);

  // الوقت الحالي
  useEffect(() => {
    const updateTime = () =>
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    updateTime();
    const t = setInterval(updateTime, 60_000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) return null;

  // تفاعل الخريطة
  const handleGlobeCountryClick = (countryName: string) => {
    setActiveChannel(null);
    setSelectedCountry(countryName);
    setActiveCategory("all-channels");
    if (isMobile) setMobileSidebarOpen(true);
  };

  // اختيار دولة من الشريط
  const handleSelectCountry = (country: string | null) => {
    setActiveChannel(null);
    setSelectedCountry(country);
    setActiveCategory("all-channels");
    if (isMobile && !country) setMobileSidebarOpen(false);
  };

  // اختيار فئة
  const handleCategorySelect = (category: string) => {
    setActiveCategory((category as CategoryKey) ?? "all-channels");
    setSelectedCountry(null);
    setActiveChannel(null);
    setIsCategorySidebarOpen(false);
    if (category !== "all-channels" && isMobile && !mobileSidebarOpen) {
      setMobileSidebarOpen(true);
    }
  };

  // اختيار قناة
  const handleSelectChannel = (channel: IPTVChannel) => {
    setActiveChannel(channel);
  };

  const handleBackFromPlayer = () => setActiveChannel(null);
  const toggleMobileSidebar = () =>
    isMobile && setMobileSidebarOpen((p) => !p);
  const toggleCategorySidebar = () =>
    setIsCategorySidebarOpen((p) => !p);

  return (
    <div className="flex flex-col h-screen w-full bg-transparent text-white overflow-hidden">
      <TopNavbar onMenuClick={toggleCategorySidebar} isMenuOpen={isCategorySidebarOpen} />

      <div className="flex-1 overflow-hidden relative">
        {/* 🌍 الكرة الأرضية */}
        <div className="absolute inset-0 z-10 sm:right-[320px] lg:right-[340px]">
          <GlobeViewer
            selectedCountry={selectedCountry}
            onCountryClick={handleGlobeCountryClick}
            isMobile={isMobile}
          />
        </div>

        {/* 🎥 مشغل الفيديو (سطح المكتب) */}
        {!isMobile &&
          activeChannel &&
          (selectedCountry || activeCategory !== "all-channels") && (
            <div className="absolute top-0 bottom-0 z-30 flex items-center justify-center p-4 sm:p-8 left-0 right-0 sm:right-[320px] lg:right-[340px]">
              <CountryDetail
                country={selectedCountry ?? activeCategory}
                channel={activeChannel.name}
                streamUrlProp={activeChannel.url}
                onBack={handleBackFromPlayer}
                isMobile={isMobile}
                activeCategory={activeCategory}
              />
            </div>
          )}

        {/* 🖥️ قائمة الدول (يمين) */}
        {!isMobile && (
          <aside
            className="absolute right-0 top-16 bottom-0 w-[320px] lg:w-[340px] z-20 bg-gray-900/90 backdrop-blur-md"
            role="complementary"
          >
            <CountrySidebar
              selectedCountry={selectedCountry}
              onSelectCountry={handleSelectCountry}
              onSelectChannel={handleSelectChannel}
              onClose={() => {}}
              externalSearch={searchQuery}
              currentTime={currentTime}
              isMobile={isMobile}
              activeCategory={activeCategory}
              activeChannel={activeChannel}
            />
          </aside>
        )}

        {/* 📂 قائمة الفئات (يسار) */}
        <>
          <div
            className={`fixed top-16 left-0 bottom-0 z-40 w-64 bg-[#0B0D11] shadow-lg transform transition-transform duration-300 ease-in-out ${
              isCategorySidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <CategorySidebar
              activeCategory={activeCategory}
              onCategorySelect={handleCategorySelect}
              onClose={toggleCategorySidebar}
            />
          </div>
          {isCategorySidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-30" onClick={toggleCategorySidebar} />
          )}
        </>

        {/* 📱 قائمة الهاتف (القنوات) */}
        {isMobile && (
          <>
            <div
              className={`fixed left-0 right-0 z-20 bg-[#0B0D11] transition-transform duration-500 ${
                mobileSidebarOpen ? "translate-y-0" : "translate-y-full"
              } top-16 bottom-0 flex flex-col`}
            >
              {activeChannel && (
                <div className="w-full bg-black flex-shrink-0 relative">
                  <CountryDetail
                    country={selectedCountry ?? activeCategory}
                    channel={activeChannel.name}
                    streamUrlProp={activeChannel.url}
                    onBack={handleBackFromPlayer}
                    isMobile={isMobile}
                    activeCategory={activeCategory}
                  />
                </div>
              )}

              <div
                onClick={toggleMobileSidebar}
                className={`w-full flex items-center justify-center cursor-grab flex-shrink-0 ${
                  activeChannel ? "py-0" : "py-1.5"
                }`}
                aria-label="Toggle sidebar"
              >
                <span className="w-12 h-1.5 bg-gray-700 rounded-full" />
              </div>

              <div className="flex-1 overflow-y-auto custom-scroll">
                <CountrySidebar
                  selectedCountry={selectedCountry}
                  onSelectCountry={handleSelectCountry}
                  onSelectChannel={handleSelectChannel}
                  onClose={toggleMobileSidebar}
                  externalSearch={setSearchQuery ? searchQuery : ""}
                  currentTime={currentTime}
                  isMobile={isMobile}
                  activeCategory={activeCategory}
                  activeChannel={activeChannel}
                />
              </div>
            </div>
            {mobileSidebarOpen && (
              <div className="fixed inset-0 bg-black/50 z-10" onClick={toggleMobileSidebar} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
