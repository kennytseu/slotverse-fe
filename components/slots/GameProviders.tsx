"use client";

const providers = [
  { name: "Pragmatic Play", games: 250, logo: "🎯", featured: true },
  { name: "NetEnt", games: 200, logo: "🌟", featured: true },
  { name: "Play'n GO", games: 180, logo: "🚀", featured: true },
  { name: "Big Time Gaming", games: 45, logo: "⚡", featured: false },
  { name: "Microgaming", games: 300, logo: "👑", featured: true },
  { name: "Yggdrasil", games: 120, logo: "🌳", featured: false },
  { name: "Red Tiger", games: 150, logo: "🐅", featured: false },
  { name: "Blueprint Gaming", games: 100, logo: "📘", featured: false },
];

export default function GameProviders() {
  return (
    <section id="providers" className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            🏢 Game Providers
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover games from the world's leading slot game developers
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {providers.map((provider, index) => (
            <div
              key={index}
              className={`bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border transition-all duration-300 hover:scale-105 cursor-pointer ${
                provider.featured 
                  ? "border-yellow-400/40 hover:border-yellow-400/60" 
                  : "border-purple-500/20 hover:border-purple-400/40"
              }`}
            >
              <div className="text-4xl mb-3">{provider.logo}</div>
              <h3 className="text-lg font-bold text-white mb-2">{provider.name}</h3>
              <p className="text-gray-400 text-sm">{provider.games} Games</p>
              {provider.featured && (
                <div className="mt-2">
                  <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                    FEATURED
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105">
            View All Providers
          </button>
        </div>
      </div>
    </section>
  );
}
