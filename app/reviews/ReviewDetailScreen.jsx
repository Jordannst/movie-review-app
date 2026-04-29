import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReviewDetailScreen({ review, onNavigate }) {
  const r = review || {
    id: 1,
    movie: "Dune: Part Two",
    year: 2024,
    genre: "Sci-Fi",
    user: "Alex M.",
    rating: 9,
    mood: "Amazed",
    date: "March 15, 2024",
    spoiler: false,
    body: `Denis Villeneuve delivers a masterclass in epic filmmaking.\n\nThe world-building is incredible.\n\nA rare sequel that surpasses the original.`,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* 🔙 Back */}
        <Pressable onPress={() => onNavigate?.("movieReviews")}>
          <Text style={styles.backText}>← Back to reviews</Text>
        </Pressable>

        {/* 🎬 Movie Info */}
        <View style={styles.movieCard}>
          <Text style={styles.movieTitle}>{r.movie}</Text>
          <Text style={styles.movieMeta}>
            {r.year} · {r.genre}
          </Text>

          {r.spoiler && (
            <Text style={styles.spoiler}>⚠️ Contains Spoilers</Text>
          )}
        </View>

        {/* 👤 User Info */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{r.user[0]}</Text>
          </View>

          <View>
            <Text style={styles.username}>{r.user}</Text>
            <Text style={styles.date}>{r.date}</Text>
          </View>

          <View style={styles.ratingBox}>
            <Text style={styles.rating}>★ {r.rating}/10</Text>
            <Text style={styles.mood}>{r.mood}</Text>
          </View>
        </View>

        {/* 📝 Review Body */}
        <View style={styles.reviewBox}>
          {r.body.split("\n\n").map((para, i) => (
            <Text key={i} style={styles.paragraph}>
              {para}
            </Text>
          ))}
        </View>

        {/* ⚡ Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>👍 Helpful</Text>
          </Pressable>

          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>💬 Comment</Text>
          </Pressable>

          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>⋯</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    padding: 20,
  },

  backText: {
    color: "#aaa",
    marginBottom: 20,
  },

  movieCard: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },

  movieTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  movieMeta: {
    color: "#888",
    marginTop: 4,
  },

  spoiler: {
    color: "#f87171",
    marginTop: 6,
    fontSize: 12,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e8b84b",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontWeight: "bold",
    fontSize: 16,
  },

  username: {
    color: "white",
    fontWeight: "bold",
  },

  date: {
    color: "#888",
    fontSize: 12,
  },

  ratingBox: {
    marginLeft: "auto",
    alignItems: "flex-end",
  },

  rating: {
    color: "#e8b84b",
    fontWeight: "bold",
  },

  mood: {
    color: "#aaa",
    fontSize: 12,
  },

  reviewBox: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 12,
  },

  paragraph: {
    color: "#ccc",
    marginTop: 10,
    lineHeight: 20,
  },

  actions: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },

  btn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  btnText: {
    color: "#aaa",
    fontSize: 13,
  },
});