import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OperatingSection } from "./operating-section";
import { TrustSection } from "./trust-section";

describe("Operating section", () => {
  it("renders the three operating-altitude cards with the most recent org names", () => {
    render(<OperatingSection />);
    expect(
      screen.getByRole("heading", { level: 2, name: /equally comfortable/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/fueled · current/i)).toBeInTheDocument();
    expect(screen.getByText(/moment · 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/eino\.ai · 2023[\u2013-]2025/i)).toBeInTheDocument();
  });
});

describe("Trust section", () => {
  it("lists the selected engagement companies", () => {
    render(<TrustSection />);
    expect(screen.getByRole("heading", { name: /selected engagements/i })).toBeInTheDocument();
    expect(screen.getByText("NBCUniversal · Peacock")).toBeInTheDocument();
    expect(screen.getByText("Fueled")).toBeInTheDocument();
  });
});
