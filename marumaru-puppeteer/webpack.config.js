module.exports = {
  entry: {
    pageOne: './ts-crawler.ts',
    pageTwo: './CrawlerAPI/index.ts'
  },
  devtool: 'inline-source-map',
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    ws: 'empty',
  },
  module: {
    rules: [
      {
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals : { 
    puppeteer : 'require ( "puppeteer")' , 
} ,
  resolve: {
    extensions: [ '.tsx', '.ts', '.js'],
  },
  output:{
    filename: '[name].js',
    path: __dirname + '/dist',
    chunkFilename: '[id].[chunkhash].js'
},
  mode: 'development'
};