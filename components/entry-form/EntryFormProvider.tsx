import { createContext, use, useState, useCallback, type ReactNode } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

interface EntryFormState {
  title: string;
  setTitle: (title: string) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  selectedImage: string | null;
  setSelectedImage: (uri: string | null) => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
  canSubmit: boolean;
  pickImage: (source: "gallery" | "camera") => Promise<void>;
  reset: () => void;
}

const EntryFormContext = createContext<EntryFormState | null>(null);

export function useEntryForm(): EntryFormState {
  const ctx = use(EntryFormContext);
  if (!ctx) throw new Error("useEntryForm must be used within EntryFormProvider");
  return ctx;
}

async function launchPicker(source: "gallery" | "camera"): Promise<string | null> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Camera access is required to take photos.");
      return null;
    }
  }

  const result =
    source === "gallery"
      ? await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 1,
          allowsEditing: true,
        })
      : await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 1,
          allowsEditing: true,
        });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export function EntryFormProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const canSubmit = !!selectedCategoryId && title.trim().length > 0 && !isUploading;

  const pickImage = useCallback(async (source: "gallery" | "camera") => {
    const uri = await launchPicker(source);
    if (uri) setSelectedImage(uri);
  }, []);

  const reset = useCallback(() => {
    setTitle("");
    setSelectedCategoryId(null);
    setSelectedImage(null);
  }, []);

  return (
    <EntryFormContext value={{
      title,
      setTitle,
      selectedCategoryId,
      setSelectedCategoryId,
      selectedImage,
      setSelectedImage,
      isUploading,
      setIsUploading,
      canSubmit,
      pickImage,
      reset,
    }}>
      {children}
    </EntryFormContext>
  );
}
