

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { theme } = require('./package.json');

module.exports = merge(common, {
  output: {
    filename: '[name].[hash].js',
  },
  devtool: 'source-map',
  devServer: {
    port: 8787,
    open: true,
    compress: true,
    index: 'demo.html',
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [{
      test: /\.css$/,
      exclude: /node_modules/,
      use: [MiniCssExtractPlugin.loader, 'css-loader?modules&sourceMap'],
    }, {
      test: /\.css$/,
      include: /node_modules/,
      use: [MiniCssExtractPlugin.loader, 'css-loader?sourceMap'],
    },
    {
      test: /\.less$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader?modules&sourceMap',
        { loader: 'less-loader', options: { modifyVars: theme } }
      ],
    },
    ],
  },
});
