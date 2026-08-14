import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDestination } from "@/content/prose";
import type { ContentBlock } from "@/content/schema";
import { ContentBlocks } from "./blocks";
import { PageView } from "./page-view";

/**
 * How an authored block becomes markup. `content-in-dom.spec.ts` proves the real text of
 * all 17 stations reaches a crawler over HTTP; what it cannot say is whether a list is a
 * list — and that is the whole value of this layer, because a station page is a wall of
 * prose to anyone navigating by structure if these render as anonymous `<div>`s.
 *
 * Fixture blocks rather than real destinations, so a rewritten page never breaks a spec
 * about markup, and every optional field can be asserted both ways.
 */

function renderBlocks(...blocks: ContentBlock[]): void {
  render(<ContentBlocks blocks={blocks} />);
}

describe("Content blocks: prose", () => {
  it("renders a lede as its own paragraph", () => {
    renderBlocks({ kind: "lede", text: "Systems that survive their authors." });

    expect(screen.getByText("Systems that survive their authors.").tagName).toBe("P");
  });

  it("keeps prose paragraphs separate", () => {
    renderBlocks({ kind: "prose", paragraphs: ["First thought.", "Second thought."] });

    expect(screen.getByText("First thought.").tagName).toBe("P");
    expect(screen.getByText("Second thought.").tagName).toBe("P");
  });
});

describe("Content blocks: lists", () => {
  it("renders a titled list as a heading and a list", () => {
    renderBlocks({
      kind: "list",
      title: "What I look for",
      items: ["A real problem", "A team that ships"],
    });

    expect(screen.getByRole("heading", { name: "What I look for" })).toBeInTheDocument();
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["A real problem", "A team that ships"]);
  });

  it("renders an untitled list as a list on its own", () => {
    renderBlocks({ kind: "list", items: ["Just the one"] });

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
  });
});

describe("Content blocks: stats", () => {
  it("pairs each label with its value, and shows a hint only when there is one", () => {
    renderBlocks({
      kind: "stats",
      items: [
        { label: "Scale", value: "40M users", hint: "peak concurrent" },
        { label: "Teams", value: "6" },
      ],
    });

    // A definition list is the pairing: a screen reader reads "Scale, 40M users", not two
    // unrelated strings that happen to sit next to each other.
    const terms = screen.getAllByRole("term");
    expect(terms.map((term) => term.textContent)).toEqual(["Scale", "Teams"]);
    expect(screen.getAllByRole("definition").map((d) => d.textContent)).toEqual([
      "40M users",
      "peak concurrent",
      "6",
    ]);
  });
});

describe("Content blocks: cards", () => {
  it("gives every card a heading, and its meta line only when set", () => {
    renderBlocks({
      kind: "cards",
      items: [
        { title: "Checkout rebuild", meta: "2024", body: "Rewrote the funnel." },
        { title: "Design system", body: "Tokens all the way down." },
      ],
    });

    expect(screen.getByRole("heading", { name: "Checkout rebuild" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Design system" })).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();

    const [first, second] = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(first).toHaveTextContent("Rewrote the funnel.");
    // Counted, not read: an always-rendered meta line is an empty paragraph rather than
    // wrong text, and text assertions cannot see it.
    expect(within(first as HTMLElement).getAllByRole("paragraph")).toHaveLength(2);
    expect(within(second as HTMLElement).getAllByRole("paragraph")).toHaveLength(1);
    expect(second?.textContent).toBe("Design systemTokens all the way down.");
  });
});

describe("Content blocks: timeline", () => {
  it("renders an ordered list, with the organisation only when named", () => {
    renderBlocks({
      kind: "timeline",
      items: [
        { period: "2022 — now", title: "Principal engineer", org: "eino.ai", points: ["Shipped."] },
        { period: "2019 — 2022", title: "Staff engineer", points: ["Also shipped."] },
      ],
    });

    // Order is the meaning of a timeline, so the outer list is an `<ol>`; the inner ones
    // are each entry's points.
    expect(screen.getAllByRole("list").map((list) => list.tagName)).toEqual(["OL", "UL", "UL"]);

    const first = screen.getByRole("heading", { name: "Principal engineer" }).closest("li");
    expect(first).toHaveTextContent("2022 — now");
    expect(first).toHaveTextContent("eino.ai");
    expect(first).toHaveTextContent("Shipped.");

    const second = screen.getByRole("heading", { name: "Staff engineer" }).closest("li");
    expect(second).not.toHaveTextContent("eino.ai");
    // Period only, where the first entry also has an organisation — an org line rendered
    // for an entry that has none is an empty paragraph, which no text assertion can see.
    expect(within(first as HTMLElement).getAllByRole("paragraph")).toHaveLength(2);
    expect(within(second as HTMLElement).getAllByRole("paragraph")).toHaveLength(1);
  });
});

describe("Content blocks: links", () => {
  it("keeps an internal link internal and an external one at arm's length", () => {
    renderBlocks({
      kind: "links",
      items: [
        { label: "The résumé", href: "/resume" },
        { label: "The repository", href: "https://github.com/dgesteves", external: true },
      ],
    });

    const internal = screen.getByRole("link", { name: "The résumé" });
    expect(internal).toHaveAttribute("href", "/resume");
    // A route of this site must stay in this tab, and go through the app's own router.
    expect(internal).not.toHaveAttribute("target");
    expect(internal).not.toHaveAttribute("rel");

    const external = screen.getByRole("link", { name: /the repository/i });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe("Content blocks: an unknown kind", () => {
  it("fails loudly rather than rendering nothing", () => {
    // The union is exhaustive at compile time, so this can only happen through data that
    // was never typechecked — and a station that silently drops a section is worse than a
    // build that stops.
    const rogue = { kind: "carousel", items: [] } as unknown as ContentBlock;

    expect(() => renderBlocks(rogue)).toThrow(/unhandled content block/i);
  });
});

describe("Page view", () => {
  it("frames a station with exactly one first-level heading", () => {
    const destination = getDestination("about");
    render(<PageView slug="about" />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(destination.title);
    expect(screen.getByText(destination.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(destination.summary)).toBeInTheDocument();
  });

  it("makes room for a page's own media, actions and extras", () => {
    render(
      <PageView slug="about" media={<p>A pixelated portrait</p>} actions={<p>Ask the agent</p>}>
        <p>An extra section</p>
      </PageView>,
    );

    expect(screen.getByText("A pixelated portrait")).toBeInTheDocument();
    expect(screen.getByText("Ask the agent")).toBeInTheDocument();
    expect(screen.getByText("An extra section")).toBeInTheDocument();
  });

  it("renders no optional slot a page has not filled", () => {
    render(<PageView slug="contact" />);

    expect(screen.queryByText("A pixelated portrait")).not.toBeInTheDocument();
    expect(screen.queryByText("Ask the agent")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
