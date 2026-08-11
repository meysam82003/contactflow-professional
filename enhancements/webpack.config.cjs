const path = require('path');
const webpack = require('webpack');
module.exports = {
  target: 'web',
  entry: './telegram-web-entry.js',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'telegram-web.bundle.js' },
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser'),
      events: require.resolve('events/'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      fs: false, net: false, tls: false, child_process: false
    }
  },
  plugins: [
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process/browser' }),
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('production') })
  ],
  performance: { hints: false },
  optimization: { minimize: true }
};
