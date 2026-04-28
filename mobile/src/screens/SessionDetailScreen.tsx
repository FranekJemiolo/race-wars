import React from 'react';
import {View, Text, StyleSheet, Button} from 'react-native';

export default function SessionDetailScreen({route, navigation}: any) {
  const {session} = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{session.name}</Text>
      <Text style={styles.info}>
        Type: {session.sessionType.toUpperCase()}
      </Text>
      <Text style={styles.info}>
        Start: {new Date(session.scheduledStart).toLocaleString()}
      </Text>
      <Text style={styles.info}>
        End: {new Date(session.scheduledEnd).toLocaleString()}
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Join Session"
          onPress={() => navigation.navigate('ActiveSession', {session})}
        />
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
  info: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 30,
  },
});
