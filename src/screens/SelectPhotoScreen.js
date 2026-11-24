// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
// import {launchImageLibrary} from 'react-native-image-picker';

// export function SelectPhotoScreen({ navigation }) {
//   const [selectedPhoto, setSelectedPhoto] = useState(null);

//   const handleSelectPhoto = async() => {
    
//     console.log('Select photo');
//     const result = await launchImageLibrary({
//       mediaType: 'photo',
//       selectionLimit: 5,
//       quality: 1,
//     });
//     console.log(result,'saldjifoaisd')
//   };

 

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Select Photo</Text>
      
//       <TouchableOpacity 
//         style={styles.selectButton} 
//         onPress={handleSelectPhoto}
//       >
//         <Text style={styles.buttonText}>Choose Photo</Text>
//       </TouchableOpacity>

//       {selectedPhoto && (
//         <View style={styles.previewContainer}>
//           <Image 
//             source={{ uri: selectedPhoto }} 
//             style={styles.preview}
//           />
//         </View>
//       )}

     
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   selectButton: {
//     backgroundColor: '#007AFF',
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   uploadButton: {
//     backgroundColor: '#34C759',
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   disabledButton: {
//     backgroundColor: '#ccc',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   previewContainer: {
//     alignItems: 'center',
//     marginVertical: 20,
//   },
//   preview: {
//     width: 200,
//     height: 200,
//     borderRadius: 8,
//   },
// });
