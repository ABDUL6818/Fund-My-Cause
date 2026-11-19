import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx|js|jsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  staticDirs: ["../public"],
  webpackFinal: async (webpackConfig) => {
    // Resolve stories and their imports through the single barrel index.ts
    // instead of the removed *.entry.ts files.
    webpackConfig.resolve = webpackConfig.resolve ?? {};
    webpackConfig.resolve.extensions = [
      ...(webpackConfig.resolve.extensions ?? []),
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
    ];
    return webpackConfig;
  },
};

export default config;