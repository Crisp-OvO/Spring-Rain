import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const HistoryScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>历史记录页面</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});

export default HistoryScreen; 