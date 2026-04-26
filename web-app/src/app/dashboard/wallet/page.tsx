'use client';

import { useAuth } from '@/contexts/AuthContext';
import { walletAPI } from '@/lib/api';
import { useState, useEffect } from 'react';

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        // Get balance
        const balanceResponse = await walletAPI.getBalance();
        setBalance(balanceResponse.data.walletBalance);
        
        // Get transactions
        const transactionsResponse = await walletAPI.getTransactions();
        setTransactions(transactionsResponse.data.transactions);
      } catch (error) {
        console.error('Failed to load wallet data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadWalletData();
  }, [user?.id]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    try {
      // In a real app, this would initiate Razorpay payment
      // For now, we'll simulate a direct wallet credit (NOT SECURE - for demo only)
      await walletAPI.addFunds({
        amount,
        category: 'deposit',
        description: 'Manual deposit (demo only)',
        referenceId: `demo_deposit_${Date.now()}`,
        referenceType: 'manual'
      });
      
      // Refresh balance
      const balanceResponse = await walletAPI.getBalance();
      setBalance(balanceResponse.data.walletBalance);
      
      // Clear input
      setDepositAmount('');
      
      alert('Funds added successfully!');
    } catch (error) {
      console.error('Failed to add funds:', error);
      alert('Failed to add funds. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <div className="flex h-screen items-center justify-center">Please log in</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neon-blue">Wallet</h1>
        <p className="text-gray-400">Manage your FIRE ARENA MAX funds</p>
      </div>
      
      <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-neon-blue">Wallet Balance</h2>
            <p className="text-4xl font-bold text-neon-blue mt-2">₹{balance.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Available Balance</p>
            <p className="text-lg font-semibold text-green-400">₹{(balance).toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-neon-blue">Add Funds</h2>
        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="flex">
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Enter amount (₹)"
              className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <button
              type="submit"
              className="ml-4 bg-neon-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-neon-blue/90 transition-all duration-200"
            >
              Add Funds
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: In production, this would integrate with Razorpay for secure payments
          </p>
        </form>
      </div>
      
      <div className="bg-[#1a1a1a] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-neon-blue">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No transactions yet</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-start py-3 border-t border-gray-700 first:border-t-0">
                <div>
                  <h3 className="font-semibold text-white">{tx.category.replace('_', ' ').toUpperCase()}</h3>
                  <p className="text-gray-400 text-sm">{new Date(tx.createdAt).toLocaleString()}</p>
                  {tx.description && (
                    <p className="text-gray-300 mt-1">{tx.description}</p>
                  )}
                </div>
                <div className="text-right space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    tx.type === 'credit' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                  }`}
                  >
                    {tx.type === 'credit' ? '+' : '-' }₹{Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
