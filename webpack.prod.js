const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpack = require('webpack');

module.exports = merge(common, {
  entry: {
    vendor: [
      'react',
      'react-dom',
      'redux',
      'react-router-dom',
      'react-redux',
      'redux-actions',
      'axios'
    ],
  },
  plugins: [
    new BundleAnalyzerPlugin({ analyzerPort: 8919 }),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor'],
      minChunks: Infinity,
      filename: 'common.bundle.[chunkhash].js',
    }),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['manifest'],
      filename: 'manifest.bundle.[chunkhash].js',
    }),
    new ExtractTextPlugin({ filename: '[name].[contenthash].css', allChunks: false }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader?modules'],
        }),
      }, {
        test: /\.css$/,
        include: /node_modules/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader']
        }),
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader?modules', 'less-loader']
        }),
      },
    ],
  }
});
