"use client";

import { useState } from "react";
import GameCard from "./GameCard";

interface FeaturedGamesProps {
  searchQuery: string;
}

const featuredGames = [
  {
    id: 1764184093032,
    name: "Wicked Whiskers Demo by Indigo Magic | Play our Free Slots",
    provider: "looking up the DOM tree
    let currentElement",
    image: "/api/placeholder/300/200",
    rtp: "30.4%",
    volatility: "Medium",
    maxWin: "1,000x",
    features: ["Free Spins"],
    isNew: true,
    isFeatured: true
  },
  {
    id: 1764184093033,
    name: "Wicked Whiskers",
    provider: "Slots Launch",
    image: "/api/placeholder/300/200",
    rtp: "96.00%",
    volatility: "Medium",
    maxWin: "1,000x",
    features: ["Standard Features"],
    isNew: true,
    isFeatured: true
  },
  {
    id: 1,
    name: "Sweet Bonanza",
    provider: "Pragmatic Play",
    image: "/api/placeholder/300/200",
    rtp: "96.51%",
    volatility: "High",
    maxWin: "21,100x",
    features: ["Tumble", "Free Spins", "Multipliers"],
    isNew: true,
    isFeatured: true
  },
  {
    id: 2,
    name: "Gates of Olympus",
    provider: "Pragmatic Play", 
    image: "/api/placeholder/300/200",
    rtp: "96.50%",
    volatility: "High",
    maxWin: "5,000x",
    features: ["Multipliers", "Free Spins", "Tumble"],
    isNew: false,
    isFeatured: true
  },
  {
    id: 3,
    name: "Book of Dead",
    provider: "Play'n GO",
    image: "/api/placeholder/300/200",
    rtp: "96.21%",
    volatility: "High", 
    maxWin: "5,000x",
    features: ["Free Spins", "Expanding Symbols", "Gamble"],
    isNew: false,
    isFeatured: true
  },
  {
    id: 4,
    name: "Starburst",
    provider: "NetEnt",
    image: "/api/placeholder/300/200",
    rtp: "96.09%",
    volatility: "Low",
    maxWin: "500x",
    features: ["Expanding Wilds", "Re-spins", "Both Ways"],
    isNew: false,
    isFeatured: false
  },
  {
    id: 5,
    name: "Bonanza",
    provider: "Big Time Gaming",
    image: "/api/placeholder/300/200", 
    rtp: "96.00%",
    volatility: "High",
    maxWin: "12,000x",
    features: ["Megaways", "Free Spins", "Reactions"],
    isNew: false,
    isFeatured: true
  },
  {
    id: 6,
    name: "Wolf Gold",
    provider: "Pragmatic Play",
    image: "/api/placeholder/300/200",
    rtp: "96.01%", 
    volatility: "Medium",
    maxWin: "2,500x",
    features: ["Money Respin", "Free Spins", "Jackpots"],
    isNew: false,
    isFeatured: false
  }

];

export default function FeaturedGames({ searchQuery }: FeaturedGamesProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState("all");

  const categories = ["all", "new", "featured", "high-rtp", "jackpots"];
  const providers = ["all", "Pragmatic Play", "NetEnt", "Play'n GO", "Big Time Gaming"];

  const filteredGames = featuredGames.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.provider.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
                           (selectedCategory === "new" && game.isNew) ||
                           (selectedCategory === "featured" && game.isFeatured) ||
                           (selectedCategory === "high-rtp" && parseFloat(game.rtp) > 96.5);
    
    const matchesProvider = selectedProvider === "all" || game.provider === selectedProvider;
    
    return matchesSearch && matchesCategory && matchesProvider;
  });

  return (
    <section id="games" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            🎰 Featured Slot Games
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Play the most popular slot games for free. No registration required.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-300 font-medium">Category:</span>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-300 font-medium">Provider:</span>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-white/10 border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {providers.map(provider => (
                <option key={provider} value={provider} className="bg-gray-800">
                  {provider === "all" ? "All Providers" : provider}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎰</div>
            <h3 className="text-xl font-bold text-white mb-2">No games found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105">
            Load More Games
          </button>
        </div>
      </div>
    </section>
  );
}
