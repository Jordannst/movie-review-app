import React from 'react';
import { TouchableOpacity, StyleSheet, Linking, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PlayButtonProps = {
  trailerUrl?: string;
  size?: number;
};

export function PlayButton({ trailerUrl, size = 50 }: PlayButtonProps) {
  const handlePlayTrailer = async () => {
    // URL default jika film tidak memiliki trailer di database
    const url = trailerUrl || "https://www.youtube.com/watch?v=uYPbbksJxIg"; 
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Oops!", "Link trailer tidak dapat dibuka.");
      }
    } catch (error) {
      console.error("Gagal membuka URL:", error);
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity 
        style={[
          styles.button, 
          { width: size, height: size, borderRadius: size / 2 }
        ]} 
        onPress={handlePlayTrailer}
        activeOpacity={0.8}
      >
        <Ionicons name="play" size={size * 0.55} color="#0B0D12" style={{ paddingLeft: size * 0.08 }} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  button: {
    backgroundColor: '#FFC300',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
});