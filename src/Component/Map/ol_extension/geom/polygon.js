
// 创建多边形
import ol from '../ol';
import  { featureStyleFun } from '../style/style';
/**
 * 创建多边形
 * @param {Object} polygonArr [{coordArr,polygonAttr,polygonStyle}], 添加点位的传参  lineArr = [{coordArr:[[],[],[]],polygonAttr:{},polygonStyle:{}},{}]
 * @param {Array} coordArr [[pointX,pointY],[pointX,pointY],[pointX,pointY]], 投影坐标
 * @param {Object} polygonAttr {}  扩展属性
 * @param {Object} polygonStyle {text:{},fill:{},stroke:{}} 样式
*/
export default function createPolygon(polygonArr){
    let polygonFeaturesArr = [];
    polygonArr.length && polygonArr.forEach((item) => {
        let _geom = { geometry:new ol.geom.Polygon([item.coordArr]) };
        let feature = new ol.Feature(
            Object.assign({}, _geom, item.polygonAttr )
        );
        feature.setStyle(featureStyleFun(item.polygonStyle));
        polygonFeaturesArr.push(feature);
    });
    return polygonFeaturesArr;
}