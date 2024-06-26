import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme, typography } from "../../theme";
import { range } from "../../utils/visualization";
import { getLocalTemperature } from "../../utils/getLocalTemperature";
import { ThermostatGaugeButton } from "./ThermostatGaugeButton";
import ThermostatSetpoint from "../../assets/svg/thermostat-setpoint.svg";
import ThermostatDial from "../../assets/svg/thermostat-dial.svg";
import ThermostatUpIcon from "../../assets/svg/thermostat-up.svg";
import ThermostatDownIcon from "../../assets/svg/thermostat-down.svg";
import {
  GestureEvent,
  PanGestureHandler,
  PanGestureHandlerEventPayload,
  PanGestureHandlerStateChangeEvent,
  State,
} from "react-native-gesture-handler";
import { DemandResponseStatus, ThermostatMode } from "../../types";
import { isActiveDemandResponseStatus } from "../../utils/hems";
import { toNumber } from "lodash";

type ThermostatOnDragParams = {
  direction: "up" | "down";
  end: boolean;
};

type ThermostatGaugeProps = {
  label?: string;
  setPoint: number;
  mode?: ThermostatMode;
  drStatus: DemandResponseStatus;
  interiorTemp: number;
  onPressWarm(): void;
  onPressCool(): void;
  onDrag(params: ThermostatOnDragParams): void;
  pendingActivity: boolean;
  disabled: boolean;
};

