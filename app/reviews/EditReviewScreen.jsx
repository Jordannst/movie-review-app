import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const moods = [
  "Amazed",
  "Moved",
  "Thrilled",
  "Heartbroken",
  "Amused",
  "Bored",
  "Impressed",
  "Disappointed",
];

export default function EditReviewScreen({ review, onNavigate }) {
  const [rating, setRating] = useState(review?.rating || 9);
  const [mood, setMood] = useState(review?.mood || "Amazed");
  const [comment, setComment] = useState(
    review?.body || "Denis Villeneuve delivers a masterclass..."
  );
  const [spoiler, setSpoiler] = useState(review?.spoiler || false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* 🔙 Cancel */}
        <Pressable onPress={() => onNavigate?.("myReviews")}>
          <Text style={styles.cancel}>← Cancel</Text>
        </Pressable>

        {/* 📝 Title */}
        <Text style={styles.title}>Edit Review</Text>
        <Text style={styles.subtitle}>
          {review?.movie || "Dune: Part Two"}
        </Text>

        {/* ⭐ Rating */}
        <Text style={styles.label}>Rating: {rating}/10</Text>
        <View style={styles.starRow}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Pressable key={i} onPress={() => setRating(i + 1)}>
              <Text
                style={[
                  styles.star,
                  { color: i < rating ? "#e8b84b" : "#444" },
                ]}
              >
                ★
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 🎭 Mood */}
        <Text style={styles.label}>Mood</Text>
        <View style={styles.moodWrap}>
          {moods.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMood(m)}
              style={[
                styles.moodChip,
                mood === m && styles.moodActive,
              ]}
            >
              <Text
                style={[
                  styles.moodText,
                  mood === m && styles.moodTextActive,
                ]}
              >
                {m}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ✍️ Comment */}
        <Text style={styles.label}>Review</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          style={styles.input}
        />
        <Text style={styles.counter}>{comment.length} chars</Text>

        {/* ⚠️ Spoiler */}
        <Pressable
          onPress={() => setSpoiler(!spoiler)}
          style={styles.spoiler}
        >
          <Text style={styles.spoilerText}>
            {spoiler ? "☑ Contains Spoiler" : "☐ No Spoiler"}
          </Text>
        </Pressable>

        {/* 💾 Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => onNavigate?.("myReviews")}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={() => onNavigate?.("myReviews")}
            style={styles.saveBtn}
          >
            <Text style={styles.saveText}>Save Changes</Text>
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

  cancel: {
    color: "#aaa",
    marginBottom: 10,
  },

  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#888",
    marginBottom: 20,
  },

  label: {
    color: "#aaa",
    marginBottom: 8,
  },

  starRow: {
    flexDirection: "row",
    marginBottom: 20,
  },

  star: {
    fontSize: 22,
    marginRight: 4,
  },

  moodWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },

  moodChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 4,
    borderRadius: 20,
    backgroundColor: "#222",
  },

  moodActive: {
    backgroundColor: "#e8b84b",
  },

  moodText: {
    color: "#aaa",
    fontSize: 12,
  },

  moodTextActive: {
    color: "black",
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: "#333",
    color: "white",
    padding: 12,
    borderRadius: 10,
    minHeight: 120,
    textAlignVertical: "top",
  },

  counter: {
    color: "#666",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 20,
  },

  spoiler: {
    marginBottom: 20,
  },

  spoilerText: {
    color: "white",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelBtnText: {
    color: "#aaa",
  },

  saveBtn: {
    flex: 1,
    backgroundColor: "#e8b84b",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  saveText: {
    fontWeight: "bold",
    color: "black",
  },
});