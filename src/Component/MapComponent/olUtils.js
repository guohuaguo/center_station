//ol中一些工具函数
import ol from 'openlayers';
/**
 * argb十六进制转rgba十进制   "#7fef585d"转 'rgba(255,0,0,0.5)'格式
 *  */
export function getArgbToRgba(argb){
    if(argb === ''){
        return;
    }
    let _arr = argb.split('');
    let a = parseInt(_arr[1] + _arr[2], 16) / 255;
    let r = parseInt(_arr[3] + _arr[4], 16);
    let g = parseInt(_arr[5] + _arr[6], 16);
    let b = parseInt(_arr[7] + _arr[8], 16);

    return `rgba(${r},${g},${b},${a})`;
}
/**
 *根据点绘制多边形
 */
function styleFun(feature, styleInfo){
    const { BorderColor, BoundaryWidth, FillColor, FontColor, IsDottedLine, Name } = styleInfo;

    feature.setStyle(new ol.style.Style({
        text: new ol.style.Text({
            offsetX: -5,
            offsetY: -5,
            text:Name || '',
            fill: new ol.style.Fill({ color:FontColor || '#000' }),
            scale:1.5
        }),
        fill: new ol.style.Fill({
            color: FillColor || 'rgba(0,0,0,0)'
        }),
        stroke: new ol.style.Stroke({
            color: BorderColor || '#000',
            width: BoundaryWidth || 2,
            lineDash:IsDottedLine === 0 ? [1, 2, 3, 4, 5, 6] : [0]
        })
    }));
}
export  function drawPolygon(map, layer, polygonInfo){
    const { Points, Code, BorderColor, BoundaryWidth, FillColor, FontColor, IsDottedLine, Layer, Name } = polygonInfo;
    let _layer = layer;
    let source = _layer ? _layer.getSource() : '';
    let feature;
    //创建要素
    feature = new ol.Feature({
        geometry: new ol.geom.Polygon( [Points]),
        Code:Code,
        BorderColor:BorderColor,
        BoundaryWidth:BoundaryWidth,
        FillColor:FillColor,
        FontColor:FontColor,
        IsDottedLine:IsDottedLine,
        Layer:Layer,
        Name:Name,
        Points:Points
    });
    styleFun(feature, polygonInfo);
    if(!_layer){
        //创建source
        source = new ol.source.Vector({
            features:[feature]
        });
        _layer = new ol.layer.Vector({
            source:source
        });
        map.addLayer(_layer);
    }else{
        source.addFeatures([feature]);
    }

    return { layer:_layer, source:source, feature:feature };
}
