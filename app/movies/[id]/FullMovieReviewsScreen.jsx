import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const movieInfo = {
  title: "Dune: Part Two",
  year: 2024,
  genre: "Sci-Fi / Adventure",
  avgRating: 8.7,
  totalReviews: 4,
  poster: "🏜️",
};

const reviewsData = [
  {
    id: 1,
    user: "Alex M.",
    rating: 9,
    mood: "Amazed",
    date: "Mar 15, 2024",
    spoiler: false,
    body: "Denis Villeneuve delivers a masterclass in epic filmmaking.",
  },
  {
    id: 2,
    user: "Sarah K.",
    rating: 8,
    mood: "Moved",
    date: "Mar 10, 2024",
    spoiler: true,
    body: "The ending hit me harder than expected.",
  },
  {
    id: 3,
    user: "Mike R.",
    rating: 10,
    mood: "Thrilled",
    date: "Mar 8, 2024",
    spoiler: false,
    body: "Best movie of the year, easily.",
  },
];

export default function FullMovieReviewsScreen({ onNavigate }) {
  const [sort, setSort] = useState("Recent");
  const [revealedSpoilers, setRevealedSpoilers] = useState([]);

  const filteredReviews =
    sort === "Top Rated"
      ? [...reviewsData].sort((a, b) => b.rating - a.rating)
      : sort === "Spoiler-Free"
      ? reviewsData.filter((r) => !r.spoiler)
      : reviewsData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* 🎬 Movie Header */}
        <View style={styles.headerCard}>
          <View style={styles.poster}>
            <Text style={styles.posterText}>{movieInfo.poster}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{movieInfo.title}</Text>
            <Text style={styles.meta}>
              {movieInfo.year} · {movieInfo.genre}
            </Text>

            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.rating}>{movieInfo.avgRating}/10</Text>
              <Text style={styles.sub}>
                · {movieInfo.totalReviews} reviews
              </Text>
            </View>
          </View>
        </View>

        {/* 🔽 Sort */}
        <View style={styles.sortRow}>
          <Text style={styles.sectionTitle}>All Reviews</Text>

          <View style={styles.sortBtns}>
            {["Recent", "Top Rated", "Spoiler-Free"].map((s) => (
              <Pressable
                key={s}
                onPress={() => setSort(s)}
                style={[
                  styles.sortBtn,
                  sort === s && styles.sortActive,
                ]}
              >
                <Text
                  style={[
                    styles.sortText,
                    sort === s && styles.sortTextActive,
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 📝 Reviews */}
        {filteredReviews.length > 0 ? (
          filteredReviews.map((r) => (
            <View key={r.id} style={styles.card}>
              
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.userRow}>
                  <View style={styles.avatar}>
                    <Text>{r.user[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.username}>{r.user}</Text>
                    <Text style={styles.date}>{r.date}</Text>
                  </View>
                </View>

                <View style={styles.ratingBox}>
                  {r.spoiler && (
                    <Text style={styles.spoiler}>⚠️</Text>
                  )}
                  <Text style={styles.rating}>
                    ★ {r.rating}
                  </Text>
                </View>
              </View>

              {/* Body */}
              {r.spoiler && !revealedSpoilers.includes(r.id) ? (
                <Pressable
                  style={styles.spoilerBox}
                  onPress={() =>
                    setRevealedSpoilers((prev) => [...prev, r.id])
                  }
                >
                  <Text style={styles.spoilerText}>
                    Contains Spoiler - Tap to reveal
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.body}>{r.body}</Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    padding: 16,
  },

  headerCard: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  poster: {
    width: 60,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },

  posterText: {
    fontSize: 28,
  },

  title: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  meta: {
    color: "#888",
    fontSize: 12,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  star: {
    color: "#e8b84b",
  },

  rating: {
    color: "white",
    marginLeft: 4,
  },

  sub: {
    color: "#666",
    marginLeft: 6,
    fontSize: 12,
  },

  sortRow: {
    marginBottom: 15,
  },

  sectionTitle: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 8,
  },

  sortBtns: {
    flexDirection: "row",
    gap: 8,
  },

  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#222",
  },

  sortActive: {
    backgroundColor: "#e8b84b",
  },

  sortText: {
    color: "#aaa",
    fontSize: 12,
  },

  sortTextActive: {
    color: "black",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  userRow: {
    flexDirection: "row",
    gap: 8,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e8b84b",
    alignItems: "center",
    justifyContent: "center",
  },

  username: {
    color: "white",
    fontSize: 13,
  },

  date: {
    color: "#777",
    fontSize: 11,
  },

  ratingBox: {
    alignItems: "flex-end",
  },

  spoiler: {
    color: "#f87171",
    fontSize: 12,
  },

  body: {
    color: "#ccc",
    fontSize: 13,
  },

  spoilerBox: {
    backgroundColor: "#222",
    padding: 10,
    borderRadius: 8,
  },

  spoilerText: {
    color: "#aaa",
    fontSize: 12,
  },

  empty: {
    alignItems: "center",
    marginTop: 50,
  },

  emptyText: {
    color: "#666",
  },
});