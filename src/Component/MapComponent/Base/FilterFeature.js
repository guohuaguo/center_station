
import ol from 'openlayers';
import { insidePolygon, pointInsideCircle, aroundLine } from '../utils';
let drawLayer = '';   //绘制图层
let drawObj = '';//绘画对象
let selectedFeatures = [];//框选的要素
let params, extent;
class FilterFeature {
    /**
 * 画矩形交互
 */
    static addInteractionRectangle(map, draw, drawSource) {
        // 创建绘制对象
        draw = new ol.interaction.Draw({
            source: drawSource,
            type: 'LineString',
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 0, 0, 0.1)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#f00',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({
                        color: '#f00'
                    })
                })
            }),
            maxPoints: 2,
            geometryFunction: function (coordinates, geometry) {
                if (!geometry) {
                    geometry = new ol.geom.Polygon(null);
                }
                let start = coordinates[0];
                let end = coordinates[1];
                geometry.setCoordinates([
                    [start, [start[0], end[1]], end, [end[0], start[1]], start]
                ]);
                return geometry;
            }
        });
        // 绘图交互添加给map
        map.addInteraction(draw);
        return draw;
    }
    //创建draw对象
    static addInteraction(map, draw, drawType, drawSource) {
        if (drawType !== 'None') {
            draw = new ol.interaction.Draw({
                source: drawSource,
                type: drawType,
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 0, 0, 0.1)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#f00',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 5,
                        fill: new ol.style.Fill({
                            color: '#f00'
                        })
                    })
                })
            });
            map.addInteraction(draw);
        }
        return draw;
    }
    static selectFeatures = (options) => {
        const { map, featureLayer, drawType, getMapPoint, callBack } = options;
        map.removeInteraction(drawObj);
        //参数
        params = options;
        map.removeLayer(drawLayer);
        //移除图层
        selectedFeatures = [];
        let drawSource = new ol.source.Vector({ wrapX: false });
        // 创建绘画图层
        drawLayer = new ol.layer.Vector({
            source: drawSource,
            zIndex: 300
        });
        map.addLayer(drawLayer);

        let draw;
        if (drawType !== 'None') {
            // 矩形绘制
            if (drawType === 'Rectangle') {
                draw = FilterFeature.addInteractionRectangle(map, draw, drawSource);
            } else {
                draw = FilterFeature.addInteraction(map, draw, drawType, drawSource);
            }
            drawObj = draw;
            /**
       * 框选开始
       */
            draw.on('drawstart', function (evt) {
                drawSource.clear();
                selectedFeatures = [];
            });
            /**
       * 框选结束
       */
            draw.on('drawend', function (evt) {
                selectedFeatures = [];
                let DrawInfo = {
                    drawType: drawType,
                    points: []
                };
                let polygon = evt.feature.getGeometry();
                //如果不设置延迟，范围内要素选中后自动取消选中，具体原因不知道
                let newCoords;
                //圆形框选
                if (drawType === 'Circle') {
                    let center = polygon.getCenter(),
                        radius = polygon.getRadius(),
                        // polygon的范围
                        extent = polygon.getExtent();
                    DrawInfo.center = center;
                    DrawInfo.radius = radius;
                    let features = featureLayer.getSource().getFeaturesInExtent(extent); //先缩小feature的范围
                    for (let i = 0; i < features.length; i++) {
                        newCoords = features[i].getGeometry().getCoordinates();
                        if (pointInsideCircle(newCoords, center, radius)) {
                            // 框选的要素集合
                            selectedFeatures.push(features[i]);
                        }
                    }
                } else {
                    extent = polygon.getExtent();
                    let features = featureLayer.getSource().getFeaturesInExtent(extent); //先缩小feature的范围
                    if ((drawType === 'LineString') && (features.length === 0)) {
                        features = featureLayer.getSource().getFeatures();
                    }
                    let _points = [];
                    let points = polygon.A;
                    points.map((item, indx) => {
                        if (indx > 0 && indx % 2 === 1) {
                            _points.push([points[indx - 1], points[indx]]);
                        }
                    });
                    DrawInfo.points = _points;
                    for (let i = 0; i < features.length; i++) {
                        newCoords = features[i].getGeometry().getCoordinates();
                        if (drawType !== 'LineString') {
                            if (insidePolygon(_points, newCoords)) {
                                selectedFeatures.push(features[i]);
                            }
                        } else {
                            for (let j = 0; j < _points.length - 1; j++) {
                                let pixel1 = map.getPixelFromCoordinate(_points[j]);
                                let pixel2 = map.getPixelFromCoordinate(_points[j + 1]);
                                let pixel3 = map.getPixelFromCoordinate(newCoords);
                                if (aroundLine([pixel1, pixel2], pixel3)) {
                                    selectedFeatures.push(features[i]);
                                }
                            }
                        }

                    }
                }
                // 回调返回框选的要素
                if (callBack) {
                    let _selectedFeatures = [...new Set(selectedFeatures)];
                    callBack(_selectedFeatures, DrawInfo);
                }

            });
        }
    };
    //清除绘画
    static handleClean(map) {
        map.removeInteraction(drawObj);
        map.removeLayer(drawLayer);
    }
}

export default FilterFeature;
