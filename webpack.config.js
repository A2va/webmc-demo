var CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = (env, argv) => ({
  entry: './src/App.ts',
  devtool: 'source-map', // For production
  //devtool:'eval-source-map',// For dev
  output: {
    path: __dirname + '/docs',
    filename: 'js/webmc.js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public', to: '' }
      ]
    })
  ]
})
