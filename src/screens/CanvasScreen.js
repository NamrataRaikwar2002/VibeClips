import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, PanResponder, ScrollView, Image } from 'react-native';
import { Canvas, Image as SkiaImage, useImage, Path, Skia } from '@shopify/react-native-skia';
import { STICKERS } from '../constants/stickers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STICKER_SIZE = 100;

// Sticker component that uses useImage internally
const StickerRender = React.memo(({ sticker, sourceId }) => {
  const img = useImage(sticker.image);
  if (!img) return null;
  return (
    <SkiaImage
      image={img}
      x={sticker.x}
      y={sticker.y}
      width={sticker.width}
      height={sticker.height}
      fit="contain"
    />
  );
});

export const CanvasScreen = ({ route }) => {
  const { imageUri } = route.params;
  const bgImage = useImage(imageUri);

  // Canvas state
  const [canvasSize, setCanvasSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_WIDTH });
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);

  // Sticker state
  const [stickers, setStickers] = useState([]);
  const [stickerPanelVisible, setStickerPanelVisible] = useState(false);
  const [activeStickerId, setActiveStickerId] = useState(null);

  // Refs for drawing
  const currentBuilderRef = useRef(null);
  const pathsRef = useRef([]);

  // Check if touch is on any sticker
  const getStickerAtPoint = useCallback((x, y, stickersList) => {
    // Check in reverse order (top-most first)
    for (let i = stickersList.length - 1; i >= 0; i--) {
      const s = stickersList[i];
      if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
        return s;
      }
    }
    return null;
  }, []);

  // SINGLE combined PanResponder
  const panResponder = useMemo(() => PanResponder.create({
    // Determine what we're interacting with on touch start
    onStartShouldSetPanResponder: (e) => {
      const { locationX, locationY } = e.nativeEvent;

      // If a sticker is already being dragged, claim responder
      if (activeStickerId) {
        const sticker = stickers.find(s => s.id === activeStickerId);
        if (sticker && locationX >= sticker.x && locationX <= sticker.x + sticker.width &&
            locationY >= sticker.y && locationY <= sticker.y + sticker.height) {
          return true;
        }
      }

      // Check if touch is on any sticker (to start dragging)
      const stickerAtPoint = getStickerAtPoint(locationX, locationY, stickers);
      if (stickerAtPoint) {
        return true;
      }

      // Otherwise, allow drawing
      return true;
    },

    onMoveShouldSetPanResponder: (e) => {
      const { locationX, locationY } = e.nativeEvent;

      if (activeStickerId) {
        const sticker = stickers.find(s => s.id === activeStickerId);
        if (sticker && locationX >= sticker.x && locationX <= sticker.x + sticker.width &&
            locationY >= sticker.y && locationY <= sticker.y + sticker.height) {
          return true;
        }
      }

      const stickerAtPoint = getStickerAtPoint(locationX, locationY, stickers);
      if (stickerAtPoint) return true;

      return true;
    },

    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;

      // Check if we're on a sticker
      const stickerAtPoint = getStickerAtPoint(locationX, locationY, stickers);

      if (stickerAtPoint) {
        // Start dragging sticker
        setActiveStickerId(stickerAtPoint.id);
        currentBuilderRef.current = null; // Ensure drawing is cancelled
      } else {
        // Start drawing
        setActiveStickerId(null);
        const builder = Skia.PathBuilder.Make();
        builder.moveTo(locationX, locationY);
        currentBuilderRef.current = builder;
        setCurrentPath(builder.build());
      }
    },

    onPanResponderMove: (e) => {
      const { locationX, locationY } = e.nativeEvent;

      if (activeStickerId) {
        // Dragging sticker
        setStickers(prev => prev.map(s =>
          s.id === activeStickerId ? { ...s, x: locationX - s.width / 2, y: locationY - s.height / 2 } : s
        ));
      } else if (currentBuilderRef.current) {
        // Drawing
        currentBuilderRef.current.lineTo(locationX, locationY);
        setCurrentPath(currentBuilderRef.current.build());
      }
    },

    onPanResponderRelease: () => {
      if (activeStickerId) {
        setActiveStickerId(null);
      } else if (currentBuilderRef.current) {
        // Finish drawing
        pathsRef.current = [...pathsRef.current, currentBuilderRef.current.detach()];
        setPaths([...pathsRef.current]);
        currentBuilderRef.current = null;
        setCurrentPath(null);
      }
    },

    onPanResponderTerminate: () => {
      if (activeStickerId) {
        setActiveStickerId(null);
      } else if (currentBuilderRef.current) {
        currentBuilderRef.current = null;
        setCurrentPath(null);
      }
    },
  }), [stickers, activeStickerId, getStickerAtPoint]);

  // Image layout (centered, aspect-fit)
  const imageLayout = useMemo(() => {
    if (!bgImage) return { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height };
    const imgAspect = bgImage.width() / bgImage.height();
    const canvasAspect = canvasSize.width / canvasSize.height;
    if (imgAspect > canvasAspect) {
      const h = canvasSize.width / imgAspect;
      return { x: 0, y: (canvasSize.height - h) / 2, width: canvasSize.width, height: h };
    }
    const w = canvasSize.height * imgAspect;
    return { x: (canvasSize.width - w) / 2, y: 0, width: w, height: canvasSize.height };
  }, [bgImage, canvasSize]);

  // Add sticker from panel to canvas center
  const handleStickerSelect = useCallback((sticker) => {
    const newSticker = {
      id: `${sticker.id}-${Date.now()}`,
      sourceId: sticker.id,
      name: sticker.name,
      image: sticker.image,
      x: canvasSize.width / 2 - STICKER_SIZE / 2,
      y: canvasSize.height / 2 - STICKER_SIZE / 2,
      width: STICKER_SIZE,
      height: STICKER_SIZE,
    };
    setStickers(prev => [...prev, newSticker]);
    setStickerPanelVisible(false);
  }, [canvasSize]);

  // Clear all
  const handleClear = useCallback(() => {
    pathsRef.current = [];
    setPaths([]);
    setStickers([]);
    setActiveStickerId(null);
    currentBuilderRef.current = null;
    setCurrentPath(null);
  }, []);

  return (
    <View style={styles.container}>
      {/* Canvas Wrapper with SINGLE pan responder */}
      <View
        style={styles.canvasWrapper}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) setCanvasSize({ width, height });
        }}
        {...panResponder.panHandlers}
      >
        <Canvas style={styles.canvas}>
          {/* Background Image */}
          {bgImage && (
            <SkiaImage
              image={bgImage}
              x={imageLayout.x}
              y={imageLayout.y}
              width={imageLayout.width}
              height={imageLayout.height}
              fit="contain"
            />
          )}

          {/* Drawing Paths */}
          {paths.map((path, i) => (
            <Path key={i} path={path} color="red" style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round" />
          ))}
          {currentPath && (
            <Path path={currentPath} color="red" style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round" />
          )}

          {/* Placed Stickers */}
          {stickers.map((sticker) => (
            <StickerRender key={sticker.id} sticker={sticker} sourceId={sticker.sourceId} />
          ))}
        </Canvas>
      </View>

      {/* Clear Button */}
      <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
        <Text style={styles.buttonText}>Clear All</Text>
      </TouchableOpacity>

      {/* Sticker Toggle Button */}
      <TouchableOpacity style={styles.stickerToggle} onPress={() => setStickerPanelVisible(!stickerPanelVisible)}>
        <Text style={styles.toggleText}>🎨 Stickers</Text>
      </TouchableOpacity>

      {/* Sticker Panel */}
      {stickerPanelVisible && (
        <View style={styles.stickerPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Select Sticker</Text>
            <TouchableOpacity onPress={() => setStickerPanelVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {STICKERS.map((sticker) => (
              <TouchableOpacity
                key={sticker.id}
                style={styles.stickerItem}
                onPress={() => handleStickerSelect(sticker)}
                activeOpacity={0.8}
              >
                <Image source={sticker.image} style={styles.stickerThumbnail} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  canvasWrapper: { flex: 1 },
  canvas: { flex: 1, width: '100%' },
  clearButton: {
    position: 'absolute', bottom: 120, left: 20,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.9)', borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.5)',
    zIndex: 10,
  },
  stickerToggle: {
    position: 'absolute', bottom: 120, right: 20,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    backgroundColor: 'rgba(52, 199, 89, 0.9)', borderWidth: 1, borderColor: 'rgba(52, 199, 89, 0.5)',
    zIndex: 10,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  toggleText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Sticker Panel
  stickerPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 140, backgroundColor: 'rgba(0,0,0,0.95)', borderTopWidth: 1, borderTopColor: '#333',
    zIndex: 100,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  panelTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeButton: { padding: 8 },
  closeText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 12, gap: 10 },
  stickerItem: {
    width: 80, height: 80, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  stickerThumbnail: { width: 60, height: 60, resizeMode: 'contain' },
});