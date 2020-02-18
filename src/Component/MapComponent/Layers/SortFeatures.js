import ol from 'openlayers';
/**
 * 根据经纬度，计算2个点之间的距离
 */
let earthRadius = 6378.137; //km 地球半径 平均值, 千米
/**
 * 将角度换算为弧度
 * @param {Number} degrees 角度
 */
function convertDegreesToRadians(degrees){
    return degrees * Math.PI / 180;
}
/**
 * 将弧度换算为角度
 * @param {Number} radian 弧度
 */
function convertRadiansToDegrees(radian){
    return radian * 180.0 / Math.PI;
}
function haverSin(theta){
    return Math.pow(Math.sin(theta / 2), 2);
}
/**
 * 用haversine公式计算球面两点间的距离
 * @param {Number} lat1 经度1
 * @param {Number} lon1 纬度1
 * @param {Number} lat2 经度2
 * @param {Number} lon2 纬度2
 * return 距离（公里、千米）
 */
export function getDistance(lng1, lat1, lng2, lat2){
    //经纬度转换成弧度
    lng1 = convertDegreesToRadians(lng1);
    lat1 = convertDegreesToRadians(lat1);
    lng2 = convertDegreesToRadians(lng2);
    lat2 = convertDegreesToRadians(lat2);
    //差值
    let vLng = lng2 - lng1;
    let vLat = lat2 - lat1;
    //以弧度表示的大圆距离, 大圆就是一个球体上的切面，它的圆心即是球心的一个周长最大的圆
    let h = haverSin(vLat) + Math.cos(lat1) * Math.cos(lat2) * haverSin(vLng);
    let distance = 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return Math.round(distance * 1000) / 1000;
}
/**
 * 遍历所有点位，从近到远排序
 * @param {Array} layers 图层数组
 * @param {Array} nowCoordinate 当前坐标信息(火星坐标)
 * @param {Array} num 返回条数（前num条）
 * @param {Funtion} checkCondition 过滤筛选条件
 * @param {Boolean} excludeSelf 若点击的是feature元素时，返回数据是否包含自身
 */
export function getSortFeatures({ mapDom, layers, nowCoordinate, num, checkCondition, distance, excludeSelf }){
    if(!mapDom || !mapDom.getMapLngLat){
        return [];
    }
    let result = [];
    //循环图层
    layers.forEach((layer) => {
        //获取图层资源
        let source = layer.getSource();
        if(source instanceof ol.source.Vector){
            //获取图层资源上所有点位元素
            source.getFeatures().forEach((item) => {
                //如果该资源是聚合的点位资源  则再取内部具体的点位
                if(item.getProperties() && item.getProperties().features){
                    item.getProperties().features.forEach((item1) => {
                        //点位JSON数据
                        let markerData = item1.get('markerData') ? (JSON.parse(item1.get('markerData')) || {}) : {};
                        //无筛选条件  有筛选条件，且条件成立
                        if(!checkCondition || typeof checkCondition === 'function' && checkCondition(markerData)){
                            //获取点位的火星坐标
                            let itemCoordinate = mapDom.getMapLngLat(item1.getGeometry().getCoordinates());
                            let range = getDistance(...nowCoordinate, ...itemCoordinate);
                            if(!distance || typeof distance === 'number' && range <= distance){
                                result.push(Object.assign(markerData, { distance: range }));
                            }
                        }
                    });
                    return;
                }
                //点位JSON数据
                let markerData = item.get('markerData') ? (JSON.parse(item.get('markerData')) || {}) : {};
                //无筛选条件  有筛选条件，且条件成立
                if(!checkCondition || typeof checkCondition === 'function' && checkCondition(markerData)){
                    //获取点位的火星坐标
                    let itemCoordinate = mapDom.getMapLngLat(item.getGeometry().getCoordinates());
                    let range = getDistance(...nowCoordinate, ...itemCoordinate);
                    if(!distance || typeof distance === 'number' && range <= distance){
                        result.push(Object.assign(markerData, { distance: range }));
                    }
                }
            });
        }
    });
    //按距离远近排序（从近到远）
    result.sort((a, b) => a.distance - b.distance);
    //返回固定前几条或全部
    return typeof num === 'number' ? result.slice(excludeSelf ? 1 : 0, num) : result;
}