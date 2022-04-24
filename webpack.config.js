const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

const outputDirectory = "dist";

module.exports = {
  entry: {
    main: ["babel-polyfill", "./src/client/index.tsx"],
    // worker: ['babel-polyfill', "./src/client/worker.js"]
  },
  devtool: "source-map",
  output: {
    path: path.join(__dirname, outputDirectory),
    filename: "[name].js",
    chunkFilename: "[name].bundle.js",
  },
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: "ts-loader" },
      {
        test: /\.jsx?$/,
        use: ["babel-loader", "source-map-loader"],
        exclude: /.*\/node_modules\/.*/,
      },

      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        use: "url-loader?limit=100000",
      },
    ],
  },
  resolve: {
    extensions: ["*", ".js", ".jsx", ".tsx", ".ts"],
  },
  devServer: {
    port: 3000,
    host: "127.0.0.1",
    open: true,
    proxy: {
      "/api": "http://localhost:8080",
    },
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
      swSrc: path.join(process.cwd(), "/src/client/worker.js"),
      swDest: "worker.js",
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
      template: "./public/index.html",
      chunks: ["main"],
      favicon: "./public/favicon.ico",
    }),

    // This is needed because SimplePeer requires access to the process (https://github.com/feross/simple-peer/issues/767)
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],
};
