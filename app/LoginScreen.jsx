import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // sementara dummy login
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    alert("Login success!");
    onNavigate?.("home"); // arahkan ke home / profile
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>🎬 CineLog</Text>
      <Text style={styles.subtitle}>Your personal movie universe</Text>

      {/* Email / Username */}
      <Text style={styles.label}>Email or Username</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#777"
        style={styles.input}
      />

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#777"
          secureTextEntry={!showPassword}
          style={styles.passwordInput}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.showBtn}>
            {showPassword ? "HIDE" : "SHOW"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* Register Link */}
      <Text style={styles.footer}>
        Don’t have an account?{" "}
        <Text
          style={styles.link}
          onPress={() => onNavigate?.("register")}
        >
          Register
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    color: "#e8b84b",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 30,
  },
  label: {
    color: "#ccc",
    fontSize: 12,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#1a1a1f",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1f",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  passwordInput: {
    flex: 1,
    color: "#fff",
    paddingVertical: 12,
  },
  showBtn: {
    color: "#e8b84b",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#e8b84b",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#000",
  },
  footer: {
    textAlign: "center",
    color: "#777",
    marginTop: 20,
  },
  link: {
    color: "#e8b84b",
    fontWeight: "bold",
  },
});