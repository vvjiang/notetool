const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const pathsToClean = [
  'build',
];

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: {
    main: ['babel-polyfill', './src/app.js'],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[chunkhash].js',
    // 添加 chunkFilename
    publicPath: '/',
    chunkFilename: '[name].[chunkhash:5].chunk.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './template/index.html',
      filename: 'demo.html',
      minify: {
        collapseWhitespace: true,
      },
      hash: isProduction,
    }),
    new MiniCssExtractPlugin({ filename: '[name].[contenthash].css', allChunks: false }),
    new CleanWebpackPlugin(pathsToClean),
  ],
  module: {
    rules: [{
      test: /\.jsx?$/,
      exclude: /(node_modules)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['react', 'env', 'stage-0', 'stage-3'],
          plugins: [
            ['import', { libraryName: 'antd-mobile', style: 'css' }], // `style: true` 会加载 less 文件
          ],
        },
      },
    },
    {
      test: /\.(gif|png|jpe?g|svg)$/i,
      use: [{
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'images/',
        },
      },
      {
        loader: 'image-webpack-loader',
        options: {
          bypassOnDebug: true,
        },
      },
      ],
    },
    {
      test: /\.html$/,
      use: [{
        loader: 'html-loader',
        options: {
          minimize: true,
        },
      }],
    }],
  },
};
