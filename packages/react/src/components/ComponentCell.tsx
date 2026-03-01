import React, { useState, useEffect } from "react";
import { Cell as ICell } from "@velo-sci/notebook-core";

export interface ComponentCellProps {
  cellId: string;
  source: string;
  components?: Record<string, React.ElementType>;
}

export const ComponentCell: React.FC<ComponentCellProps> = ({ source, components }) => {
  const [data, setData] = useState<{ name?: string; props?: Record<string, any> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!source.trim()) {
        setData(null);
        setError(null);
        return;
      }
      const parsed = JSON.parse(source);
      setData(parsed);
      setError(null);
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
    }
  }, [source]);

  if (error) {
    return <div className="sci-nb-component-error" style={{ color: "red", padding: "1rem", border: "1px solid red", borderRadius: "8px" }}>{error}</div>;
  }

  if (!data || !data.name) {
    return <div className="sci-nb-component-empty" style={{ padding: "1rem", color: "var(--sci-text-muted)", fontStyle: "italic" }}>No component specified or empty JSON. Expected: {`{"name": "ComponentName", "props": {}}`}</div>;
  }

  const Component = components?.[data.name];

  if (!Component) {
    return (
      <div className="sci-nb-component-not-found" style={{ padding: "1rem", color: "var(--sci-text-muted)" }}>
        Component <strong>{data.name}</strong> not found in the <code>components</code> registry.
      </div>
    );
  }

  return (
    <div className="sci-nb-component-wrapper">
      <Component {...(data.props || {})} />
    </div>
  );
};
