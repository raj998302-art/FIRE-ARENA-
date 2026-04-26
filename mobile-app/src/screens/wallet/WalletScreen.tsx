import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { walletAPI } from '@/services/api';

export default function WalletScreen() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    const loadWalletData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
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

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    try {
      // In a real app, this would initiate Razorpay payment
      // For demo, we'll simulate a direct wallet credit
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
      
      Alert.alert('Success', 'Funds added successfully!');
    } catch (error) {
      console.error('Failed to add funds:', error);
      Alert.alert('Error', 'Failed to add funds. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00f3ff" />
      </View>
    );
  }
  
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.centerText}>Please log in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>
      
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        <View style={styles.balanceDetails}>
          <Text style={styles.detailText}>Available: ₹{balance.toFixed(2)}</Text>
          <Text style={styles.detailText}>Locked: ₹0.00</Text>
        </View>
      </View>
      
      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Enter amount to add (₹)"
          keyboardType="numeric"
          value={depositAmount}
          onChangeText={setDepositAmount}
        />
        <Button
          title="Add Funds"
          onPress={handleDeposit}
          color="#00f3ff"
        />
      </View>
      
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {transactions.length === 0 ? (
          <Text style={styles.centerText}>No transactions yet</Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {item.category.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.transactionTime}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[
                    styles.transactionAmountText,
                    item.type === 'credit' ? styles.creditAmount : styles.debitAmount
                  ]}>
                    {item.type === 'credit' ? '+' : '-' }₹{Math.abs(item.amount).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
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
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00f3ff',
  },
  balanceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    margin: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00f3ff',
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#aaa',
  },
  inputSection: {
    padding: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  transactionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  centerText: {
    color: '#888',
    textAlign: 'center',
    padding: 40,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  transactionInfo: {
    flexDirection: 'column',
  },
  transactionType: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: '#777',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  creditAmount: {
    color: '#4ade80',
  },
  debitAmount: {
    color: '#f87171',
  },
});
