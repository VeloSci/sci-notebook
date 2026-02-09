import React from "react";
import type { CellOutput as ICellOutput } from "@velo-sci/notebook-core";

interface CellOutputProps {
  outputs: ICellOutput[];
}

export const CellOutputDisplay: React.FC<CellOutputProps> = ({ outputs }) => {
  if (!outputs || outputs.length === 0) return null;

  return (
    <div className="sci-nb-cell-outputs">
      {outputs.map((output, i) => (
        <div key={i} className={`sci-nb-output sci-nb-output--${output.outputType}`}>
          {renderOutput(output)}
        </div>
      ))}
    </div>
  );
};

function renderOutput(output: ICellOutput): React.ReactNode {
  switch (output.outputType) {
    case "stream":
      return (
        <pre className={`sci-nb-output-stream sci-nb-output-stream--${output.name}`}>
          {output.text}
        </pre>
      );

    case "display": {
      // Prioritize: HTML > SVG > image > text
      if (output.data["text/html"]) {
        return (
          <div
            className="sci-nb-output-html"
            dangerouslySetInnerHTML={{ __html: output.data["text/html"] }}
          />
        );
      }
      if (output.data["image/svg+xml"]) {
        return (
          <div
            className="sci-nb-output-svg"
            dangerouslySetInnerHTML={{ __html: output.data["image/svg+xml"] }}
          />
        );
      }
      if (output.data["image/png"]) {
        return (
          <img
            className="sci-nb-output-image"
            src={`data:image/png;base64,${output.data["image/png"]}`}
            alt="Output"
          />
        );
      }
      if (output.data["image/jpeg"]) {
        return (
          <img
            className="sci-nb-output-image"
            src={`data:image/jpeg;base64,${output.data["image/jpeg"]}`}
            alt="Output"
          />
        );
      }
      if (output.data["application/json"]) {
        return (
          <pre className="sci-nb-output-json">
            {JSON.stringify(JSON.parse(output.data["application/json"]), null, 2)}
          </pre>
        );
      }
      if (output.data["text/plain"]) {
        return <pre className="sci-nb-output-text">{output.data["text/plain"]}</pre>;
      }
      return <pre className="sci-nb-output-text">[Display output]</pre>;
    }

    case "error":
      return (
        <div className="sci-nb-output-error">
          <strong className="sci-nb-output-error-name">{output.name}: </strong>
          <span className="sci-nb-output-error-msg">{output.message}</span>
          {output.traceback && output.traceback.length > 0 && (
            <pre className="sci-nb-output-traceback">
              {output.traceback.join("\n")}
            </pre>
          )}
        </div>
      );

    default:
      return null;
  }
}
