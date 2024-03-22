import m from "makerjs";

import { addToDebugLayer } from "../../utils/debug-layers";
import { flattenArrayOfPathItems } from "../../utils/paperjs-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

export class InnerDesignSacredGeometry extends FastAbstractInnerDesign {
  allowOutline = false;
  requiresSafeConeClamp = false;
  needSubtraction = true;
  canKaleido = true;

  async makeDesign(paper: paper.PaperScope, params: any) {
    const { boundaryModel } = params;

    function trussWireframe(w, h) {
      this.models = {
        frame: new m.models.ConnectTheDots(true, [
          [0, h],
          [w, 0],
          [0, 0],
        ]),
      };

      const angled = this.models.frame.paths.ShapeLine1;

      const bracepoints = [
        [0, 0],
        m.point.middle(angled, 1 / 3),
        [w / 2, 0],
        m.point.middle(angled, 2 / 3),
      ];

      this.models.brace = new m.models.ConnectTheDots(false, bracepoints);
    }

    const truss = new trussWireframe(
      boundaryModel.bounds.width,
      boundaryModel.bounds.height
    );
    const expansion = m.model.expandPaths(truss, 0.1, 1);

    const svg = m.exporter.toSVG(expansion);

    const item = new paper.Item();
    const importedItem = item.importSVG(svg);
    console.log({ importedItem });
    const paths = flattenArrayOfPathItems(paper, [importedItem]);
    paths.forEach((p) => {
      addToDebugLayer(paper, "sacredGeometry", p);
    });
    console.log({ svg });
    console.log({ expansion });
    return { paths: [] };
  }

  get designMetaParameters() {
    return [];
  }
}
