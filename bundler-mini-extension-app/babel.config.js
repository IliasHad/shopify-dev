module.exports = {
  // Changes to babel config are not supported by the mini platform.
  // Custom configuration can introduce unexpected behaviour in your mini and could be a cause of rejection during the submission process.
  presets: ['@shopify/shop-minis-runtime/babel-preset'],
}
