import React from 'react';
import { Box, Heading } from '@chakra-ui/react';

const Header = () => {
  return (
    <Box as="header" bg="teal.500" py={4} boxShadow="md">
      <Heading as="h1" size="xl" textAlign="center" color="white">
        Meat and Eat
      </Heading>
    </Box>
  );
};

export default Header;
