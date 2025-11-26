"use client";

export default function HeroSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-pink-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            25,000+
          </span>
          <br />
          <span className="text-white">Free Demo Slots</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Discover the latest slot games from top providers. Play free demos, explore new releases, 
          and find your next favorite game on SlotVerse.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
            🎰 Explore Games
          </button>
          <button className="border-2 border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300">
            📅 View Calendar
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">25,000+</div>
            <div className="text-gray-400">Demo Slots</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-400">150+</div>
            <div className="text-gray-400">Game Providers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">500+</div>
            <div className="text-gray-400">New Games Monthly</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">1M+</div>
            <div className="text-gray-400">Monthly Players</div>
          </div>
        </div>
      </div>
    </section>
  );
}
