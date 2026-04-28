import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Button} from 'react-native';

export default function ActiveSessionScreen({route, navigation}: any) {
  const {session} = route.params;
  const [isTracking, setIsTracking] = useState(false);
  const [position, setPosition] = useState({lat: 0, lng: 0, speed: 0});

  const startTracking = () => {
    setIsTracking(true);
    // TODO: Implement GPS tracking
  };

  const stopTracking = () => {
    setIsTracking(false);
    // TODO: Stop GPS tracking
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{session.name}</Text>
      <Text style={styles.status}>
        Status: {isTracking ? 'Tracking' : 'Not Tracking'}
      </Text>
      {isTracking && (
        <>
          <Text style={styles.info}>Latitude: {position.lat}</Text>
          <Text style={styles.info}>Longitude: {position.lng}</Text>
          <Text style={styles.info}>Speed: {position.speed} km/h</Text>
        </>
      )}
      <View style={styles.buttonContainer}>
        {!isTracking ? (
          <Button title="Start Tracking" onPress={startTracking} />
        ) : (
          <Button title="Stop Tracking" onPress={stopTracking} />
        )}
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
  status: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  info: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 30,
  },
});
