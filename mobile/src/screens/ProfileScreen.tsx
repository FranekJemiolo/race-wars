import React from 'react';
import {View, Text, StyleSheet, Button} from 'react-native';
import {useAuth} from '../store/AuthContext';

export default function ProfileScreen() {
  const {user, logout} = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user && (
        <>
          <Text style={styles.label}>Display Name:</Text>
          <Text style={styles.value}>{user.displayName}</Text>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
          {user.carNumber && (
            <>
              <Text style={styles.label}>Car Number:</Text>
              <Text style={styles.value}>{user.carNumber}</Text>
            </>
          )}
        </>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#666',
  },
  value: {
    fontSize: 18,
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 30,
  },
});
