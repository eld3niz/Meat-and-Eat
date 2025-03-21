import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import Header from './components/Header';
import MapComponent from './components/MapComponent';

function App() {
  return (
    <ChakraProvider>
      <Header />
      <MapComponent />
    </ChakraProvider>
  );
}

export default App;
