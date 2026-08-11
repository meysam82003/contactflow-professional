const path = require('path');
const webpack = require('webpack');
module.exports = {
  target: 'web',
  entry: './telegram-web-entry.js',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'telegram-web.bundle.js' },
  resolve: {
    preferRelative: true,
    fallback: {
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser'),
      events: require.resolve('events/'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      util: require.resolve('util/'),
      assert: require.resolve('assert/'),
      constants: require.resolve('constants-browserify'),
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      vm: require.resolve('vm-browserify'),
      url: require.resolve('url/'),
      querystring: require.resolve('querystring-es3'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      zlib: require.resolve('browserify-zlib'),
      tty: require.resolve('tty-browserify'),
      fs: false, net: false, tls: false, child_process: false, worker_threads: false
    }
  },
  plugins: [
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process/browser' }),
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('production') })
  ],
  performance: { hints: false },
  optimization: { minimize: true }
};
