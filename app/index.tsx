import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";

const STORAGE_KEY = "@intern_profile";

const emptyProfile = {
  name: "",
  skills: "",
  projects: "",
  imageUri: "",
};

export default function App() {
  const [profile, setProfile] = useState(emptyProfile);
  const [savedProfile, setSavedProfile] = useState(null);
  const [screen, setScreen] = useState("profile");
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    loadProfile();
  }, []);

  const updateField = (key, value) => {
    setProfile({
      ...profile,
      [key]: value,
    });
  };

  const loadProfile = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);

      if (data) {
        const parsedData = JSON.parse(data);
        setProfile(parsedData);
        setSavedProfile(parsedData);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to load profile data.");
    }
  };

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      Alert.alert("Validation Error", "Please enter your name.");
      return;
    }

    if (!profile.skills.trim()) {
      Alert.alert("Validation Error", "Please enter your skills.");
      return;
    }

    if (!profile.projects.trim()) {
      Alert.alert("Validation Error", "Please enter your projects.");
      return;
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSavedProfile(profile);
      Alert.alert("Success", "Profile saved successfully.");
    } catch (error) {
      Alert.alert("Error", "Unable to save profile.");
    }
  };

  const clearProfile = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setProfile(emptyProfile);
      setSavedProfile(null);
      Alert.alert("Deleted", "Profile data has been removed.");
    } catch (error) {
      Alert.alert("Error", "Unable to delete profile.");
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow gallery access to upload your profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateField("imageUri", result.assets[0].uri);
    }
  };

  const getQRValue = () => {
    return JSON.stringify({
      name: savedProfile?.name || "",
      skills: savedProfile?.skills || "",
      projects: savedProfile?.projects || "",
    });
  };

  const handleQRCodeScanned = ({ data }) => {
    setScanned(true);

    try {
      const scannedProfile = JSON.parse(data);

      setProfile({
        name: scannedProfile.name || "",
        skills: scannedProfile.skills || "",
        projects: scannedProfile.projects || "",
        imageUri: "",
      });

      Alert.alert(
        "Profile Scanned",
        "Scanned profile data has been added to the form.",
        [
          {
            text: "OK",
            onPress: () => setScreen("profile"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Invalid QR Code", "This QR code does not contain profile data.");
    }
  };

  const renderProfileScreen = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Intern Profile Manager</Text>
        <Text style={styles.subtitle}>
          Create, edit, save, and share your professional profile.
        </Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {profile.imageUri ? (
            <Image source={{ uri: profile.imageUri }} style={styles.profileImage} />
          ) : (
            <Text style={styles.imageText}>Upload Profile Picture</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={profile.name}
          onChangeText={(text) => updateField("name", text)}
        />

        <Text style={styles.label}>Skills</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Example: React Native, JavaScript, Firebase"
          value={profile.skills}
          onChangeText={(text) => updateField("skills", text)}
          multiline
        />

        <Text style={styles.label}>Projects</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Example: Portfolio App, E-commerce App"
          value={profile.projects}
          onChangeText={(text) => updateField("projects", text)}
          multiline
        />

        <TouchableOpacity style={styles.primaryButton} onPress={saveProfile}>
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={clearProfile}>
          <Text style={styles.secondaryButtonText}>Clear Profile</Text>
        </TouchableOpacity>
      </View>

      {savedProfile && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Saved Profile Preview</Text>

          {savedProfile.imageUri ? (
            <Image
              source={{ uri: savedProfile.imageUri }}
              style={styles.previewImage}
            />
          ) : null}

          <Text style={styles.previewName}>{savedProfile.name}</Text>
          <Text style={styles.previewText}>Skills: {savedProfile.skills}</Text>
          <Text style={styles.previewText}>Projects: {savedProfile.projects}</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setScreen("qr")}
          >
            <Text style={styles.buttonText}>Show QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => {
              setScanned(false);
              setScreen("scanner");
            }}
          >
            <Text style={styles.outlineButtonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderQRScreen = () => (
    <View style={styles.centerScreen}>
      <Text style={styles.title}>Share Profile</Text>
      <Text style={styles.subtitle}>
        Other interns can scan this QR code to view your profile details.
      </Text>

      <View style={styles.qrBox}>
        <QRCode value={getQRValue()} size={230} />
      </View>

      <Text style={styles.previewName}>{savedProfile?.name}</Text>
      <Text style={styles.previewText}>Skills: {savedProfile?.skills}</Text>
      <Text style={styles.previewText}>Projects: {savedProfile?.projects}</Text>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setScreen("profile")}
      >
        <Text style={styles.secondaryButtonText}>Back to Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScannerScreen = () => {
    if (!permission) {
      return (
        <View style={styles.centerScreen}>
          <Text>Loading camera permission...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.centerScreen}>
          <Text style={styles.subtitle}>
            Camera permission is required to scan QR codes.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setScreen("profile")}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleQRCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />

        <View style={styles.scannerOverlay}>
          <Text style={styles.scannerText}>Scan Intern Profile QR Code</Text>

          <TouchableOpacity
            style={styles.scannerButton}
            onPress={() => setScreen("profile")}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {screen === "profile" && renderProfileScreen()}
      {screen === "qr" && renderQRScreen()}
      {screen === "scanner" && renderScannerScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7fb",
    padding: 20,
  },

  header: {
    marginTop: 20,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#17202a",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "#5d6d7e",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  imageBox: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#eaf2f8",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#d6eaf8",
  },

  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },

  imageText: {
    color: "#2874a6",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 10,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#f8f9f9",
    borderWidth: 1,
    borderColor: "#d5dbdb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#17202a",
  },

  textArea: {
    height: 90,
    textAlignVertical: "top",
  },

  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 18,
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  secondaryButton: {
    backgroundColor: "#eaf2f8",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "bold",
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },

  outlineButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "bold",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#17202a",
    marginBottom: 14,
    textAlign: "center",
  },

  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: "center",
    marginBottom: 12,
  },

  previewName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#17202a",
    textAlign: "center",
    marginTop: 10,
  },

  previewText: {
    fontSize: 15,
    color: "#34495e",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },

  centerScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  qrBox: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 18,
    marginVertical: 25,
    elevation: 4,
  },

  scannerContainer: {
    flex: 1,
    margin: -20,
  },

  camera: {
    flex: 1,
  },

  scannerOverlay: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: "center",
  },

  scannerText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },

  scannerButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
});