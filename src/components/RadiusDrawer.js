import React from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerFooter,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Text,
  Button,
  Box,
  VStack,
  Badge,
  Flex,
  Tooltip
} from '@chakra-ui/react';

const RadiusDrawer = ({ isOpen, onClose, radius, setRadius, resetRadius }) => {
  const labelStyles = {
    mt: '2',
    ml: '-2.5',
    fontSize: 'sm',
  };

  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
      <DrawerOverlay backdropFilter="blur(2px)" />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" bg="teal.500" color="white">
          <Flex align="center" justify="space-between">
            <Box>Entfernungsfilter</Box>
            <Badge 
              colorScheme="whiteAlpha" 
              variant="solid" 
              fontSize="sm" 
              borderRadius="full" 
              px={2}
            >
              {radius < 500 ? `${radius} km` : "Alle anzeigen"}
            </Badge>
          </Flex>
        </DrawerHeader>
        
        <DrawerBody py={6}>
          <VStack spacing={8} align="stretch">
            <Box>
              <Text mb={4} fontWeight="medium">
                Zeige Orte in einem Umkreis von:
              </Text>
              <Box px={4} pt={6}>
                <Slider 
                  min={0} 
                  max={500} 
                  step={10} 
                  value={radius} 
                  onChange={(val) => setRadius(val)}
                  colorScheme="teal"
                >
                  <SliderMark value={0} {...labelStyles}>
                    0 km
                  </SliderMark>
                  <SliderMark value={250} {...labelStyles}>
                    250 km
                  </SliderMark>
                  <SliderMark value={500} {...labelStyles}>
                    Alle
                  </SliderMark>
                  <SliderMark
                    value={radius}
                    textAlign='center'
                    bg='teal.500'
                    color='white'
                    mt='-10'
                    ml='-6'
                    w='12'
                    borderRadius='md'
                    p={1}
                    fontSize='xs'
                  >
                    {radius} km
                  </SliderMark>
                  <SliderTrack h="2">
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb boxSize={6} boxShadow="lg" />
                </Slider>
              </Box>
            </Box>
            
            <Tooltip label="Zeigt alle verfügbaren Orte auf der Karte an" placement="top">
              <Button 
                colorScheme="teal" 
                onClick={resetRadius}
                w="full"
                size="lg"
                borderRadius="md"
                boxShadow="sm"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                transition="all 0.2s"
              >
                Filter zurücksetzen
              </Button>
            </Tooltip>
          </VStack>
        </DrawerBody>
        
        <DrawerFooter borderTopWidth="1px" bg="gray.50">
          <Text fontSize="xs" color="gray.500">
            Radius-Filter hilft dir, Orte in deiner Nähe zu finden.
          </Text>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default RadiusDrawer;
