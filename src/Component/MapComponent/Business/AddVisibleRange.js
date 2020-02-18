import React, { Component } from 'react';
import ol from 'openlayers';
import { getCarmalAngle, controlCarmal } from './ApiUtils';
import { getLayer } from '../utils';
const sides = 1000;
// 拖动旋转后，相机转动的角度参数
let rotateAngle = 0, startAngle = 0;
//相机状态,是在拖拽  0否  1是
let status = 0;
let tMap, tOrigin, tRadius, tCount, tAngle, tVectorLayer;

//圆心    半径  边数  角度数  方向角
function createRegularPolygonCurve(origin, radius, r, angel) {
    let rotation = 360 - r;
    let angle = Math.PI * ((1 / sides) - (1 / 2));
    if(rotation) {
        angle += (rotation / 180) * Math.PI;
    }
    let rotatedAngle, x, y;
    let points = [];
    for(let i = 0; i < sides; ++i) {
        let an = i * ((360 - rotation) / 360);
        rotatedAngle = angle + (an * 2 * Math.PI / sides);
        x = origin[0] + (radius * Math.cos(rotatedAngle));
        y = origin[1] + (radius * Math.sin(rotatedAngle));
        points.push([x, y]);
    }
    if(rotation !== 0){
        points.push(origin);
    }
    let ring = new ol.geom.LinearRing(points);
    ring.rotate(((angel + r + 90) / 180) * Math.PI, origin);
    let poy = new ol.geom.Polygon([points]);
    let a = ring.A;
    poy.A = a;
    return poy;
}
//画扇形
function addSector(map, origin, radius, rangeAngle, startAng, vectorLayer, featureObj){
    if(map && featureObj && getLayer(featureObj, map) === vectorLayer){
        vectorLayer.getSource().removeFeature(featureObj);
    }
    //调用自定义的写好的生成扇形的 方法          //圆心    半径      边数 弧度 方向角(以y周围0)(可以自定义自己的x周一样)
    let points = createRegularPolygonCurve(origin, radius, rangeAngle, startAng);
    let iconFeature = new ol.Feature({
        geometry: points,
        population: 4000,
        rainfall: 500,
        Id:featureObj.get('Id'),
        MarkName:featureObj.get('MarkName'),
        MarkCode:featureObj.get('MarkCode'),
        MarkerAngle:featureObj.get('MarkerAngle'),
        MarkerType:featureObj.get('MarkerType'),
        DeviceCode:featureObj.get('DeviceCode'),
        DeviceName:featureObj.get('DeviceName'),
        ViewSheds:featureObj.get('ViewSheds'),
        ViewAngle:featureObj.get('ViewAngle'),
        LayerType:featureObj.get('LayerType'),
        LayerCode:featureObj.get('LayerCode'),
        Origin:origin,
        Radius:radius,
        RangeAngle:rangeAngle,
        StartAng:startAng,
        RotateLayer:vectorLayer
    });

    let iconStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'transparent',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(249,208,131, 0.8)'
        })
    });
    iconFeature.setStyle(iconStyle);
    vectorLayer && vectorLayer.getSource().addFeatures([iconFeature]);
    return { feature:iconFeature, layer:vectorLayer, point:origin };
}

// 相机转动更新地图显示
function cameraIconRotate(result){
    if(status === 1){
        return;
    }
    const { Para2 } = result;  //lat lng zoom
    let lng = Para2;
    let markAngle = lng / 100;
    if(markAngle > 360){
        markAngle = markAngle - 360;
    }else if(lng < 0){
        markAngle = markAngle + 360;
    }
    // cm.VisibleRangeAngle = cm.InitAngle + (int)(mm.Lng - cm.DemarcateAngle);
    // 绘制扇形
    tVectorLayer && tVectorLayer.getSource().clear();
    addSector(tMap, tOrigin, tRadius, tCount, tAngle, markAngle, tVectorLayer);
}

