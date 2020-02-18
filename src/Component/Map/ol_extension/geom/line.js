
// 创建线
import ol from '../ol';
import  { featureStyleFun } from '../style/style';

/**
 * 创建线
 * @param {Object} lineArr [{coordArr,lineAttr,lineStyle}], 添加点位的传参  lineArr = [{coordArr:[[],[]],lineAttr:{},lineStyle:{}},{}]
 * @param {Object} coordArr [[],[]]
 * @param {Object} lineAttr {}  扩展属性
 * @param {Object} lineStyle {image：{src:'',....}, text:{text:'',font:'',fill:'',stroke:''}} 样式
*/
export default function createLine(lineArr){
    let lineFeaturesArr = [];
    lineArr.length && lineArr.forEach((item) => {
        let _geom = { geometry: new ol.geom.LineString(item.coordArr) };
        let feature = new ol.Feature(
            Object.assign({}, _geom, item.lineAttr)
        );
        item.lineStyle && feature.setStyle(featureStyleFun(item.lineStyle));
        lineFeaturesArr.push(feature);
    });
    return lineFeaturesArr;
}