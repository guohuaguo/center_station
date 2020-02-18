import ol from '../ol';
/**
* 样式设置
*/
export function featureStyleFun (circleStyle, feature) {
    let _circleStyle = Object.assign({}, circleStyle);
    // 文本填充
    if(_circleStyle.text && _circleStyle.text.fill){
        _circleStyle.text.fill = new ol.style.Fill({
            color: _circleStyle.text.fill.color
        });
    }
    // 文本笔触
    if(_circleStyle.text && _circleStyle.text.stroke){
        _circleStyle.text.stroke = new ol.style.Stroke({
            color: _circleStyle.text.stroke.color || 'transparent',
            width: _circleStyle.text.stroke.width || 0
        });
    }
    //返回一个样式
    return new ol.style.Style({
        // 图片
        image: _circleStyle.image && new ol.style.Icon(_circleStyle.image),
        // 填充
        fill: _circleStyle.fill && new ol.style.Fill(_circleStyle.fill),
        // 笔触
        stroke: _circleStyle.stroke && new ol.style.Stroke(_circleStyle.stroke),
        //文本样式
        text: _circleStyle.text && new ol.style.Text(_circleStyle.text)
    });
}

/**
* @method 设置聚类样式
* @param {Object} feature 要素对象
*/
export function setClusterStyle(feature, clusterStyle){
    let size = feature.get('features').length;
    let itemObj = null;
    let len = clusterStyle.condation.length;
    for(let i = 0; i < len && !itemObj; i++){
        if(size > clusterStyle.condation[i].num){
            itemObj = clusterStyle.condation[i];
        }
    }
    if(!itemObj){
        return;
    }
    let style = new ol.style.Style({
        image: new ol.style.Icon({
            src: itemObj.src,
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            scale: 1, //标注图标大小
            offsetOrigin: 'bottom-center'
        }),
        text: new ol.style.Text({
            offsetX: 0,
            offsetY: (itemObj.imgHeight - 2) / 2,
            font: clusterStyle.textStyle && clusterStyle.textStyle.font || '10px sans-serif',
            text: size.toString(),
            fill: new ol.style.Fill({
                color: clusterStyle.textStyle && clusterStyle.textStyle.color || '#fff'
            })
        })
    });
    return style;
}