//   //控制相机旋转
function cameraRotate(code, visibleAngle, markAngle){
    status = 1;
    let lng = markAngle;
    let lat = 0;
    if(lng > 360){
        lng = lng - 360;
    }else if(lng < 0){
        lng = lng + 360;
    }
    //VIID/query/devInst  调获  lat  zoom
    getCarmalAngle(code, (result) => {

        const { Para1, Para2, Para3 } = result;
        lat = Para1;
        // float angleLng = cmm.VisibleRangeAngle - cmm.MarkerInfo.InitAngle + cmm.MarkerInfo.DemarcateAngle;
        let PTZCmdPara1 = (lng * 100) | (lat << 16);
        let PTZCmdPara2 = 0;
        let PTZCmdPara3 = Para3 << 16;
        // 1256332620
        controlCarmal(parseInt(PTZCmdPara1), parseInt(PTZCmdPara2), parseInt(PTZCmdPara3), code, () => {
            status = 0;
        });
    });
}
//旋转函数
function rotateHandle(map, evt, origin, radius, rangeAngle, vectorLayer, fea){
    let nowCoord = evt.coordinate;
    let _nowCoord = [nowCoord[0] - origin[0], nowCoord[1] - origin[1]];
    let distance = Math.sqrt(_nowCoord[0] * _nowCoord[0] + _nowCoord[1] * _nowCoord[1]);
    //鼠标移动的角度
    let _viewAngle;
    if(nowCoord[1] > origin[1]){
        _viewAngle = Math.acos(_nowCoord[0] / distance) * 360 / (2 * Math.PI) - rangeAngle / 2;
    }else{
        _viewAngle = Math.asin(_nowCoord[0] / distance) * 360 / (2 * Math.PI) + 270 - rangeAngle / 2;
    }
    vectorLayer.getSource().removeFeature(fea);
    rotateAngle = rangeAngle;
    startAngle = _viewAngle;
    return addSector(map, origin, radius, rangeAngle, _viewAngle, vectorLayer, fea);
}
//地图添加元素拖动事件
function addMoveInteraction(map){
    let app = {};
    app.Drag = function() {

        ol.interaction.Pointer.call(this, {
            handleDownEvent: app.Drag.prototype.handleDownEvent,
            handleDragEvent: app.Drag.prototype.handleDragEvent,
            handleMoveEvent: app.Drag.prototype.handleMoveEvent,
            handleUpEvent: app.Drag.prototype.handleUpEvent
        });

        this.coordinate_ = null;

        this.cursor_ = 'pointer';

        this.feature_ = null;

        this.previousCursor_ = undefined;

    };
    ol.inherits(app.Drag, ol.interaction.Pointer);

    app.Drag.prototype.handleDownEvent = function(evt) {
        let  map = evt.map;

        let feature = map.forEachFeatureAtPixel(evt.pixel,
            function(feature) {
                return feature;
            });

        if (feature) {
        	 let geom = (feature.getGeometry());
            if (geom instanceof ol.geom.MultiPolygon) {
                return;
            } else if (geom instanceof ol.geom.LineString) {
                return;
            }else{
                this.coordinate_ = evt.coordinate;
                // alert(evt.coordinate[0]);
                this.feature_ = feature;
            }
        }
        return !!feature;
    };

    /**
       * @param {module:ol/MapBrowserEvent~MapBrowserEvent} evt Map browser event.
       */
    app.Drag.prototype.handleDragEvent = function(evt) {
        // let pixel = map.getEventPixel(evt.originalEvent);
        map.forEachFeatureAtPixel(evt.pixel, function (feature, _layer) {
            let _markType = feature.get('MarkerType');
            // MarkType为 2，5，8的相机是可以转动的 分别是 标清云台摄像机/红外球机/高清云台摄像机
            if((_layer === feature.get('RotateLayer')) && ((_markType === 2) || (_markType === 5) || (_markType === 8))){
                rotateHandle(map, evt, feature.get('Origin'), feature.get('Radius'), feature.get('RangeAngle'), _layer, feature);
            }
            return feature;
        });
    };

    /**
       * @param {module:ol/MapBrowserEvent~MapBrowserEvent} evt Event.
       */
    app.Drag.prototype.handleMoveEvent = function(evt) {
        if (this.cursor_) {
            var map = evt.map;
            var feature = map.forEachFeatureAtPixel(evt.pixel,
                function(feature) {
                    return feature;
                });
            var element = evt.map.getTargetElement();
            if (feature) {
                if (element.style.cursor !== this.cursor_) {
                    this.previousCursor_ = element.style.cursor;
                    element.style.cursor = this.cursor_;

                }
            } else if (this.previousCursor_ !== undefined) {
                element.style.cursor = this.previousCursor_;
                this.previousCursor_ = undefined;
            }
        }
    };

    /**
       * @return {boolean} `false` to stop the drag sequence.
       */
    app.Drag.prototype.handleUpEvent = function(evt) {
        map.forEachFeatureAtPixel(evt.pixel, function (feature, _layer) {
            if(_layer === feature.get('RotateLayer')){
                cameraRotate(feature.get('DeviceCode'), rotateAngle, startAngle);
            }
        });
        // 相机转动
        this.coordinate_ = null;
        this.feature_ = null;
        return false;
    };
    let appD = new app.Drag();
    //将交互添加到map中
	    map.addInteraction(appD);
}



//拖动旋转  map：地图对象  origin：中心点 radius：半径 r:弧度 angel:以x轴正半轴为0度 逆时针递增 isRotate:是否支持旋转 vectorLayer:绘制在哪个图层上 feature:设备要素
function rotatedAngleHandel(options){
    const { map, origin, radius, viewAngle, markerAngle, viewLayer, featureObj } = options;
    addSector(map, origin, radius, viewAngle, markerAngle, viewLayer, featureObj);
    tMap = map;
    tOrigin = origin;
    tRadius = radius;
    tAngle = viewAngle;
    tVectorLayer = viewLayer;
    //添加拖拽事件
    addMoveInteraction(map);
}
class AddVisibleRange extends Component{
    static addSector = addSector;
    static rotatedAngleHandel = rotatedAngleHandel;
    static cameraIconRotate = cameraIconRotate;
}

export default AddVisibleRange;