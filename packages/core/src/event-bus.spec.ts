import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../src/event-bus";

describe("EventBus", () => {
  it("should subscribe and emit events", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("test-event", handler);

    bus.emit("test-event", { foo: "bar" });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      type: "test-event",
      data: { foo: "bar" }
    }));
  });

  it("should unsubscribe correctly", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsubscribe = bus.on("test-event", handler);

    unsubscribe();
    bus.emit("test-event", { foo: "bar" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should support once subscribers", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.once("test-event", handler);

    bus.emit("test-event", { n: 1 });
    bus.emit("test-event", { n: 2 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ data: { n: 1 } }));
  });

  it("should handle errors in handlers gracefully", () => {
    const bus = new EventBus();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    bus.on("error-event", () => { throw new Error("fail"); });
    const successHandler = vi.fn();
    bus.on("error-event", successHandler);

    bus.emit("error-event", {});

    expect(successHandler).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
