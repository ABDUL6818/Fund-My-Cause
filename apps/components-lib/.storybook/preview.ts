import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Run a11y checks automatically for every story.
      config: {
        rules: [
          // Ensure interactive elements have accessible names.
          { id: "button-name", enabled: true },
          { id: "link-name", enabled: true },
          { id: "label", enabled: true },
          // Ensure form controls are properly associated with labels.
          { id: "form-field-multiple-labels", enabled: true },
          // Ensure color contrast meets WCAG AA.
          { id: "color-contrast", enabled: true },
          // Ensure images have alt text.
          { id: "image-alt", enabled: true },
          // Ensure document has a main landmark.
          { id: "landmark-one-main", enabled: true },
          // Ensure page has a level-one heading.
          { id: "page-has-heading-one", enabled: true },
        ],
      },
      options: {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      },
    },
  },
};

export default preview;