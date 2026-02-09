/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SciNotebook } from "./SciNotebook";
import { Notebook, createNotebook } from "@sci-notebook/core";

describe("SciNotebook React Component", () => {
  const createMockNotebook = (): Notebook => ({
    id: "nb_1",
    title: "Test Notebook",
    cells: [
      { id: "c1", type: "markdown", source: "# Cell 1", metadata: {} }
    ],
    metadata: {},
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it("should render the notebook with toolbar and cells", () => {
    render(<SciNotebook notebook={createMockNotebook()} />);
    expect(screen.getByText("Test Notebook")).toBeTruthy();
    expect(screen.getByText("Cell 1")).toBeTruthy();
    expect(screen.getByText(/Undo/)).toBeTruthy();
    expect(screen.getByText(/Redo/)).toBeTruthy();
  });

  it("should add a cell via insert handle", async () => {
    const user = userEvent.setup();
    const { container } = render(<SciNotebook notebook={createMockNotebook()} />);

    // Click the first insert handle "+" button
    const insertBtns = container.querySelectorAll(".sci-nb-insert-btn");
    expect(insertBtns.length).toBeGreaterThan(0);

    await user.click(insertBtns[0]);

    // Menu should appear with cell type options
    const markdownOption = screen.getByText("Markdown");
    await user.click(markdownOption);

    const cells = container.querySelectorAll(".sci-nb-cell");
    expect(cells.length).toBe(2);
  });

  it("should toggle edit mode on click of preview", async () => {
    const notebook = createMockNotebook();
    const engine = createNotebook({ notebook });
    render(<SciNotebook engine={engine} />);

    // Set edit mode via engine
    act(() => {
      engine.setEditMode("c1");
    });
    await waitFor(() => {
      const cell = screen.getByTestId("cell-c1");
      expect(cell.getAttribute("data-editing")).toBe("true");
    });
    expect(await screen.findByDisplayValue("# Cell 1")).toBeTruthy();

    // Set view mode via engine
    act(() => {
      engine.setViewMode("c1");
    });
    await waitFor(() => {
      const cell = screen.getByTestId("cell-c1");
      expect(cell.getAttribute("data-editing")).toBe("false");
    });

    // Click the preview to enter edit mode (click simple, no doble-click)
    const preview = screen.getByTestId("cell-c1").querySelector(".sci-nb-preview");
    fireEvent.click(preview!);

    await waitFor(() => {
      expect(screen.getByTestId("cell-c1").getAttribute("data-editing")).toBe("true");
    });
    expect(await screen.findByDisplayValue("# Cell 1")).toBeTruthy();
  });

  it("should call onChange when notebook changes", async () => {
    const onChange = vi.fn();
    const notebook = createMockNotebook();
    const engine = createNotebook({ notebook });
    render(<SciNotebook engine={engine} onChange={onChange} />);

    act(() => {
      engine.insertCell(1);
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls[0][0].cells.length).toBe(2);
    });
  });

  it("should render empty state when no cells", () => {
    const emptyNb: Notebook = {
      ...createMockNotebook(),
      cells: [],
    };
    render(<SciNotebook notebook={emptyNb} />);
    expect(screen.getByText(/Notebook vacio/)).toBeTruthy();
  });

  it("should hide toolbar when showToolbar is false", () => {
    render(<SciNotebook notebook={createMockNotebook()} showToolbar={false} />);
    expect(screen.queryByText(/Undo/)).toBeNull();
  });
});
