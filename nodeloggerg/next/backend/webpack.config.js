import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import { fileURLToPath } from "url";
import CopyPlugin from "copy-webpack-plugin";

// __dirname and __filename are not available in ES modules, so we define them here
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: {
    nodeloggerg: "./src/index.ts",
  },
  output: {
    filename: "[name].min.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    // Add these for proper module export
    library: {
      name: "nodeloggerg",
      type: "commonjs2", // or "umd" if you need browser compatibility
    },
    globalObject: "this",
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  target: "node",
  // Add externals if you don't want to bundle node_modules
  externals: {
    // Add any external dependencies you don't want bundled
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // Preserve function names for better debugging
          keep_fnames: true,
          mangle: false, // Try disabling mangling temporarily
        },
      }),
    ],
  },
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.emit.tapAsync(
          "DTsModuleWrapper",
          (compilation, callback) => {
            for (const [filename, asset] of Object.entries(
              compilation.assets
            )) {
              if (filename.endsWith("index.d.ts")) {
                const content = asset.source();
                const wrappedContent = `declare module "nodeloggerg" {\n${content
                  .split("\n")
                  .filter((line) => line.trim() !== "")
                  .map((line) => `  ${line}`)
                  .join("\n")}\n}`;
                compilation.assets[filename] = {
                  source: () => wrappedContent,
                  size: () => wrappedContent.length,
                };
              }
            }
            callback();
          }
        );
      },
    },
    new CopyPlugin({
      patterns: [{ from: "client", to: "client" }],
    }),
  ],
};
