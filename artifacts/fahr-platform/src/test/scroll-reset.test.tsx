// Moving between screens must not land the reader halfway down the new one.
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { ScrollToTop } from "@/App";

beforeEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("scroll position across navigation", () => {
  it("resets to the top when the route changes", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", { value: scrollTo, writable: true });

    const { hook, navigate } = memoryLocation({ path: "/learner", record: true });
    render(
      <Router hook={hook}>
        <ScrollToTop />
      </Router>,
    );

    expect(scrollTo).toHaveBeenCalledTimes(1);

    act(() => navigate("/learner/recognition"));

    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: "instant" });
  });

  it("does not re-fire when the route is unchanged", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", { value: scrollTo, writable: true });

    const { hook, navigate } = memoryLocation({ path: "/learner", record: true });
    render(
      <Router hook={hook}>
        <ScrollToTop />
      </Router>,
    );

    act(() => navigate("/learner"));
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});
