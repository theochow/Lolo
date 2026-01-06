import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface AnimatedCircleProps {
  top?: string | number;
  left?: string | number;
  size?: number;
  delay?: number;
}

export default function AnimatedCircle({ 
  top = '28%', 
  left = '50%', 
  size = 300,
  delay = 0 
}: AnimatedCircleProps) {
  const gradientAnimation = useRef(new Animated.Value(0)).current;
  const [gradientColors, setGradientColors] = useState<[string, string]>([
    'rgba(200, 180, 255, 0.6)',
    'rgba(255, 200, 180, 0.5)',
  ]);

  useEffect(() => {
    const gradientColorAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );

    // Start animation after delay
    const timeout = setTimeout(() => {
      gradientColorAnimation.start();
    }, delay);

    // Update colors based on animation value
    const listenerId = gradientAnimation.addListener(({ value }) => {
      if (value <= 0.5) {
        const progress = value * 2;
        const color1 = `rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, 0.6)`;
        const color2 = `rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, 0.5)`;
        setGradientColors([color1, color2]);
      } else {
        const progress = (value - 0.5) * 2;
        const color1 = `rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, 0.6)`;
        const color2 = `rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, 0.5)`;
        setGradientColors([color1, color2]);
      }
    });

    return () => {
      clearTimeout(timeout);
      gradientAnimation.removeListener(listenerId);
      gradientColorAnimation.stop();
    };
  }, [delay]);

  const borderRadius = size / 2;
  const marginLeft = -(size / 2);

  return (
    <View 
      style={[
        styles.gradientCircle,
        {
          width: size,
          height: size,
          borderRadius,
          top: typeof top === 'number' ? top : top,
          left: typeof left === 'string' && left.includes('%') ? left : typeof left === 'number' ? left : '50%',
          marginLeft: typeof left === 'string' && left.includes('%') ? marginLeft : typeof left === 'number' ? marginLeft : marginLeft,
        }
      ]}
    >
      <BlurView intensity={150} tint="light" style={StyleSheet.absoluteFill}>
        <View style={[styles.gradientInner, { borderRadius }]}>
          <LinearGradient
            colors={gradientColors}
            style={{ width: '100%', height: '100%', borderRadius }}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientCircle: {
    position: 'absolute',
    overflow: 'visible',
    zIndex: 0,
  },
  gradientInner: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
});

