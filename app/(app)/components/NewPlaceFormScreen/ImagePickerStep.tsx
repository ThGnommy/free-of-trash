import {
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import React, { useRef, useState } from "react";
import * as ExpoImagePicker from "expo-image-picker";
import { Div, Icon, Image, Modal, Snackbar, Text } from "react-native-magnus";
import { useApp } from "../../../../context/AppContext";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Camera, CameraType } from "expo-camera";
import { useRouter } from "expo-router";
const ImagePickerStep = () => {
  const { setNewImages } = useApp();
  const router = useRouter();
  const [images, setImages] = useState<[string, string, string]>(["", "", ""]);

  const { showActionSheetWithOptions } = useActionSheet();

  const [permission, requestPermission] = Camera.useCameraPermissions();
  const snackbarRef = useRef<any>();

  const pickImage = async (idx: number) => {
    const options = ["Camera", "Gallery", "Cancel"];

    const destructiveButtonIndex = [0, 1];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        tintColor: "blue",
        destructiveButtonIndex,
        cancelButtonIndex,
      },
      async (index) => {
        switch (index) {
          case destructiveButtonIndex[0]:
            // Camera
            await requestPermission().then((permission) => {
              if (permission?.status === "granted") {
                // Pass the index of the image, so we now where to put the camera photo
                router.push({ pathname: "camera", params: { index: idx } });
              }
              if (!permission || !permission.granted) {
                snackbarRef.current.show(
                  "We need your permission to show the camera."
                );
              }
            });
            break;

          case destructiveButtonIndex[1]:
            // Gallery
            // No permissions request is necessary for launching the image library
            let result = await ExpoImagePicker.launchImageLibraryAsync({
              mediaTypes: ExpoImagePicker.MediaTypeOptions.All,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.5,
            });

            if (!result.canceled) {
              const newArr: [string, string, string] = [...images];
              const replaced = images[idx].replace(
                images[idx],
                result.assets[0].uri
              );
              newArr[idx] = replaced;
              setImages(newArr);
              setNewImages(newArr);
            }
            // Save
            break;

          case cancelButtonIndex:
          // Canceled
        }
      }
    );
  };

  const handleCamera = () => {};

  return (
    <>
      <Div style={styles.container}>
        <Text fontSize="4xl">Step 1</Text>
        <Text fontSize="2xl">Choose max of three photos</Text>
        <Div
          flex={1}
          justifyContent="center"
          flexDir="row"
          flexWrap="wrap"
          style={{ gap: 10 }}
        >
          {images.slice(0, 3).map((_, idx) => (
            <TouchableOpacity
              onPress={() => pickImage(idx)}
              activeOpacity={0.7}
              style={styles.placeholderImageContaner}
              key={idx}
            >
              {images[idx] ? (
                <Image
                  rounded="md"
                  style={styles.image}
                  source={{
                    uri: images[idx],
                  }}
                />
              ) : (
                <Icon name="plus" fontSize="4xl" />
              )}
            </TouchableOpacity>
          ))}
        </Div>
      </Div>
      <Snackbar
        style={{ position: "absolute" }}
        ref={snackbarRef}
        bg="red700"
        color="white"
      />
    </>
  );
};

export default ImagePickerStep;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    gap: 15,
    paddingBottom: 30,
  },
  placeholderImageContaner: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    width: 150,
    height: 100,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});