import "../src/app.css";
import type { Preview } from "@storybook/sveltekit";

const THEME_CLASSES = [
  "theme-tangerine",
  "theme-midnight-bloom",
  "theme-solar-dusk",
  "theme-soft-pop",
  "theme-sunset-horizon",
];

const preview: Preview = {
  globalTypes: {
    mode: {
      name: "Mode",
      description: "Light or dark mode",
      toolbar: {
        icon: "moon",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      name: "Theme",
      description: "Color theme",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "niji", title: "Niji" },
          { value: "tangerine", title: "Tangerine" },
          { value: "midnight-bloom", title: "Midnight Bloom" },
          { value: "solar-dusk", title: "Solar Dusk" },
          { value: "soft-pop", title: "Soft Pop" },
          { value: "sunset-horizon", title: "Sunset Horizon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    mode: "light",
    theme: "niji",
  },
  decorators: [
    (storyFn: () => unknown, context: { globals: Record<string, string> }) => {
      const mode = context.globals.mode || "light";
      const theme = context.globals.theme || "niji";
      const root = document.documentElement;

      root.classList.toggle("dark", mode === "dark");

      // Niji is the default — no theme class needed
      for (const cls of THEME_CLASSES) {
        root.classList.remove(cls);
      }
      if (theme !== "niji") {
        root.classList.add(`theme-${theme}`);
      }

      return storyFn();
    },
  ],
};

export default preview;
