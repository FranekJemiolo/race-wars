import React from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {Session} from '../types';

const mockSessions: Session[] = [
  {
    id: '1',
    trackId: '1',
    name: 'Weekend Race - Laguna Seca',
    sessionType: 'race',
    scheduledStart: new Date(Date.now() + 86400000).toISOString(),
    scheduledEnd: new Date(Date.now() + 90000000).toISOString(),
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    trackId: '2',
    name: 'Practice Session - Buttonwillow',
    sessionType: 'practice',
    scheduledStart: new Date(Date.now() + 172800000).toISOString(),
    scheduledEnd: new Date(Date.now() + 176400000).toISOString(),
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  },
];

export default function SessionsScreen({navigation}: any) {
  const renderSession = ({item}: {item: Session}) => (
    <View style={styles.sessionCard}>
      <Text style={styles.sessionName}>{item.name}</Text>
      <Text style={styles.sessionType}>
        {item.sessionType.toUpperCase()}
      </Text>
      <Text style={styles.sessionDate}>
        {new Date(item.scheduledStart).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Sessions</Text>
      <FlatList
        data={mockSessions}
        renderItem={renderSession}
        keyExtractor={item => item.id}
        style={styles.list}
      />
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
  list: {
    flex: 1,
  },
  sessionCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sessionType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  sessionDate: {
    fontSize: 12,
    color: '#999',
  },
});
