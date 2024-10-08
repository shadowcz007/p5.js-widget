var _ = require('underscore');
var webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
var production = process.env.NODE_ENV === 'production';

var baseConfig = {
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  devtool: 'source-map',
  module: {
    loaders: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'ts-loader' },
      {
        test: /\.css$/,
        loaders: ["style", "css?sourceMap", "postcss?sourceMap"]
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'p5-widget.html', to: 'p5-widget.html' }, 
      // { from: 'preview-frame.html', to: 'preview-frame.html' }, 
      // {
      //   from:"static",to:"static"
      // }
    ])
  ].concat(
    production ? [
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      })
    ] : []
  ),
  postcss: function () {
    return [require('autoprefixer'),
            require('postcss-custom-properties')];
  }
};

var configurations = function() {
  return [].slice.call(arguments).map(function(config) {
    return _.extend(config, baseConfig);
  });
};

module.exports = configurations({
  entry: {
    'main': './lib/main.tsx',
    'preview-frame': './lib/preview-frame.ts',
    'tests': './test/main.tsx'
  },
  output: {
    filename: './dist/[name].bundle.js'
  }
},
{
  // The p5-widget.js file is directly referenced by widget embedders, so
  // we want the filename and path to be as simple as possible.
  entry: './lib/p5-widget.ts',
  output: {
    filename: './dist/p5-widget.js'
  }
});
