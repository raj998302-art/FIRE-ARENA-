import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const { login } = useAuth();
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
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
      navigation.navigate('Dashboard');
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>FIRE ARENA MAX</Text>
          <Text style={styles.subtitle}>Real Money Esports Platform</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TextInput
            style={styles.input}
            placeholder="First Name (Optional)"
            value={firstName}
            onChangeText={setFirstName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Last Name (Optional)"
            value={lastName}
            onChangeText={setLastName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone Number (Optional)"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          
          {error && (
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}
          
          <Button
            title={loading ? 'Creating account...' : 'Register'}
            onPress={handleRegister}
            disabled={loading}
            color="#00f3ff"
          />
          
          <Button
            title="Already have an account? Login"
            onPress={() => navigation.navigate('Login')}
            color="#ff00ff"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00f3ff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b5cf6',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 12,
    fontSize: 14,
  },
});
