import {StatusBar} from 'react-native'
import {
  Box,
  Text,
  SafeAreaView,
  useMinisParams,
} from '@shopify/shop-minis-platform-sdk'

export function App() {
  const {extensionData} = useMinisParams()
  return (
    <Box flex={1} backgroundColor="backgrounds-regular">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{flex: 1, justifyContent: 'center'}}>
        <Text textAlign="center">Fill in the blank</Text>
        {extensionData ? (
          <Text textAlign="center">
            Data from the extension: {JSON.stringify(extensionData)}
          </Text>
        ) : null}
      </SafeAreaView>
    </Box>
  )
}
