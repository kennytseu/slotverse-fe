"use client";

import { useState } from "react";
import Header from "./slots/Header";
import HeroSection from "./slots/HeroSection";
import FeaturedGames from "./slots/FeaturedGames";
import GameProviders from "./slots/GameProviders";
import UpcomingGames from "./slots/UpcomingGames";
import Footer from "./slots/Footer";

export default function SlotVersePlatform() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <HeroSection />
      <FeaturedGames searchQuery={searchQuery} />
      <GameProviders />
      <UpcomingGames />
      <Footer />
    </div>
  );
}
