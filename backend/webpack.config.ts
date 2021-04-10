// @ts-ignore
import path from 'path';
// @ts-ignore
import webpack, {DefinePlugin} from 'webpack';
import nodeExternals from 'webpack-node-externals'

/**
 * Basic Webpack configuration.
 */
const config: webpack.Configuration = {
    // We only use webpack in production mode.
    mode: "production",

    // Main build entry point.
    entry: './main.ts',

    // Typescript loader for webpack.
    module: {
        rules: [
            {
                test: /\.tsx?$/,         // Target al .ts files
                use: 'ts-loader',        // Use the ts-loader
                exclude: /node_modules/, // Ignore the node_modules
            },
        ],
    },

    plugins: [new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    })],

    // Ignore node externals when compiling.
    externals: [nodeExternals()],

    // Syntactic sugar
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },

    // Output everything in a app.js file under dist.
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist'),
    },
};

console.warn(process.env)

export default config;
