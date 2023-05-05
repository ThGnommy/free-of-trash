import { StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { Button, Div, Image, ScrollDiv, Text } from "react-native-magnus";
import { auth, db, storage } from "../../firebaseInit";
import { useApp } from "../../context/AppContext";
import {
  Timestamp,
  arrayUnion,
  collection,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import VerifyModal from "./components/NewPlaceFormScreen/VerifyModal";
import { useRouter } from "expo-router";

const NewPlaceConfirmation = () => {
  const router = useRouter();

  const currentUser = auth.currentUser;

  const { newPlace, resetNewPlace } = useApp();

  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const uploadPlaceImages = async (id: string) => {
    newPlace.placeImages.forEach(async (image: string, idx: number) => {
      if (image !== "") {
        const blob: Blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function () {
            resolve(xhr.response);
          };
          xhr.onerror = function (e) {
            console.log(e);
            reject(new TypeError("Network request failed"));
          };
          xhr.responseType = "blob";
          xhr.open("GET", image, true);
          xhr.send(null);
        });

        const storageRef = ref(storage, `places/${id}/image-${idx}`);
        // 'file' comes from the Blob or File API
        await uploadBytes(storageRef, blob)
          .then(async () => {
            // console.log("Uploaded a blob or file!");
          })
          .then(async () => {
            // after update the image in storage, download it, update the url and the place data in firestore

            const url = await getDownloadURL(
              ref(storage, `places/${id}/image-${idx}`)
            );

            const imagesRef = doc(db, "places", id);

            await updateDoc(imagesRef, {
              placeImages: arrayUnion(url),
            });
          })
          .catch((error) => {
            if (error instanceof Error) {
              throw new Error(error.message);
            }
          });
      }
    });
  };

  const writeNewPlaceInDB = async () => {
    setLoading(true);

    const newPlaceRef = doc(collection(db, "places"));

    const place = {
      creatorUID: currentUser?.uid,
      creatorInfo: {
        name: currentUser?.displayName,
        photoURL: currentUser?.photoURL,
      },
      coordinate: newPlace.coordinate,
      previewMapImage: newPlace.previewMapImage,
      street: newPlace.street,
      city: newPlace.city,
      description: newPlace.description,
      placeImages: [],
      date: Timestamp.now(),
      id: newPlaceRef.id,
      userJoined: [],
    };

    try {
      await setDoc(newPlaceRef, place);

      await uploadPlaceImages(newPlaceRef.id);

      setLoading(false);
      setVerification(true);
      setModalVisible(true);

      setTimeout(() => {
        setModalVisible(false);
        resetNewPlace();
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  };

  return verification === false ? (
    <ScrollDiv flex={1} p={10}>
      <Text fontSize="2xl" fontWeight="bold">
        Selected images
      </Text>
      <Div alignItems="center" style={{ gap: 10 }} my={20}>
        {newPlace.placeImages.map(
          (image) =>
            image !== "" && (
              <Image
                key={image}
                alignSelf="center"
                h={200}
                w="100%"
                rounded="lg"
                source={{ uri: image }}
              />
            )
        )}
      </Div>
      <Text fontSize="2xl" fontWeight="bold">
        Selected location
      </Text>

      <Image
        mt={30}
        alignSelf="center"
        h={200}
        w="100%"
        rounded="lg"
        source={{ uri: newPlace.previewMapImage }}
      />
      <Div>
        {newPlace.description ? (
          <Div alignSelf="center" w="100%" mt={20}>
            <Text fontSize="2xl" fontWeight="bold">
              Description
            </Text>
            <Text>{newPlace.description}</Text>
          </Div>
        ) : (
          <Text fontSize="2xl">No description.</Text>
        )}
      </Div>
      <Button
        loading={loading}
        onPress={writeNewPlaceInDB}
        mb={30}
        alignSelf="center"
      >
        Confirm Place
      </Button>
    </ScrollDiv>
  ) : (
    <VerifyModal
      onDismiss={() => router.replace("/home")}
      visible={modalVisible}
    />
  );
};

export default NewPlaceConfirmation;

const styles = StyleSheet.create({});
