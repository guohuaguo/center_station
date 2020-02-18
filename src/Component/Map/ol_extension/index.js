
import createPoint from './geom/point';
import createLine from './geom/line';
import createPolygon from './geom/polygon';
import createCircle from './geom/circle';
import createVectorLayer from './layer/vectorLayer';
import createCluster from './layer/clusterLayer';
import createPopup from './layer/popup';
import createHeatMap from './layer/heatMapLayer';
import createDraw from './interaction/createDraw';
import { featureStyleFun } from './style/style';
let styleFun = featureStyleFun;



let unvgis = {
    createPoint,
    createLine,
    createPolygon,
    createCircle,
    createVectorLayer,
    createPopup,
    createHeatMap,
    createCluster,
    createDraw,
    styleFun
};
export default  unvgis;