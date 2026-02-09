import { nanoid } from "nanoid";
import { Cell, Notebook } from "./types";

/**
 * Generate a unique cell ID
 */
export function generateCellId(): string {
  return `cell_${nanoid(12)}`;
}

/**
 * Generate a unique notebook ID
 */
export function generateNotebookId(): string {
  return `nb_${nanoid(12)}`;
}

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a notebook document
 */
export function validateNotebook(doc: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!doc) {
    return { valid: false, errors: [{ path: "", message: "Document is null or undefined", severity: "error" }] };
  }

  if (typeof doc !== "object") {
    return { valid: false, errors: [{ path: "", message: "Document is not an object", severity: "error" }] };
  }

  // Required fields
  const requiredFields = ["id", "title", "cells", "version"];
  for (const field of requiredFields) {
    if (!(field in doc)) {
      errors.push({ path: field, message: `Missing required field: ${field}`, severity: "error" });
    }
  }

  if (Array.isArray(doc.cells)) {
    const ids = new Set<string>();
    doc.cells.forEach((cell: any, index: number) => {
      const path = `cells[${index}]`;
      if (!cell.id) errors.push({ path: `${path}.id`, message: "Cell missing ID", severity: "error" });
      else {
        if (ids.has(cell.id)) {
          errors.push({ path: `${path}.id`, message: `Duplicate cell ID: ${cell.id}`, severity: "error" });
        }
        ids.add(cell.id);
      }
      if (!cell.type) errors.push({ path: `${path}.type`, message: "Cell missing type", severity: "error" });
      if (typeof cell.source !== "string") {
        errors.push({ path: `${path}.source`, message: "Cell source must be a string", severity: "error" });
      }
    });
  }

  return {
    valid: errors.filter((e) => e.severity === "error").length === 0,
    errors,
  };
}
