import { ListAdaptor } from "../..//tessagon/tessagon.adaptors.list_adaptor";
import { plane } from "../..//tessagon/tessagon.misc.shapes";
import {
  MetaParameter,
  RangeMetaParameter,
  SelectMetaParameter,
} from "../../meta-parameter";
import {
  getAllTesselationNames,
  makeTesselationFromNameAndOptions,
} from "../../tessagon/js-entry";
import { bufferPointstoPathItem } from "../../utils/paperjs-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

export class InnerDesignTessagon extends FastAbstractInnerDesign {
  allowOutline = true;
  needSubtraction = true;
  needSeed = false;
  canRound = true;
  canKaleido = true;

  makeDesign(paper: paper.PaperScope, params) {
    const {
      outerModel,
      boundaryModel,
      tesselation,
      x_num,
      y_num,
      borderSize,
      x_cyclic,
      y_cyclic,
      rot_factor,
      xScale,
      yScale,
      xSkew,
      ySkew,
      xShear,
      yShear,
    } = params;

    // u_range: a list with two items indicating the minimum and maximum values for u (the first argument to the function passed);
    // v_range: a list with two items indicating the minimum and maximum values for v (the second argument to the function passed);
    // u_num: the number of tiles to be created in the u-direction;
    // v_num: the number of tiles to be created in the v-direction;
    //     adaptor ListAdaptor from the module tessagon.adaptors.list_adaptor. The output from the adaptor's get_mesh method is a dict with keys
    // vert_list, face_list and color_list, which point to lists of
    //  vertices, faces (as indices into the vertex list), and color indices for each face.

    const u_range = [
      boundaryModel.bounds.x - borderSize,
      boundaryModel.bounds.x + boundaryModel.bounds.width + borderSize,
    ];
    const v_range = [
      boundaryModel.bounds.y - borderSize,
      boundaryModel.bounds.y + boundaryModel.bounds.height + borderSize,
    ];

    const options = {
      function: plane,
      u_range: u_range,
      v_range: v_range,
      u_num: x_num,
      v_num: y_num,
      u_cyclic: false,
      v_cyclic: false,
      adaptor_class: ListAdaptor,
    };
    if (rot_factor != 0) {
      options["rot_factor"] = rot_factor;
    }

    const bmesh = makeTesselationFromNameAndOptions(tesselation, options);
    // const bmesh = makeTesselationFromName(tesselation,
    //   0, boundaryModel.bounds.width, 0, boundaryModel.bounds.height,
    //   x_num, y_num, rot_factor);

    const vertices = bmesh["vert_list"];
    const faces = bmesh["face_list"];

    const paths = faces.map((face) => {
      const points = face.map((vertIndex) => {
        return new paper.Point(vertices[vertIndex][0], vertices[vertIndex][1]);
      });
      const bufferedShape = bufferPointstoPathItem(paper, -borderSize, points);

      return bufferedShape;
      // return new paper.Path(points);
    });

    const group = new paper.Group(paths);

    group.fitBounds(boundaryModel.bounds);
    group.scale(xScale, yScale);
    group.skew(xSkew, ySkew);
    group.shear(xShear, yShear);
    group.fitBounds(boundaryModel.bounds);

    return Promise.resolve({
      paths,
    });
  }

  get designMetaParameters(): Array<MetaParameter<any>> {
    return [
      // new RangeMetaParameter({
      //   title: "Circle Size",
      //   min: 0.04,
      //   max: 0.5,
      //   value: 0.04,
      //   step: 0.01,
      //   name: "circleSize"
      // }),
      new SelectMetaParameter({
        title: "tesselation",
        options: getAllTesselationNames(),
        // value: _.sample(getAllTesselationNames()),
        value: "HexSquareTriTessagon",
        name: "tesselation",
      }),
      new RangeMetaParameter({
        title: "x cells",
        min: 1,
        max: 100,
        value: 5,
        step: 1,
        name: "x_num",
        randMin: 1,
        randMax: 10,
      }),
      new RangeMetaParameter({
        title: "y cells",
        min: 1,
        max: 100,
        value: 2,
        step: 1,
        name: "y_num",
        randMin: 1,
        randMax: 10,
      }),
      // new OnOffMetaParameter({
      //   title: 'whole tiles only',
      //   value: false,
      //   name: 'whole_tiles_only'
      // }),
      // new OnOffMetaParameter({
      //   title: 'y cyclic',
      //   value: false,
      //   name: 'y_cyclic'
      // }),
      new RangeMetaParameter({
        title: "rot factor",
        min: 0,
        max: 100,
        value: 0,
        step: 1,
        name: "rot_factor",
      }),
      new RangeMetaParameter({
        title: "borderSize",
        min: 0.02,
        max: 0.5,
        value: 0.04,
        step: 0.01,
        name: "borderSize",
      }),
      new RangeMetaParameter({
        title: "xScale",
        min: 0.1,
        max: 100,
        value: 1,
        step: 0.01,
        name: "xScale",
      }),
      new RangeMetaParameter({
        title: "yScale",
        min: 0.1,
        max: 100,
        value: 1,
        step: 0.01,
        name: "yScale",
      }),
      new RangeMetaParameter({
        title: "xSkew",
        min: 0.1,
        max: 180,
        value: 0,
        step: 0.01,
        name: "xSkew",
      }),
      new RangeMetaParameter({
        title: "ySkew",
        min: 0.1,
        max: 180,
        value: 0,
        step: 0.01,
        name: "ySkew",
      }),
      new RangeMetaParameter({
        title: "xShear",
        min: 0.1,
        max: 1,
        value: 0,
        step: 0.01,
        name: "xShear",
      }),
      new RangeMetaParameter({
        title: "yShear",
        min: 0.1,
        max: 1,
        value: 0,
        step: 0.01,
        name: "yShear",
      }),
    ];
  }
}
