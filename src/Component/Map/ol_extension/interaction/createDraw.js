// 创建画笔
import ol from '../ol';
/**
 * 创建圆
 * @param {Object} drawSource 数据源
 * @param {String} drawType 画笔的类型
 * @param {Object} drawStyle 画笔的样式
 * drawStyle = {
 * fill:{color:''},
 * stroke:{color:'',width:''}}
 *
*/
export default function createDraw( drawLayer, drawType, drawStyle){
    let draw = new ol.interaction.Draw({
        source: drawLayer.getSource(),
        type: drawType,
        style: drawStyle
    });
    return draw;
}