// Game tests only: src/kit/** keeps its own tests in the parent repo's shared/game-kit.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
