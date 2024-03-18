const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  entry: path.resolve(__dirname, "..", "./src/index.tsx"),

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    fallback: {
      zlib: require.resolve("browserify-zlib"),
      stream: require.resolve("stream-browserify"),
      assert: "assert/",
    },
    alias: {
      // maps fs to a virtual one allowing to register file content dynamically
      fs: "pdfkit/js/virtual-fs.js",
      // iconv-lite is used to load cid less fonts (not spec compliant)
      "iconv-lite": false,
    },
  },
  module: {
    rules: [
      // bundle and load afm files verbatim
      { test: /\.afm$/, type: "asset/source" },
      // Loader for ts, tsx, js and jsx files
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
          },
        ],
      },

      // Loader for css files
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },

      // Loader for image files
      {
        test: /\.(?:ico|png|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },

      // Loader for font & svg files
      {
        test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
        type: "asset/inline",
      },
      // convert to base64 and include inline file system binary files used by fontkit and linebreak
      {
        enforce: "post",
        test: /fontkit[/\\]index.js$/,
        loader: "transform-loader",
        options: {
          brfs: {},
        },
      },
      {
        enforce: "post",
        test: /linebreak[/\\]src[/\\]linebreaker.js/,
        loader: "transform-loader",
        options: {
          brfs: {},
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "..", "./build"),
    filename: "bundle.js",
    publicPath: "/",
  },
  devServer: {
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "..", "./src/index.html"),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: __dirname + "/src/assets/images",
          to: "build/assets/images",
          noErrorOnMissing: true,
        },
      ],
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
  ],
};
