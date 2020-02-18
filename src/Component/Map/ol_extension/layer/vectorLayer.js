/**
* 图层操作
*/
import ol from '../ol';
// 矢量图层
export default function  createVectorLayer(param){
    let vector = new ol.layer.Vector({
        source: new ol.source.Vector({}),
        zIndex:param && param.zIndex || 0
    });
    param && param.style && vector.setStyle(param.style);
    return vector;
}
