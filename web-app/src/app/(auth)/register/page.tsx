'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register({
        username,
        email,
        password,
        firstName,
        lastName,
        phoneNumber
      });
      // Assuming the API returns { token: '...' }
      login(response.data.token);
      router.push('/');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'An error occurred during registration. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neon-blue">FIRE ARENA MAX</h1>
          <p className="text-gray-400">Create your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              minLength={3}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all duration-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
              First Name (Optional)
            </label>
            <input
              id="firstName"
              type="text"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all duration-200"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
              Last Name (Optional)
            </label>
            <input
              id="lastName"
              type="text"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all duration-200"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number (Optional)
            </label>
            <input
              id="phoneNumber"
              type="tel"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all duration-200"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="bg-red-900 border border-red-800 text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neon-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-neon-blue/90 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-b-2 border-white"></span>
                <span>Creating account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        
        <div className="text-center text-gray-500 mt-4">
          <p className="text-sm">
            Already have an account?{' '}
            <a 
              href="/auth/login" 
              className="text-neon-blue hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
