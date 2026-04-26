import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    // In a real app, you would redirect to login
    return <div>Redirecting to login...</div>;
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1a1a1a] border-r border-gray-700">
          <div className="flex items-center h-16 px-4 border-b border-gray-700">
            <span className="text-xl font-bold text-neon-blue">FIRE ARENA</span>
          </div>
          
          <nav className="mt-6 space-y-2">
            <a href="/dashboard/wallet" className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#222222] hover:text-white rounded-lg transition-colors duration-200">
              <span className="mr-3">💰</span>
              Wallet
            </a>
            
            <a href="/dashboard/tournaments" className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#222222] hover:text-white rounded-lg transition-colors duration-200">
              <span className="mr-3">🎮</span>
              Tournaments
            </a>
            
            <a href="/dashboard/team" className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#222222] hover:text-white rounded-lg transition-colors duration-200">
              <span className="mr-3">👥</span>
              Teams
            </a>
            
            <a href="/dashboard/chat" className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#222222] hover:text-white rounded-lg transition-colors duration-200">
              <span className="mr-3">💬</span>
              Chat
            </a>
            
            <a href="/dashboard/vip" className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#222222] hover:text-white rounded-lg transition-colors duration-200">
              <span className="mr-3">👑</span>
              VIP
            </a>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-neon-blue">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.username || 'Player'}!</p>
          </header>
          
          <div className="grid gap-6">
            <div className="bg-[#1a1a1a] rounded-xl p-6 hover:bg-[#222222] transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4 text-neon-blue">💰 Wallet Balance</h2>
              <p className="text-2xl font-bold text-neon-blue">₹1,250.00</p>
              <p className="text-gray-400 mt-2">Available for tournaments</p>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-xl p-6 hover:bg-[#222222] transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4 text-neon-blue">🎯 Active Tournaments</h2>
              <p className="text-xl font-bold">3</p>
              <p className="text-gray-400 mt-2">Join now to compete</p>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-xl p-6 hover:bg-[#222222] transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4 text-neon-blue">👥 My Teams</h2>
              <p className="text-xl font-bold">2</p>
              <p className="text-gray-400 mt-2">Lead your squad to victory</p>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-xl p-6 hover:bg-[#222222] transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4 text-neon-blue">📢 Notifications</h2>
              <div className="space-y-2 mt-3">
                <div className="flex items-center space-x-3 p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                  <span className="text-gray-300">New tournament: Summer Clash 2026</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="w-3 h-3 bg-neon-purple rounded-full"></div>
                  <span className="text-gray-300">VIP subscription expiring in 3 days</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
