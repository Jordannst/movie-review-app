import { useState } from "react";
import { Button, TextInput, View } from "react-native";

export default function EditProfileScreen({
  profile,
  onSave,
  onNavigate,
}) {
  // ✅ fallback biar gak error kalau profile undefined
  const safeProfile = profile ?? {
    account: {
      name: "",
      username: "",
      bio: "",
    },
  };

  const [name, setName] = useState(safeProfile.account.name);
  const [username, setUsername] = useState(safeProfile.account.username);
  const [bio, setBio] = useState(safeProfile.account.bio);

  const handleSave = () => {
    if (!profile) return; // ⛔ safety check

    const updatedProfile = {
      ...profile,
      account: {
        ...profile.account,
        name,
        username,
        bio,
        initials: name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
      },
    };

    onSave?.(updatedProfile);
    onNavigate?.("profile");
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name"
        style={{ marginBottom: 10, borderWidth: 1, padding: 10 }}
      />

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        style={{ marginBottom: 10, borderWidth: 1, padding: 10 }}
      />

      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="Bio"
        style={{ marginBottom: 10, borderWidth: 1, padding: 10 }}
      />

      <Button title="Save Profile" onPress={handleSave} />
    </View>
  );
}