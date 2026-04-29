import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const mockMovies = [
  { id: 1, title: "Dune: Part Two", year: 2024, genre: "Sci-Fi", rating: 8.5, poster: "🏜️" },
  { id: 2, title: "Oppenheimer", year: 2023, genre: "Drama", rating: 8.9, poster: "💣" },
  { id: 3, title: "The Batman", year: 2022, genre: "Action", rating: 7.8, poster: "🦇" },
  { id: 4, title: "Past Lives", year: 2023, genre: "Romance", rating: 7.9, poster: "🌸" },
  { id: 5, title: "Alien: Romulus", year: 2024, genre: "Horror", rating: 7.3, poster: "👾" },
  { id: 6, title: "Inside Out 2", year: 2024, genre: "Animation", rating: 7.6, poster: "🧠" },
];

export default function WatchlistScreen() {
  const router = useRouter();
  const [movies, setMovies] = useState(mockMovies);

  function removeMovie(id) {
    setMovies((prev) => prev.filter((m) => m.id !== id));
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/movies/${item.id}`)}
    >
      {/* Poster */}
      <View style={styles.poster}>
        <Text style={styles.posterText}>{item.poster}</Text>

        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeMovie(item.id)}
        >
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={styles.meta}>
          {item.year} · {item.genre}
        </Text>

        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Watchlist</Text>
          <Text style={styles.sub}>
            {movies.length} films saved
          </Text>
        </View>

        <View style={styles.gridBtn}>
          <Text style={styles.gridText}>Grid ▼</Text>
        </View>
      </View>

      {movies.length > 0 ? (
        <FlatList
          data={movies}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎬</Text>
          <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
          <Text style={styles.emptySub}>
            Discover films and save them here
          </Text>

          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push("/(tabs)/discover")}
          >
            <Text style={styles.browseText}>Browse Movies</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  sub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },

  gridBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  gridText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },

  card: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },

  poster: {
    height: 160,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  posterText: {
    fontSize: 40,
  },

  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  removeText: {
    color: "#f87171",
    fontSize: 12,
  },

  info: {
    padding: 10,
  },

  title: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },

  meta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  star: {
    color: "#e8b84b",
    fontSize: 12,
  },

  rating: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginLeft: 4,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  emptySub: {
    color: "rgba(255,255,255,0.4)",
    marginTop: 6,
  },

  browseBtn: {
    marginTop: 16,
    backgroundColor: "#e8b84b",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  browseText: {
    color: "black",
    fontWeight: "bold",
  },
});