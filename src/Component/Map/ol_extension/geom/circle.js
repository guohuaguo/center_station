// 创建圆
import ol from '../ol';
import  { featureStyleFun } from '../style/style';
/**
 * 创建圆
 * @param {Object} circleArr [{center,radius,circleStyle}], 添加点位的传参
 * @param {Array} center [pointX,pointY], 圆心坐标
 * @param {Object} radius {}  扩展属性
 * @param {Object} circleStyle {text:{},fill:{},stroke:{}} 样式
*/
export default function createCircle(circleArr){
    let polygonFeaturesArr = [];
    circleArr.length && circleArr.forEach((item) => {
        let _geom = { geometry: new ol.geom.Circle(item.center, item.radius) };
        let feature = new ol.Feature(
            Object.assign({}, _geom, item.circleAttr )
        );
        feature.setStyle(featureStyleFun(item.circleStyle));
        polygonFeaturesArr.push(feature);
    });
    return polygonFeaturesArr;
}