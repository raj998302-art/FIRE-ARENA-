import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch stats from API
    // For demo, we'll simulate with timeout
    setTimeout(() => {
      setStats({
        walletBalance: 1250.00,
        activeTournaments: 3,
        myTeams: 2,
        notifications: 5
      });
      setLoading(false);
    }, 1000);
  }, [user?.id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Please log in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>FIRE ARENA MAX</Text>
        <Text style={styles.userGreeting}>Welcome back, {user.username}!</Text>
      </View>
      
      <View style={stats ? statsContainer : null}>
        <View style={statsGrid}>
          <TouchableOpacity 
            activeOpacity={0.7}
            style={statCard}
          >
            <Text style={statLabel}>💰 Wallet Balance</Text>
            <Text style={statValue}>₹{stats.walletBalance.toFixed(2)}</Text>
            <Text style={statSubtext}>Available for tournaments</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7}
            style={statCard}
          >
            <Text style={statLabel}>🎯 Active Tournaments</Text>
            <Text style={statValue}>{stats.activeTournaments}</Text>
            <Text style={statSubtext}>Join now to compete</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7}
            style={statCard}
          >
            <Text style={statLabel}>👥 My Teams</Text>
            <Text style={statValue}>{stats.myTeams}</Text>
            <Text style={statSubtext}>Lead your squad to victory</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7}
            style={statCard}
          >
            <Text style={statLabel}>📢 Notifications</Text>
            <Text style={statValue}>{stats.notifications}</Text>
            <Text style={statSubtext}>New updates available</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            activeOpacity={0.7}
            style={actionButton}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>💰</Text>
            </View>
            <Text style={styles.actionText}>Add Funds</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7}
            style={actionButton}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>🎮</Text>
            </View>
            <Text style={styles.actionText}>Join Tournament</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7}
            style={actionButton}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>👥</Text>
            </View>
            <Text style={styles.actionText}>Create Team</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7}
            style={actionButton}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>💬</Text>
            </View>
            <Text style={styles.actionText}>Join Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00f3ff',
    marginBottom: 4,
  },
  userGreeting: {
    fontSize: 18,
    color: '#8b5cf6',
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    width: '48%',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#888',
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    width: '48%',
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#00f3ff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
