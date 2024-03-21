// const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const TerserPlugin = require("terser-webpack-plugin");

class DonePlugin {
  apply(compiler) {
    compiler.hooks.done.tap("DonePlugin", (stats) => {
      console.log("Compile is done !");
      setTimeout(() => {
        process.exit(0);
      });
    });
  }
}

module.exports = {
  watch: false,
  mode: "production",
  devtool: "source-map",
  plugins: [
    // Specify production API URL
    // new webpack.DefinePlugin({
    //   'process.env': {
    //     NODE_ENV: JSON.stringify('development'),
    //   },
    // }),
    new BundleAnalyzerPlugin(),
    new DonePlugin(),
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
        },
      }),
    ],
  },
};
