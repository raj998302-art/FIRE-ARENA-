'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { vipAPI } from '@/lib/api';

export default function VIPPage() {
  const { user } = useAuth();
  const [vipStatus, setVipStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVIPStatus = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await vipAPI.getVipStatus();
        setVipStatus(response.data.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
          'Failed to load VIP status. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadVIPStatus();
  }, [user?.id]);

  const handlePurchaseVIP = async (plan: 'weekly' | 'monthly') => {
    if (!user?.id) return;

    // Define pricing
    const prices: Record<'weekly' | 'monthly', number> = {
      weekly: 49, // ₹49 per week
      monthly: 149 // ₹149 per month
    };

    const amount = prices[plan];

    try {
      const response = await vipAPI.purchaseVip({ plan, amount });
      // In a real app, this would initiate Razorpay payment
      alert(
        `VIP ${plan} subscription initiated! Amount: ₹${amount}\n` +
        'In production, this would open Razorpay payment gateway.'
      );
      // Refresh status after payment
      setTimeout(() => {
        loadVIPStatus();
      }, 2000);
    } catch (error) {
      console.error('Failed to purchase VIP:', error);
      alert('Failed to initiate VIP purchase. Please try again.');
    }
  };

  const handleCancelVIP = async () => {
    if (!user?.id) return;

    if (!window.confirm('Are you sure you want to cancel your VIP subscription?')) {
      return;
    }

    try {
      await vipAPI.cancelVip();
      setTimeout(() => {
        loadVIPStatus();
      }, 1000);
      alert('VIP subscription cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel VIP:', error);
      alert('Failed to cancel VIP subscription. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6">
        <div className="flex h-screen items-center justify-center">
          <div className="bg-red-900 border border-red-800 text-red-400 px-6 py-4 rounded-xl max-w-xl">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p>{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadVIPStatus();
              }}
              className="mt-4 bg-neon-blue text-white px-4 py-2 rounded-xl hover:bg-neon-blue/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Please log in</div>;
  }

  // If no VIP data yet, show loading state
  if (!vipStatus) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="flex h-screen items-center justify-center">
          <div className="text-gray-400">Loading VIP status...</div>
        </div>
      </div>
    );
  }

  const isVip = vipStatus.isVip;
  const vipLevel = vipStatus.vipLevel || 0;
  const daysRemaining = vipStatus.subscription?.daysRemaining || 0;
  const benefits = vipStatus.benefits || {
    multiplier: 1.0,
    tournamentDiscount: 0,
    earlyAccess: false,
    prioritySupport: false
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1a1a1a] border-r border-gray-700">
          <div className="flex items-center h-16 px-4 border-b border-gray-700">
            <span className="text-xl font-bold text-neon-blue">FIRE ARENA VIP</span>
          </div>

          <nav className="mt-6 space-y-2">
            <a href="/dashboard/vip" className="flex items-center px-4 py-3 text-neon-blue bg-[#222222] hover:text-white rounded-lg transition-colors duration-200">
              <span className="mr-3">👑</span>
              VIP Status
            </a>

            <a href="/dashboard/wallet" className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#222222] hover:text-white rounded-xl transition-colors duration-200">
              <span className="mr-3">💰</span>
              Wallet
            </a>

            <a href="/dashboard/tournaments" className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#222222] hover:text-white rounded-xl transition-colors duration-200">
              <span className="mr-3">🎮</span>
              Tournaments
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-neon-blue">VIP Status</h1>
            <p className="text-gray-400">Your premium gaming experience</p>
          </header>

          {/* VIP Status Card */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full ${
                isVip ? (vipLevel === 1 ? 'bg-neon-blue' : 'bg-neon-purple') : 'bg-gray-600'
              } flex items-center justify-center`}
              >
                {isVip ? (
                  vipLevel === 1 ? 'W' : 'M'
                ) : (
                  '✕'
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {isVip ? 'VIP ACTIVE' : 'VIP INACTIVE'}
                </h2>
                <p className="text-sm text-gray-400">
                  {isVip ? `Level ${vipLevel === 1 ? 'Weekly' : 'Monthly'} VIP` : 'No active subscription'}
                </p>
              </div>
            </div>

            {isVip && (
              <div className="mt-4">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Expires in</span>
                  <span className="text-lg font-semibold text-neon-blue">
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <div className="h-0.5 bg-gray-600 rounded-full mt-2">
                  <div className={`h-full bg-neon-blue rounded-full transition-all duration-500` style={{ width: `${Math.max(0, Math.min(100, (daysRemaining / 30) * 100))}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {daysRemaining <= 3 && (
                    <span className="text-neon-blue font-medium">
                      ⚠️ Subscription expiring soon! Renew to maintain benefits.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* VIP Benefits */}
          {!isVip ? (
            <div className="bg-[#1a1a1a] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-neon-blue">Become VIP Today</h2>
              <p className="text-gray-400 mb-4">
                Unlock exclusive benefits and enhance your gaming experience with our VIP subscriptions.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => handlePurchaseVIP('weekly')}
                  className="w-full bg-neon-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-neon-blue/90 transition-all duration-200"
                >
                  Weekly VIP - ₹49/week
                </button>
                <button
                  onClick={() => handlePurchaseVIP('monthly')}
                  className="w-full bg-neon-purple text-white px-6 py-3 rounded-xl font-medium hover:bg-neon-purple/90 transition-all duration-200"
                >
                  Monthly VIP - ₹149/month
                </button>
              </div>
              <div className="mt-6 p-4 bg-[#1a1a1a] rounded-xl">
                <h3 className="text-lg font-semibold mb-3 text-neon-blue">VIP Benefits</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                    <span className="text-white">20% Bonus Winnings</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                    <span className="text-white">10% Tournament Discount</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                    <span className="text-white">Early Tournament Access</span>
                  </div
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Weekly VIP */}
              <div className="bg-[#1a1a1a] rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 text-neon-blue">Weekly VIP</h2>
                <p className="text-gray-400 mb-3">₹49 per week</p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                    <span className="text-white">20% Bonus Winnings (1.2x multiplier)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                    <span className="text-white">10% Tournament Fee Discount</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                    <span className="text-white">Early Access to New Tournaments</span>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchaseVIP('weekly')}
                  className="mt-4 w-full bg-neon-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-neon-blue/90 transition-all duration-200"
                >
                  Subscribe Weekly
                </button>
              </div>

              {/* Monthly VIP */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4 text-neon-blue">Monthly VIP</h2>
                <p className="text-gray-400 mb-3">₹149 per month</p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                    <span className="text-white">50% Bonus Winnings (1.5x multiplier)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                    <span className="text-white">25% Tournament Fee Discount</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                    <span className="text-white">Priority Customer Support</span>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchaseVIP('monthly')}
                  className="mt-4 w-full bg-neon-purple text-white px-6 py-3 rounded-xl font-medium hover:bg-neon-purple/90 transition-all duration-200"
                >
                  Subscribe Monthly
                </button>
              </div>
            </div>
          )}

          {/* VIP Benefits (Active Subscriber) */}
          {isVip && (
            <div className="bg-[#1a1a1a] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-neon-blue">Your VIP Benefits</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                  <span className="text-white">{benefits.multiplier > 1.0 ? `${benefits.multiplier}x` : '1x'} Winnings Multiplier</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                  <span className="text-white">{benefits.tournamentDiscount}% Tournament Discount</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                  <span className="text-white">{benefits.earlyAccess ? 'Early Tournament Access' : 'Standard Access'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                  <span className="text-white">{benefits.prioritySupport ? 'Priority Support' : 'Standard Support'}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}