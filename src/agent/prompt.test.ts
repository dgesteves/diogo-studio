import { describe, expect, it } from "vitest";

import { makeChunk } from "@tests/agent";

import { REFUSAL_TEXT } from "./response";
import { formatUserPrompt, SYSTEM_PROMPT } from "./prompt";

function unwrap(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

describe("SYSTEM_PROMPT", () => {
  it("asks for the bracketed markers the answer renderer parses", () => {
    expect(SYSTEM_PROMPT).toContain("[N]");
    expect(unwrap(SYSTEM_PROMPT)).toContain("Cite sources inline with bracketed numbers");
  });

  it("speaks the same refusal as the deterministic one, so the agent has one voice", () => {
    expect(unwrap(SYSTEM_PROMPT)).toContain(unwrap(REFUSAL_TEXT));
  });

  it("forbids answering from anything but the supplied sources", () => {
    expect(unwrap(SYSTEM_PROMPT)).toContain("Use ONLY the SOURCES provided below");
  });
});

describe("formatUserPrompt()", () => {
  const chunk = makeChunk({
    id: "diligent#1",
    sourceTitle: "Diligent design system",
    permalink: "/work",
    content: "Authored the company-wide design system.",
  });

  it("numbers the sources from 1 to match the citation markers", () => {
    const prompt = formatUserPrompt("who is diogo", [
      chunk,
      makeChunk({ id: "b", sourceTitle: "Peacock", content: "Streaming." }),
    ]);

    expect(prompt).toContain("[1] Diligent design system");
    expect(prompt).toContain("[2] Peacock");
  });

  it("puts the question above the sources and closes with the instruction", () => {
    const prompt = formatUserPrompt("who is diogo", [chunk]);

    expect(prompt.indexOf("QUESTION:")).toBeLessThan(prompt.indexOf("SOURCES:"));
    expect(prompt).toContain("who is diogo");
    expect(prompt.trimEnd()).toMatch(/Cite with \[N\]\.$/);
  });

  it("trims the question", () => {
    expect(formatUserPrompt("  who is diogo\n", [chunk])).toContain("QUESTION:\nwho is diogo\n");
  });

  it("appends the heading and tags when the chunk has them", () => {
    const prompt = formatUserPrompt("q", [
      makeChunk({
        id: "a",
        sourceTitle: "Diligent design system",
        heading: "Governance",
        tags: ["design-system", "react"],
        content: "body",
      }),
    ]);

    expect(prompt).toContain(
      "[1] Diligent design system · Governance · tags: design-system, react",
    );
  });

  it("omits the heading and tags when they are absent or empty", () => {
    const prompt = formatUserPrompt("q", [
      makeChunk({ id: "a", sourceTitle: "Diligent design system", tags: [], content: "body" }),
    ]);

    expect(prompt).toContain("[1] Diligent design system\n");
    expect(prompt).not.toContain("·");
  });

  it("gives the model the citable url, anchor included", () => {
    const prompt = formatUserPrompt("q", [
      makeChunk({ id: "a", content: "body", permalink: "/work", anchor: "diligent" }),
    ]);

    expect(prompt).toContain("url: /work#diligent");
  });

  it("gives the bare permalink when there is no anchor", () => {
    expect(formatUserPrompt("q", [chunk])).toContain("url: /work\n");
  });

  it("includes each chunk's content, separated so sources cannot bleed together", () => {
    const prompt = formatUserPrompt("q", [
      chunk,
      makeChunk({ id: "b", content: "Streaming reliability." }),
    ]);

    expect(prompt).toContain("Authored the company-wide design system.");
    expect(prompt).toContain("Streaming reliability.");
    expect(prompt).toContain("\n\n---\n\n");
  });

  it("says so explicitly when there are no sources, rather than leaving a blank block", () => {
    expect(formatUserPrompt("q", [])).toContain("(no sources retrieved)");
  });
});
