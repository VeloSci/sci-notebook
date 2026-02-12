import { defineComponent, h, type PropType } from "vue";
import type { CellOutput as ICellOutput } from "@velo-sci/notebook-core";

function renderOutput(output: ICellOutput): any {
  switch (output.outputType) {
    case "stream":
      return h("pre", {
        class: `sci-nb-output-stream sci-nb-output-stream--${output.name}`,
      }, output.text);

    case "display": {
      if (output.data["text/html"]) {
        return h("div", {
          class: "sci-nb-output-html",
          innerHTML: output.data["text/html"],
        });
      }
      if (output.data["image/svg+xml"]) {
        return h("div", {
          class: "sci-nb-output-svg",
          innerHTML: output.data["image/svg+xml"],
        });
      }
      if (output.data["image/png"]) {
        return h("img", {
          class: "sci-nb-output-image",
          src: `data:image/png;base64,${output.data["image/png"]}`,
          alt: "Output",
        });
      }
      if (output.data["image/jpeg"]) {
        return h("img", {
          class: "sci-nb-output-image",
          src: `data:image/jpeg;base64,${output.data["image/jpeg"]}`,
          alt: "Output",
        });
      }
      if (output.data["application/json"]) {
        return h("pre", { class: "sci-nb-output-json" },
          JSON.stringify(JSON.parse(output.data["application/json"]), null, 2)
        );
      }
      if (output.data["text/plain"]) {
        return h("pre", { class: "sci-nb-output-text" }, output.data["text/plain"]);
      }
      return h("pre", { class: "sci-nb-output-text" }, "[Display output]");
    }

    case "error":
      return h("div", { class: "sci-nb-output-error" }, [
        h("strong", { class: "sci-nb-output-error-name" }, `${output.name}: `),
        h("span", { class: "sci-nb-output-error-msg" }, output.message),
        output.traceback && output.traceback.length > 0
          ? h("pre", { class: "sci-nb-output-traceback" }, output.traceback.join("\n"))
          : null,
      ]);

    default:
      return null;
  }
}

export const CellOutputDisplay = defineComponent({
  name: "CellOutputDisplay",
  props: {
    outputs: { type: Array as PropType<ICellOutput[]>, required: true },
  },
  setup(props) {
    return () => {
      if (!props.outputs || props.outputs.length === 0) return null;

      return h("div", { class: "sci-nb-cell-outputs" },
        props.outputs.map((output, i) =>
          h("div", {
            key: i,
            class: `sci-nb-output sci-nb-output--${output.outputType}`,
          }, [renderOutput(output)])
        )
      );
    };
  },
});
