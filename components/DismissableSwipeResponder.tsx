import React, { useState } from "react";
import { Modal, View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useWelcomeDismissed } from "../hooks/useAppStateData";
import { Button } from "../components/Button";
import {
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
  PanGestureHandlerEventPayload,
  GestureEvent,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, { withTiming, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { checkLocalNetworkAccess } from "react-native-local-network-permission";
import { MainNavigationProps } from "../types";
import { theme } from "../theme";

export function DismissableSwipeResponder({ children }: { children: React.ReactNode }) {
  const { welcomeDismissedState, error, loading, getWelcomeDismissedState, setWelcomeDismissedEffect } =
    useWelcomeDismissed();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalText, setModalText] = useState<string>("Error checking local network access");
  const navigation = useNavigation<MainNavigationProps>();
  const initialPosition = useSharedValue(0);
  const position = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: position.value }],
  }));

  const onGesture = ({ nativeEvent }: GestureEvent<PanGestureHandlerEventPayload>) => {
    if (nativeEvent.state === State.ACTIVE) {
      position.value = withTiming(nativeEvent.y - initialPosition.value, { duration: 50 });
    }
  };

  const onGestureStateChange = async ({ nativeEvent }: PanGestureHandlerStateChangeEvent) => {
    const { state, translationY, y } = nativeEvent;

    if (state === State.BEGAN) {
      initialPosition.value = y;
    }

    if (state === State.END) {
      if (translationY < -200) {
        try {
          // will also request the user if popup never showed up
          const res = await checkLocalNetworkAccess();
          console.log({ res });
          if (res) {
            navigation.navigate("MacAddress");
          } else {
            setModalText(
              "The Connecting MHA App requires local network access to communicate with Home Energy Management System, you can provide permission by going to Privacy and Security your device settings, or remove and reinstall the Connecting MHA App"
            );
            setIsModalVisible(true);
          }
        } catch (error) {
          console.log({ error });
          setIsModalVisible(true);
        }
        await setWelcomeDismissedEffect();
        position.value = 0;
      } else {
        position.value = withTiming(0, { duration: 100 });
      }
    }
  };

  function toggleModal() {
    setIsModalVisible(!isModalVisible);
  }

  function ErrorModal() {
    return (
      <Modal transparent={true} visible={isModalVisible}>
        <View style={styles.errorModal}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{modalText}</Text>
            <Button style={styles.errorButton} label="Try Again" onPress={toggleModal} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={onGesture} onHandlerStateChange={onGestureStateChange}>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>{children}</Animated.View>
          <ErrorModal />
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errorModal: {
    flex: 1,
    backgroundColor: "#000000aa",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    padding: 50,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  errorMessage: {
    fontSize: 18,
  },
  errorButton: {
    marginTop: 20,
    width: 180,
    borderRadius: 50,
  },
});
