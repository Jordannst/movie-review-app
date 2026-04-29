import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ToggleRow = ({ label, sub, defaultOn }) => {
  const [on, setOn] = useState(defaultOn);

  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.label}>{label}</Text>
        {sub && <Text style={styles.sub}>{sub}</Text>}
      </View>

      <TouchableOpacity
        onPress={() => setOn(!on)}
        style={[styles.toggle, on && styles.toggleActive]}
      >
        <View style={[styles.knob, on && styles.knobActive]} />
      </TouchableOpacity>
    </View>
  );
};

const LinkRow = ({ label, sub, value }) => (
  <TouchableOpacity style={styles.row}>
    <View>
      <Text style={styles.label}>{label}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>

    <View style={styles.right}>
      {value && <Text style={styles.value}>{value}</Text>}
      <Text style={styles.arrow}>›</Text>
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      
      <Text style={styles.title}>Settings</Text>

      {/* Appearance */}
      <View style={styles.card}>
        <Text style={styles.section}>Appearance</Text>
        <ToggleRow label="Dark Mode" sub="Use dark theme" defaultOn />
        <ToggleRow label="Compact Cards" sub="Show more items" defaultOn={false} />
        <LinkRow label="Language" value="English" />
      </View>

      {/* Notifications */}
      <View style={styles.card}>
        <Text style={styles.section}>Notifications</Text>
        <ToggleRow label="Review Likes" defaultOn />
        <ToggleRow label="New Comments" defaultOn />
        <ToggleRow label="Community Digest" defaultOn={false} />
        <ToggleRow label="New Releases" defaultOn />
      </View>

      {/* Account */}
      <View style={styles.card}>
        <Text style={styles.section}>Account</Text>
        <LinkRow label="Edit Profile" />
        <LinkRow label="Change Password" />
        <LinkRow label="Linked Accounts" value="2 connected" />
        <LinkRow label="Privacy Settings" />
      </View>

      {/* About */}
      <View style={styles.card}>
        <Text style={styles.section}>About</Text>
        <LinkRow label="Help Center" />
        <LinkRow label="Terms of Service" />
        <LinkRow label="Privacy Policy" />
        <LinkRow label="App Version" value="1.0.0" />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

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
    marginBottom: 20,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  section: {
    color: "#e8b84b",
    fontSize: 11,
    marginBottom: 8,
    textTransform: "uppercase",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },

  label: {
    color: "white",
    fontSize: 14,
  },

  sub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  value: {
    color: "rgba(255,255,255,0.4)",
  },

  arrow: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 18,
  },

  toggle: {
    width: 44,
    height: 24,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
  },

  toggleActive: {
    backgroundColor: "#e8b84b",
  },

  knob: {
    width: 18,
    height: 18,
    backgroundColor: "white",
    borderRadius: 10,
    marginLeft: 3,
  },

  knobActive: {
    marginLeft: 22,
  },

  logout: {
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.4)",
    backgroundColor: "rgba(255,0,0,0.1)",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  logoutText: {
    color: "#f87171",
    fontWeight: "bold",
  },
});