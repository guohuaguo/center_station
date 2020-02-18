/* eslint-disable */
import ol from 'openlayers';
import axios from 'axios';
/**
  * 判断一个点在多边形的内部
  */
export function insidePolygon(points, testPoint) {
    var x = testPoint[0], y = testPoint[1];
    var inside = false;
    for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
        var xi = points[i][0], yi = points[i][1];
        var xj = points[j][0], yj = points[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
/**
  * 判断一个点距离线的距离小于
  */
function getJuLi(p1, p2, p3) {
    let len;
    //如果p1.x==p2.x 说明是条竖着的线
    if (p1.x - p2.x == 0) {
        len = Math.abs(p3.x - p1.x)
    } else {
        var A = (p1.y - p2.y) / (p1.x - p2.x)
        var B = p1.y - A * p1.x
        len = Math.abs((A * p3.x + B - p3.y) / Math.sqrt(A * A + 1))
    }
    return len
}
export function aroundLine(points, testPoint) {
    var inaround = false;
    let limit = 60;
    if (points.length === 2) {
        let pxMax, pxMin, pyMax, pyMin;
        let p1 = { x: points[0][0], y: points[0][1] };
        let p2 = { x: points[1][0], y: points[1][1] };
        let p3 = { x: testPoint[0], y: testPoint[1] };
        if (p1.x >= p2.x) {
            pxMax = p1.x + limit;
            pxMin = p2.x - limit
        } else {
            pxMax = p2.x + limit;
            pxMin = p1.x - limit;
        }
        if (p1.y >= p2.y) {
            pyMax = p1.y + limit;
            pyMin = p2.y - limit;
        } else {
            pyMax = p2.y + limit;
            pyMin = p1.y - limit;
        }
        if ((p3.x >= pxMin) && (p3.x <= pxMax) && (p3.y >= pyMin) && (p3.y <= pyMax)) {
            let len = getJuLi(p1, p2, p3);
            len < limit ? inaround = true : '';
        }
    }
    return inaround;
}
/**
  * 判断一个点在圆的内部
  */
export function pointInsideCircle(point, circle, r) {
    if (r === 0) return false;
    var dx = circle[0] - point[0];
    var dy = circle[1] - point[1];
    return dx * dx + dy * dy <= r * r;
}
/**
  * 根据要素找图层  feature:要素  map:map对象
  */
export function getLayer(feature, map) {
    var layers = map.getLayers();
    for (var i = 0; i < layers.length; i++) {
        var source = layers[i].getSource();
        if (source instanceof ol.source.Vector) {
            var features = source.getFeatures();
            if (features.length > 0) {
                for (var j = 0; j < features.length; j++) {
                    if (features[j] === feature) {
                        return layers[i];
                    }
                }
            }
        }
    }
    return null;
}
/**
  * 获取用户信息  callBack:回调函数
  */
export function getUserInfo(callBack) {
    let queryParams = {
        url: '/api/login/domainInfo',
        method: 'GET'
    }
    axios(queryParams)
        .then((res) => {
            let result = res.data;
            if (callBack) {
                callBack(result)
            }
        })
        .catch((err) => { });
}

//创建图层
export function addVector(map) {
    let source = new ol.source.Vector();
    let layer = new ol.layer.Vector({
        source: source
    });
    map.addLayer(layer);
    return layer;
}