export const ThermostatGauge = ({
  disabled,
  mode,
  label,
  drStatus,
  setPoint,
  interiorTemp,
  onPressWarm,
  onPressCool,
  onDrag,
  pendingActivity,
}: ThermostatGaugeProps) => {
  const [isDraggingSetpoint, setIsDraggingSetpoint] = useState(false);
  const [dragY, setDragY] = useState(0);
  const maxTemp = 38;
  const minTemp = 8;

  const dialCenter = { left: 156, top: 157 };
  const dialRadius = 112;

  const scaledSetpoint = range(minTemp, maxTemp, -0.22 * Math.PI, 1.22 * Math.PI, setPoint);

  const setpointDotStyle = {
    left: dialCenter.left - dialRadius * Math.cos(scaledSetpoint),
    top: dialCenter.top - dialRadius * Math.sin(scaledSetpoint),
  };

  const onGesture = ({ nativeEvent }: GestureEvent<PanGestureHandlerEventPayload>) => {
    if (!isDraggingSetpoint || disabled) {
      return;
    }

    const dragDirection = dragY > nativeEvent.y ? "up" : "down";

    if (dragDirection === "up" && setPoint >= maxTemp) {
      return;
    }

    if (dragDirection === "down" && setPoint <= minTemp) {
      return;
    }

    onDrag({
      direction: dragDirection,
      end: false,
    });

    setDragY(nativeEvent.y);
  };

  const onGestureStateChange = ({ nativeEvent }: PanGestureHandlerStateChangeEvent) => {
    const { state } = nativeEvent;

    switch (state) {
      case State.BEGAN:
        setIsDraggingSetpoint(true);
        setDragY(nativeEvent.y);
        break;

      case State.FAILED:
        setIsDraggingSetpoint(false);
        break;

      case State.END:
        setIsDraggingSetpoint(false);
        break;
    }
  };
  const calculateOffset = (setPoint: number, type: string, drStatus: DemandResponseStatus, mode?: string) => {
    let calculatedOffset = 0;
    let offset = 2;
    if (drStatus === "curtailed" || drStatus === "heightened" || mode === "eco") {
      offset += 1;
    }

    if (type === "heat") {
      calculatedOffset = toNumber(getLocalTemperature(setPoint)) - offset;
    } else if (type === "cool") {
      calculatedOffset = toNumber(getLocalTemperature(setPoint)) + offset;
    }
    return calculatedOffset;
  };

  return (
    // <PanGestureHandler onGestureEvent={onGesture} onHandlerStateChange={onGestureStateChange}>
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {label && (
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            {label}
          </Text>
        )}
        <View style={styles.tempContainer}>
          <Text
            allowFontScaling={false}
            style={[styles.indoorTemp, pendingActivity && styles.activeSetpoint, disabled && styles.disabled]}
          >
            {getLocalTemperature(interiorTemp)}
          </Text>
          <Text style={styles.degree} allowFontScaling={false}>
            &deg;
          </Text>
        </View>
        {mode === "auto" || mode === "eco" ? (
          <View style={{ flexDirection: "row", display: "flex" }}>
            <View style={styles.setpointContainer}>
              <Text style={[styles.setpointLabel, disabled && styles.disabled]} allowFontScaling={false}>
                Cool
              </Text>
              <View style={styles.tempContainer}>
                <Text style={[styles.setpoint, disabled && styles.disabled]} allowFontScaling={false}>
                  {calculateOffset(setPoint, "cool", drStatus, mode)}
                </Text>
                <Text style={styles.setpointdegree} allowFontScaling={false}>
                  &deg;
                </Text>
              </View>
            </View>
            <View style={styles.setpointContainer}>
              <Text style={[styles.setpointLabel, disabled && styles.disabled]} allowFontScaling={false}>
                Heat
              </Text>
              <View style={styles.tempContainer}>
                <Text style={[styles.setpoint, disabled && styles.disabled]} allowFontScaling={false}>
                  {calculateOffset(setPoint, "heat", drStatus, mode)}
                </Text>
                <Text style={styles.setpointdegree} allowFontScaling={false}>
                  &deg;
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            <Text style={[styles.setpointLabel, disabled && styles.disabled]} allowFontScaling={false}>
              {mode}
            </Text>
            <Text style={[styles.setpoint, disabled && styles.disabled]} allowFontScaling={false}>
              {getLocalTemperature(setPoint)}&deg;
            </Text>
          </>
        )}
        <View style={styles.controls}>
          <ThermostatGaugeButton
            label="Cool"
            icon={<ThermostatDownIcon />}
            disabled={disabled || setPoint <= minTemp}
            onPress={onPressCool}
          />

          <ThermostatGaugeButton
            label="Warm"
            icon={<ThermostatUpIcon />}
            disabled={disabled || setPoint >= maxTemp}
            onPress={onPressWarm}
          />
        </View>
      </View>
      <View style={styles.dialContainer}>
        <ThermostatDial />
        <View style={[{ position: "absolute" }, setpointDotStyle, pendingActivity && styles.activeSetpointDot]}>
          <ThermostatSetpoint />
        </View>
      </View>
    </View>
    // </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    margin: "auto",
  },
  wrapper: {
    position: "absolute",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 118,
  },
  label: {
    ...typography.headline3,
    marginTop: 50,
    flex: 1,
    color: theme.text,
  },
  tempContainer: {
    flex: 1,
    justifyContent: "center",
    flexDirection: "row",
  },
  indoorTemp: {
    ...typography.headline1Bold,
    color: theme.primary,
    includeFontPadding: false,
    paddingLeft: 14,
  },
  degree: {
    marginTop: 10,
    fontSize: 38,
    marginLeft: -2,
    color: theme.primary,
    includeFontPadding: false,
  },
  setpointdegree: {
    marginTop: 1,
    fontSize: 17,
    marginLeft: -1,
    color: theme.primary,
    includeFontPadding: false,
  },
  setpointContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activeSetpoint: {
    shadowOpacity: 2,
    shadowColor: "#000000",
    shadowRadius: 0.4,
    shadowOffset: { height: 0, width: 0 },
  },
  activeSetpointDot: {
    shadowOpacity: 2,
    shadowColor: "#000000",
    shadowRadius: 0.6,
    shadowOffset: { height: 0, width: 0 },
  },
  disabled: {
    color: theme.disabledText,
  },
  setpointLabel: {
    ...typography.headline1,
    fontSize: 12,
    textTransform: "capitalize",
    color: theme.text,
    includeFontPadding: false,
    letterSpacing: 0.08,
  },
  setpoint: {
    ...typography.headline1Bold,
    fontSize: 27,
    alignSelf: "center",
    justifyContent: "center",
    letterSpacing: 0.08,
    color: theme.primary,
    includeFontPadding: false,
    paddingLeft: 8,
  },
  controls: {
    flex: 1,
    marginTop: 5,
    marginLeft: 2.5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gauge: {
    flex: 1,
  },

  spacer: {
    width: 12,
  },
  dialContainer: {
    zIndex: -1,
  },
});
