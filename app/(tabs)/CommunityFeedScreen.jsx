import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const feedItems = [
  { id: 1, user: "Sarah K.", avatar: "🌸", movie: "Past Lives", rating: 9, mood: "Heartbroken", time: "2h ago", snippet: "A quiet devastation. Celine Song's debut is one of the most emotionally precise films I've ever seen.", spoiler: false },
  { id: 2, user: "Mike R.", avatar: "⚡", movie: "Alien: Romulus", rating: 7, mood: "Thrilled", time: "5h ago", snippet: "Fede Álvarez knows how to create genuine tension.", spoiler: false },
];

export default function CommunityFeedScreen() {
  const [tab, setTab] = useState("All");
  const tabs = ["All", "Following", "Top Rated", "New"];

  return (
    <ScrollView style={styles.container}>
      
      {/* Header */}
      <Text style={styles.title}>Community</Text>
      <Text style={styles.subtitle}>See what others are watching</Text>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.activeTab]}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Feed */}
      {feedItems.map((item) => (
        <View key={item.id} style={styles.card}>
          
          {/* User Row */}
          <View style={styles.userRow}>
            <View style={styles.userInfo}>
              <Text style={styles.avatar}>{item.avatar}</Text>
              <View>
                <Text style={styles.username}>{item.user}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>

            <Text style={styles.rating}>⭐ {item.rating}</Text>
          </View>

          {/* Movie */}
          <Text style={styles.movie}>🎬 {item.movie}</Text>

          {/* Snippet */}
          <Text style={styles.snippet}>{item.snippet}</Text>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.mood}>{item.mood}</Text>

            <View style={styles.actions}>
              <Text style={styles.actionText}>👍 Like</Text>
              <Text style={styles.actionText}>💬 Comment</Text>
            </View>
          </View>

        </View>
      ))}
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

  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  avatar: {
    fontSize: 20,
  },

  username: {
    color: "white",
    fontWeight: "600",
  },

  time: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },

  rating: {
    color: "#e8b84b",
    fontWeight: "bold",
  },

  movie: {
    color: "#e8b84b",
    fontWeight: "600",
    marginBottom: 6,
  },

  snippet: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  mood: {
    color: "#aaa",
    fontSize: 12,
  },

  actions: {
    flexDirection: "row",
    gap: 12,
  },

  actionText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
});