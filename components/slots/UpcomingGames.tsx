"use client";

const upcomingGames = [
  {
    name: "Big Bass Christmas",
    provider: "Pragmatic Play",
    releaseDate: "Dec 15, 2024",
    features: ["Christmas Theme", "Free Spins", "Money Collect"],
    hype: "high"
  },
  {
    name: "Starburst XXXtreme",
    provider: "NetEnt", 
    releaseDate: "Dec 20, 2024",
    features: ["Extreme Multipliers", "Expanding Wilds", "Respins"],
    hype: "medium"
  },
  {
    name: "Book of Shadows",
    provider: "Play'n GO",
    releaseDate: "Jan 5, 2025",
    features: ["Expanding Symbols", "Free Spins", "Mystery Symbols"],
    hype: "high"
  },
  {
    name: "Megaways Fortune",
    provider: "Big Time Gaming",
    releaseDate: "Jan 12, 2025", 
    features: ["Megaways", "Cascading Reels", "Unlimited Multiplier"],
    hype: "low"
  }
];

export default function UpcomingGames() {
  const getHypeColor = (hype: string) => {
    switch (hype) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getHypeText = (hype: string) => {
    switch (hype) {
      case "high": return "🔥 High Hype";
      case "medium": return "⚡ Medium Hype";
      case "low": return "📈 Growing Interest";
      default: return "New";
    }
  };

  return (
    <section id="upcoming" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            📅 Upcoming Releases
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get ready for the hottest new slot games coming soon
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingGames.map((game, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{game.name}</h3>
                  <p className="text-gray-400">{game.provider}</p>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold px-2 py-1 rounded-full text-white ${getHypeColor(game.hype)}`}>
                    {getHypeText(game.hype)}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Release Date:</div>
                <div className="text-lg font-semibold text-purple-300">{game.releaseDate}</div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-2">Expected Features:</div>
                <div className="flex flex-wrap gap-2">
                  {game.features.map((feature, featureIndex) => (
                    <span
                      key={featureIndex}
                      className="text-xs bg-purple-600/30 text-purple-300 px-2 py-1 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">
                  🔔 Notify Me
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
                  📋 Details
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105">
            View Full Calendar
          </button>
        </div>
      </div>
    </section>
  );
}
