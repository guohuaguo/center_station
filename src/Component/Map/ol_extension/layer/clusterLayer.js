import ol from '../ol';
import  { setClusterStyle } from '../style/style';

/**
 * @method 创建聚合图层
 * @param {*} distance  聚合距离
 * @param {*} clusterStyle  聚合图层的样式
 *
 */
export default function  createCluster(distance, clusterStyle){
    let clusterLayer = new ol.layer.Vector({
        source:new ol.source.Cluster({
            distance: distance,
            source: new ol.source.Vector()
        })
    });
    // 设置聚合图层的样式
    clusterLayer.setStyle((feature) => {
        return setClusterStyle(feature, clusterStyle);
    });
    return clusterLayer;
}



