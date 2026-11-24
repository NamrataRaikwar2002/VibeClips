import React, { useEffect, useState } from 'react';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
  CommonResolutions
} from 'react-native-vision-camera';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';

export const CameraScreen = ({ navigation }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [imageUri, setImageUri] = useState('');
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.UHD_16_9
  })

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return <View />;
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text>No back camera found</Text>
      </View>
    );
  }

  const capturePhoto = async () => {
    console.log(photoOutput, 'hererer')
    const { filePath } = await photoOutput.capturePhotoToFile({}, {})
    console.log(filePath, 'haidfadf')
    const newFilePath = `file://${filePath}`;
    setImageUri(newFilePath)
  }

  const retakePhoto = () => {
    setImageUri('');
  }

  const confirmPhoto = () => {
    navigation.navigate('Canvas', { imageUri });
  }


  return (
    <View style={styles.container}>
       {imageUri ? (
       <View style={styles.previewContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.capturedImage} />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} onPress={retakePhoto}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={confirmPhoto}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
       </View>
        ) : (
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            isActive={true}
            device={device}
            mirrorMode='auto'
            outputs={[photoOutput]}
          />

          <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      )}
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
  },

  cameraContainer: {
    flex: 1,
  },

  camera: {
    width: '100%',
    height: '100%',
  },

  captureButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 4,
    borderColor: '#090707',
    justifyContent: 'center',
    alignItems: 'center',
  },

  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },

  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  capturedImage: {
    width: '90%',
    height: '60%',
    resizeMode: 'contain',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginTop: 20,
    paddingHorizontal: 40,
  },

  actionButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  message: {
    color: '#fff',
    fontSize: 16,
  },
});
