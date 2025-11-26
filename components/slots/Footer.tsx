"use client";

export default function Footer() {
  return (
    <footer className="bg-black/40 backdrop-blur-md border-t border-purple-500/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              🎰 SlotVerse
            </h3>
            <p className="text-gray-400 mb-4 max-w-md">
              The ultimate destination for free slot game demos. Discover, play, and enjoy 
              the latest games from top providers without any registration required.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <span className="sr-only">Facebook</span>
                📘
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <span className="sr-only">Twitter</span>
                🐦
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <span className="sr-only">Instagram</span>
                📷
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <span className="sr-only">YouTube</span>
                📺
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#games" className="text-gray-400 hover:text-purple-400 transition-colors">Demo Slots</a></li>
              <li><a href="#providers" className="text-gray-400 hover:text-purple-400 transition-colors">Game Providers</a></li>
              <li><a href="#upcoming" className="text-gray-400 hover:text-purple-400 transition-colors">Upcoming Games</a></li>
              <li><a href="#calendar" className="text-gray-400 hover:text-purple-400 transition-colors">Release Calendar</a></li>
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Game Reviews</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">New Releases</a></li>
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">High RTP Slots</a></li>
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Megaways Games</a></li>
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Jackpot Slots</a></li>
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Classic Slots</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-purple-500/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2024 SlotVerse. All rights reserved. Play responsibly.
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Responsible Gaming</a>
            <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Contact Us</a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>
            🔞 This website is intended for users 18+ only. All games are for entertainment purposes only. 
            No real money gambling. Always gamble responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}
