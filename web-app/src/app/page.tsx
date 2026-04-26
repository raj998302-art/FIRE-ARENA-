export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
          FIRE ARENA MAX
        </h1>
        <p className="text-xl text-center text-neon-blue mb-12">
          Real Money Esports Platform
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature cards will go here */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 hover:bg-[#222222] transition-all duration-300">
            <h3 className="text-lg font-semibold mb-4 text-neon-blue">🎮 Tournaments</h3>
            <p className="text-gray-400">Compete in solo, duo, and squad tournaments</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 hover:bg-[#222222] transition-all duration-300">
            <h3 className="text-lg font-semibold mb-4 text-neon-blue">💰 Wallet</h3>
            <p className="text-gray-400">Secure wallet with instant deposits</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 hover:bg-[#222222] transition-all duration-300">
            <h3 className="text-lg font-semibold mb-4 text-neon-blue">💬 Chat</h3>
            <p className="text-gray-400">Real-time global and team chat</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 hover:bg-[#222222] transition-all duration-300">
            <h3 className="text-lg font-semibold mb-4 text-neon-blue">👑 VIP</h3>
            <p className="text-gray-400">Exclusive VIP tournaments and rewards</p>
          </div>
        </div>
      </div>
    </div>
  );
}
