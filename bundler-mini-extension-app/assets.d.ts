declare module '*.svg' {
  const content: import('react').FC<import('react-native-svg').SvgProps>
  export default content
}

declare module '*.png' {
  const content: import('react-native').ImageRequireSource
  export default content
}

declare module '*.jpg' {
  const content: import('react-native').ImageRequireSource
  export default content
}
