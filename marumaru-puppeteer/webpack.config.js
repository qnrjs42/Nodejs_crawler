module.exports = {
  entry: {
    pageOne: "./index.ts",
    pageTwo: "./CrawlerAPI/pupeteerAPI.ts",
    pageThree: "./CrawlerAPI/fsAPI.ts",
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    puppeteer: 'require ( "puppeteer")',
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/dist",
    chunkFilename: "[id].[chunkhash].js",
  },
  mode: "development",
};