import ol from '../ol';
// 热力图层
export default function  createHeatMap(pointArr, heatMapStyle){
    let features = [];
    let source = new ol.source.Vector({
        wrapX: false
    });
    // 创建热力图层
    let vector = new ol.layer.Heatmap(
        Object.assign({}, { source:source }, heatMapStyle));
    // 找出最大的count
    const max_count = Math.max.apply(
        Math,
        pointArr.map(function(item) {
            return item.count;
        })
    );
    pointArr.map((item, index) => {
        item.weight = item.count / max_count;
    });
    pointArr.forEach(function(data) {
        let _feature = new ol.Feature({
            geometry: new ol.geom.Point( data.coords),
            data: data,
            weight: data.weight
        });
        features.push(_feature);
    });
    vector.getSource().addFeatures(features);
    return vector;
}


