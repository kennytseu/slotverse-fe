"use client";

interface Game {
  id: number;
  name: string;
  provider: string;
  image: string;
  rtp: string;
  volatility: string;
  maxWin: string;
  features: string[];
  isNew: boolean;
  isFeatured: boolean;
}

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const handlePlayDemo = () => {
    // This would open the demo player
    console.log(`Playing demo for ${game.name}`);
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility.toLowerCase()) {
      case "low": return "text-green-400";
      case "medium": return "text-yellow-400";
      case "high": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 transform hover:scale-105 group">
      {/* Game Image */}
      <div className="relative">
        <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <div className="text-6xl">🎰</div>
        </div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          {game.isNew && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              NEW
            </span>
          )}
          {game.isFeatured && (
            <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
              FEATURED
            </span>
          )}
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={handlePlayDemo}
            className="bg-white text-black font-bold py-3 px-6 rounded-full transform scale-90 group-hover:scale-100 transition-transform duration-300 hover:bg-yellow-400"
          >
            ▶️ Play Demo
          </button>
        </div>
      </div>

      {/* Game Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
            {game.name}
          </h3>
          <span className="text-sm text-gray-400 bg-white/10 px-2 py-1 rounded">
            {game.provider}
          </span>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
          <div className="text-center">
            <div className="text-gray-400">RTP</div>
            <div className="text-white font-semibold">{game.rtp}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Volatility</div>
            <div className={`font-semibold ${getVolatilityColor(game.volatility)}`}>
              {game.volatility}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Max Win</div>
            <div className="text-white font-semibold">{game.maxWin}</div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-1">Features:</div>
          <div className="flex flex-wrap gap-1">
            {game.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="text-xs bg-purple-600/30 text-purple-300 px-2 py-1 rounded"
              >
                {feature}
              </span>
            ))}
            {game.features.length > 3 && (
              <span className="text-xs text-gray-400">
                +{game.features.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePlayDemo}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
          >
            🎮 Play Demo
          </button>
          <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
            ❤️
          </button>
          <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
            ℹ️
          </button>
        </div>
      </div>
    </div>
  );
}
