import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const categories = [
  { key: "trending", label: "🔥 Trending" },
  { key: "new", label: "✨ New" },
  { key: "awarded", label: "🏆 Awarded" },
];

const movies = {
  trending: [
    { id: 1, title: "Dune: Part Two", year: 2024, genre: "Sci-Fi", rating: 8.7, emoji: "🏜️", reviews: 1240 },
    { id: 2, title: "Deadpool & Wolverine", year: 2024, genre: "Action", rating: 7.8, emoji: "🦸", reviews: 2100 },
  ],
  new: [
    { id: 3, title: "Joker 2", year: 2024, genre: "Drama", rating: 5.3, emoji: "🃏", reviews: 1900 },
  ],
  awarded: [
    { id: 4, title: "Oppenheimer", year: 2023, genre: "Drama", rating: 8.9, emoji: "💣", reviews: 4500 },
  ],
};

export default function DiscoverScreen() {
  const [activeCategory, setActiveCategory] = useState("trending");
  const [layout, setLayout] = useState("grid");

  const list = movies[activeCategory] || [];

  return (
    <ScrollView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {categories.find(c => c.key === activeCategory)?.label}
        </Text>
        <Text style={styles.headerSub}>{list.length} films found</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tabs}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setActiveCategory(cat.key)}
              style={[
                styles.tab,
                activeCategory === cat.key && styles.activeTab,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeCategory === cat.key && styles.activeTabText,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={() => setLayout(layout === "grid" ? "list" : "grid")}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleText}>
              {layout === "grid" ? "☰ List" : "⊞ Grid"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Content */}
      {layout === "grid" ? (
        <View style={styles.grid}>
          {list.map((movie) => (
            <View key={movie.id} style={styles.card}>
              
              <View style={styles.poster}>
                <Text style={{ fontSize: 40 }}>{movie.emoji}</Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.movieSub}>
                  {movie.year} · {movie.genre}
                </Text>

                <View style={styles.row}>
                  <Text style={styles.rating}>⭐ {movie.rating}</Text>
                  <Text style={styles.reviews}>
                    {(movie.reviews / 1000).toFixed(1)}k
                  </Text>
                </View>
              </View>

            </View>
          ))}
        </View>
      ) : (
        <View>
          {list.map((movie, i) => (
            <View key={movie.id} style={styles.listItem}>
              
              <Text style={styles.index}>{i + 1}</Text>

              <View style={styles.smallPoster}>
                <Text>{movie.emoji}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.movieSub}>
                  {movie.year} · {movie.genre}
                </Text>
              </View>

              <Text style={styles.rating}>⭐ {movie.rating}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    padding: 16,
  },

  header: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  headerSub: {
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },

  tabs: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginRight: 8,
  },

  activeTab: {
    backgroundColor: "#e8b84b",
    borderColor: "#e8b84b",
  },

  tabText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },

  activeTabText: {
    color: "black",
  },

  toggleBtn: {
    marginLeft: "auto",
    paddingHorizontal: 12,
  },

  toggleText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    marginBottom: 12,
  },

  poster: {
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },

  cardContent: {
    padding: 10,
  },

  movieTitle: {
    color: "white",
    fontWeight: "600",
  },

  movieSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  rating: {
    color: "#e8b84b",
  },

  reviews: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  index: {
    color: "#555",
    width: 20,
  },

  smallPoster: {
    width: 40,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
});