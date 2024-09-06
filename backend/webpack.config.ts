import path from 'path';
import webpack, { DefinePlugin } from 'webpack';
import nodeExternals from 'webpack-node-externals';

/**
 * Basic Webpack configuration for Webpack 5.
 */
const config: webpack.Configuration = {
    // Production mode
    mode: 'production',

    // Entry point
    entry: './main.ts',

    // Module rules for TypeScript
    module: {
        rules: [
            {
                test: /\.tsx?$/,           // Target all .ts and .tsx files
                use: 'ts-loader',          // Use ts-loader
                exclude: /node_modules/,   // Exclude node_modules
            },
        ],
    },

    // Ignore node externals when compiling for node
    externals: [nodeExternals()],

    // Syntactic sugar
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },

    // Output configuration
    output: {
        filename: 'app.js',                   // Output file name
        path: path.resolve(__dirname, 'dist'), // Output path
        clean: true,                          // Clean the output directory (Webpack 5 feature)
    },

    // Optimization
    optimization: {
        minimize: true,                       // Minify output by default in production mode
    },

    // Target Node.js (optional depending on your use case)
    target: 'node',

    // Define plugin for environment variables if needed
    plugins: [
        new DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
};

export default config;
