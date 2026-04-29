import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const myReviews = [
  { id: 1, movie: "Dune: Part Two", rating: 9, mood: "Amazed", date: "Mar 2024", snippet: "An absolute visual spectacle that blew my mind..." },
  { id: 2, movie: "Oppenheimer", rating: 8, mood: "Moved", date: "Aug 2023", snippet: "Nolan at his finest..." },
  { id: 3, movie: "The Batman", rating: 7, mood: "Thrilled", date: "Mar 2022", snippet: "Dark, gritty and emotional..." },
  { id: 4, movie: "Past Lives", rating: 9, mood: "Heartbroken", date: "Jun 2023", snippet: "A quiet devastation..." },
];

export default function MyReviewsScreen() {
  const [filter, setFilter] = useState("All");

  const filters = ["All", "Amazed", "Moved", "Thrilled", "Heartbroken"];

  const filtered =
    filter === "All"
      ? myReviews
      : myReviews.filter((r) => r.mood === filter);

  return (
    <ScrollView style={styles.container}>
      
      {/* HEADER */}
      <Text style={styles.title}>My Reviews</Text>
      <Text style={styles.subtitle}>
        {myReviews.length} reviews written
      </Text>

      {/* FILTER */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.tab, filter === f && styles.activeTab]}
          >
            <Text style={[styles.tabText, filter === f && styles.activeTabText]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* LIST */}
      {filtered.length > 0 ? (
        filtered.map((review) => (
          <View key={review.id} style={styles.card}>
            
            {/* TOP */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.movie}>{review.movie}</Text>
                <Text style={styles.date}>{review.date}</Text>
              </View>

              <View style={styles.right}>
                <Text style={styles.mood}>{review.mood}</Text>
                <Text style={styles.rating}>⭐ {review.rating}</Text>
              </View>
            </View>

            {/* SNIPPET */}
            <Text style={styles.snippet}>{review.snippet}</Text>

            {/* ACTION */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btn}>
                <Text style={styles.btnText}>✏️ Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btn}>
                <Text style={[styles.btnText, { color: "#f87171" }]}>
                  🗑 Delete
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={{ fontSize: 30 }}>📝</Text>
          <Text style={styles.emptyText}>
            No reviews with this mood yet
          </Text>
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

  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    color: "rgba(255,255,255,0.5)",
    marginBottom: 16,
  },

  tabs: {
    flexDirection: "row",
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

  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  movie: {
    color: "white",
    fontWeight: "600",
  },

  date: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },

  right: {
    alignItems: "flex-end",
  },

  mood: {
    color: "#aaa",
    fontSize: 12,
  },

  rating: {
    color: "#e8b84b",
    fontWeight: "bold",
  },

  snippet: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 8,
    fontSize: 13,
  },

  actions: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },

  btn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  btnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },

  empty: {
    alignItems: "center",
    marginTop: 60,
  },

  emptyText: {
    color: "rgba(255,255,255,0.5)",
    marginTop: 10,
  },
});