
// 创建点
import ol from '../ol';
import  { featureStyleFun } from '../style/style';
/**
 * 创建点
 * @param {Object} pointArr [{coord,pointAttr,pointStyle}], 添加点位的传参
 * @param {Object} coord [pointX,pointY], 投影坐标
 * @param {Object} pointAttr {}  扩展属性
 * @param {Object} pointStyle {image：{src:'',....}, text:{text:'',font:'',fill:'',stroke:''}} 样式
*/
export default function createPoint(pointArr){
    let pointFeaturesArr = [];
    pointArr.length && pointArr.forEach((item, index) => {
        let _geom = { geometry: new ol.geom.Point(item.coord) };
        let _pointAttr = item.pointAttr || {};
        let feature = new ol.Feature(
            Object.assign({}, _geom, _pointAttr ),
        );
        item.pointStyle && feature.setStyle(featureStyleFun(item.pointStyle));
        pointFeaturesArr.push(feature);
    });
    return pointFeaturesArr;
}