const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const WorkboxPlugin = require('workbox-webpack-plugin');

const outputDirectory = 'dist';

module.exports = {
  entry: {
    bundle: ['babel-polyfill', './src/client/index.js'],
    worker: "./src/client/worker.js"
  },
  output: {
    path: path.join(__dirname, outputDirectory),
    filename: '[name].js'
  },
  module: {
    rules: [{
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  },
  devServer: {
    port: 3000,
    open: true,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  plugins: [
    new CleanWebpackPlugin([outputDirectory]),
    new CopyPlugin({
      patterns: [
        { 
          from: "public",
          globOptions: {
            ignore: [
              // Ignore all `html` files
              "**/*.html",
            ],
          },
        },
      ],
    }),
    new WorkboxPlugin.InjectManifest({
      swSrc: path.join(process.cwd(), '/src/client/worker.js'),
      swDest: 'worker.js',
      exclude: [
        /\.map$/,
        /manifest$/,
        /\.htaccess$/,
        /service-worker\.js$/,
        /sw\.js$/,
        /\.DS_Store$/,
      ],
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      chunks: ["bundle"],
      favicon: './public/favicon.ico'
    })
  ]
};