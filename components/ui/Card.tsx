import { View, Pressable, type ViewProps } from "react-native";

type Props = ViewProps & {
  pressable?: boolean;
  onPress?: () => void;
};

export function Card({
  pressable,
  onPress,
  children,
  className = "",
  ...rest
}: Props) {
  const classes = `bg-surface rounded-2xl overflow-hidden ${className}`;

  if (pressable && onPress) {
    return (
      <Pressable
        className={classes}
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={classes} {...rest}>
      {children}
    </View>
  );
}
