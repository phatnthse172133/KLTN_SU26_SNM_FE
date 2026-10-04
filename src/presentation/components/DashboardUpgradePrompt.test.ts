import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UpgradePrompt } from "./Dashboard";

describe("dashboard locked analytics panel", () => {
  it("uses remaining flex space rather than the full card height", () => {
    const html = renderToStaticMarkup(createElement(UpgradePrompt, {
      packageName: "Booth Boost", feature: "Best-selling analytics",
    }));
    expect(html).not.toMatch(/(?:class="|\s)h-full(?:\s|")/);
    expect(html).toContain("flex-1");
    expect(html).toContain("min-w-0");
    expect(html).toContain("min-h-[180px]");
    expect(html).toContain("p-4 sm:p-6");
  });

  it("keeps the existing package restriction message", () => {
    const html = renderToStaticMarkup(createElement(UpgradePrompt, {
      packageName: "Booth Boost", feature: "Best-selling analytics",
    }));
    expect(html).toContain("Best-selling analytics");
    expect(html).toContain("is locked");
    expect(html).toContain("Booth Boost");
    expect(html).toContain("to unlock this insight.");
  });
});
