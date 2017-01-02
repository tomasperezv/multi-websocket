const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
  context: __dirname,
  entry: {
    'multi-websocket.js': [
      '../src/multi-websocket'
    ],
    'example.js': [
      './custom-client.js'
    ]
  },
  output: {
    path: path.join(__dirname, '/dist'),
    filename: '[name]',
    libraryTarget: 'var',
    library: 'MultiWebsocket'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './example.html',
      filename: 'index.html',
      inject: 'head'
    })
  ]
};

module.exports = config;
