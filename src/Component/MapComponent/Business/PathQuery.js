/*
 * @Author: g05047
 * @Date: 2019-06-13 09:07:29
 * @LastEditors: g05047
 * @LastEditTime: 2019-06-20 19:30:34
 * @Description: 轨迹查询组件
 */
/* eslint-disable */
import React, { Component } from 'react';
import { Progress, Slider, Spin } from 'antd';
import ol from 'openlayers';
import axios from 'axios';
import move from '../Image/car.png';
import start from '../Image/blue.png';
import stop from '../Image/red.png';
import playback from '../Image/playBack.png';
import speedcar from '../Image/carSpeed.png';
import '../style/index.less';
import $ from 'jquery';

let prevVector = null; //地图上原先的vector
class PathQuery extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showAdjustSpeed: false,        //默认的调节小车行驶的进度条不显示
            carProgerss: 0,                //默认的小车在轨迹上行驶的进度
            canRefreshAnimation: true,     //默认小车的重新运动按钮可用
            fetching: false,
            type: this.props.type,
            isLoading: true
        };
        this.map;                          //定义的地图容器句柄
        this.marker;                       //默认点击出现弹出框
        this.index = 0;                    //默认的小车在轨迹的位置
        this.defaultCarSpeed = 1000;        //默认小车的行驶速度
        this.lastFetchId = 0;
        this.requirePointArr = [];          //请求点数组
        this.requirePointAttr = [];
    }
    componentDidMount() {
        const { map, coordsArray } = this.props.options;
        this.map = map;
        if (this.map) {
            this.onDataLoad(coordsArray);
        }
    }
    componentWillReceiveProps(nextProps) {
        const { coordsArray } = nextProps.options;
        if (this.map && (coordsArray !== this.props.options.coordsArray)) {
            this.onDataLoad(coordsArray);
        }
    }
    componentWillUnmount() {
        const that = this;
        that.map && that.map.un('postcompose', that.moveFeature);
        prevVector && that.map.removeLayer(prevVector);
    }
    /**
     * @method: 请求路网数据
     * @param {Array}  coordsArray 用户传入的请求参数  [{'Position': {'Lng': ,'Lat': },'ConnectTime': ''}
     * @return: undefined
     */
    onDataLoad = (coordsArray) => {
        let that = this;
        let { isNotRoad } = this.props.options;
        const { isLoading } = this.state;
        !isLoading && that.setState({
            isLoading: true
        });
        if (isNotRoad) {
            that.addLineTrack(coordsArray);
            return;
        }
        //调接口得到路网数据
        axios({
            method: 'POST',
            url: '/map/api/roadmap?isface=true',
            data: coordsArray || []
        }).then((res) => {
            if (Object.is(res.data.ErrCode, 0)) {
                this.dealRequirePoint(coordsArray);
                //将路网数据画到地图上
                that.addRoadNetwork(res.data.TrajectoryItems);
            } else {
                that.addLineTrack(coordsArray);
            }
        }).catch((err) => {
            that.addLineTrack(coordsArray);
        });
    }
    /**
     * @method: 处理传入的轨迹点数据
     * @param {Array} data 传入轨迹接口的请求点位参数
     * @return: this.requirePointArr 处理后的请求点位数据
     */
    dealRequirePoint = (data) => {
        const { getWGS2Mars, map, isNotWGS2Mars } = this.props.options;
        let _getWGS2Mars = getWGS2Mars || map.getWGS2Mars;
        let RoadData = [];
        let attrData = [];
        data && data.forEach((item) => {
            let coordinate = [item.Position.Lng, item.Position.Lat];
            attrData.push(item.attribute || {});
            if (_getWGS2Mars && !isNotWGS2Mars) {
                coordinate = _getWGS2Mars(coordinate[0], coordinate[1]);
            }
            RoadData.push(
                coordinate
            );
        });
        this.requirePointAttr = attrData;
        this.requirePointArr = RoadData;
        return this.requirePointArr;
    }
    /**
     * @method: 请求路网失败时添加已有的点位
     * @param {Array} data 点位参数
     * @return: undefined
     */
    // 请求路网失败时
    addLineTrack = (data) => {
        let that = this;
        prevVector && this.map.removeLayer(prevVector);
        that.map && that.map.un('postcompose', that.moveFeature);
        let RoadData = this.dealRequirePoint(data);
        that.generateCarMoveOnMap(RoadData);
    }
    //将路网的线画到地图上
    addRoadNetwork = (data) => {
        const { getWGS2Mars, map, isNotWGS2Mars } = this.props.options;
        let _getWGS2Mars = getWGS2Mars || map.getWGS2Mars;
        let that = this;
        prevVector && this.map.removeLayer(prevVector);
        that.map && that.map.un('postcompose', that.moveFeature);
        // 划线数据
        let RoadNetworkData = [];
        // 1.添加起点
        RoadNetworkData.push(this.requirePointArr[0]);
        // 2.添加途径点
        data.forEach((item) => {
            if (!item.Points) {
                return;
            }
            if (item.StartPoint && item.StartPoint.Position && item.StartPoint.Position.Lng) {
                let _tarCoord = [item.StartPoint.Position.Lng, item.StartPoint.Position.Lat];
                if (_getWGS2Mars && !isNotWGS2Mars) {
                    _tarCoord = _getWGS2Mars(_tarCoord[0], _tarCoord[1]);
                }
                // 转化为火星
                RoadNetworkData.push(_tarCoord);
            }
            item.Points.forEach((items) => {
                // 转化为火星
                let coordinate = [items.Lng, items.Lat];
                if (_getWGS2Mars && !isNotWGS2Mars) {
                    coordinate = _getWGS2Mars(coordinate[0], coordinate[1]);
                }
                RoadNetworkData.push(
                    coordinate
                );
            });
            if (item.EndPoint && item.EndPoint.Position && item.EndPoint.Position.Lng) {
                let _tarCoord = [item.EndPoint.Position.Lng, item.EndPoint.Position.Lat];
                if (_getWGS2Mars && !isNotWGS2Mars) {
                    _tarCoord = _getWGS2Mars(_tarCoord[0], _tarCoord[1]);
                }
                // 转化为火星
                RoadNetworkData.push(_tarCoord);
            }
        });
        // 3.添加终点
        RoadNetworkData.push(this.requirePointArr[this.requirePointArr.length - 1]);
        that.generateCarMoveOnMap(RoadNetworkData);
    }
    /**
     * @method: 构造轨迹回放动画
     * @param {Array} coordinate 所有的轨迹点
     * @return: undefined
     */
    generateCarMoveOnMap = (coordinate) => {
        const { map, getMapPoint, trackStyle, isNotRoad } = this.props.options;
        let _getMapPoint = getMapPoint || map.getMapPoint;
        let that = this;
        that.map = map;
        let styles = {
            //线路的样式
            'route': new ol.style.Style({ stroke: new ol.style.Stroke({ width: trackStyle && trackStyle.routeWidth || 5, color: trackStyle && trackStyle.routeColor || '#7DAC4A' }) }),
            //起点的样式
            'start': new ol.style.Style({ image: new ol.style.Icon({ scale: 1, anchor: trackStyle && trackStyle.startAnchor || [0.5, 0.9], src: trackStyle && trackStyle.startImage || start }) }),
            //终点的样式
            'end': new ol.style.Style({ image: new ol.style.Icon({ scale: 1, anchor: trackStyle && trackStyle.endAnchor || [0.5, 0.9], src: trackStyle && trackStyle.endImgae || stop }) }),
            //小车的样式
            'geoMarker': new ol.style.Style(trackStyle && trackStyle.isNotDynamic ? {} : { image: new ol.style.Icon({ scale: 0.65, src: trackStyle && trackStyle.dynamicImage || move }) }),
            //真实点的样式
            'point': new ol.style.Style(trackStyle && trackStyle.wayPointImage && { image: new ol.style.Icon({ scale: 0.8, anchor: [0.5, 0.82], src: trackStyle.wayPointImage }) } || {})
        };

        let animating = false, now;
        let routeCoords, routeLength, geoMarker;
        let startButton = $('#trackSet-box');
        let traversed = 0;      //走过的路程
        let elapsedTime = 0;    //用过的时间
        let retime = 10000;         //保存上次运动所用的时间

        if (coordinate.length > 2) {
            let geometry = new ol.geom.LineString();
            let minScale = 0.001;
            let lngValue, latValue;
            //构造坐标点之间的线路
            for (let i = 0; i < coordinate.length; i++) {
                if (isNotRoad) {
                    geometry.appendCoordinate(_getMapPoint(coordinate[i][0], coordinate[i][1]));
                } else if (i > 0) {
                    //构造坐标点之间的路径
                    lngValue = coordinate[i][0] - coordinate[i - 1][0];
                    latValue = coordinate[i][1] - coordinate[i - 1][1];
                    //有一种特殊的情况当相邻的两个坐标点重合,或者当两个坐标点非常近的时候
                    let zLength = Math.sqrt(lngValue * lngValue + latValue * latValue);
                    if (zLength == 0 || Math.round(zLength / minScale) == 0) {
                        geometry.appendCoordinate(_getMapPoint(coordinate[i][0], coordinate[i][1]));
                    }
                }
            }
            //标记小车运动轨迹上真实的坐标点
            let reallyGeometry = new ol.geom.LineString();
            //从第二个点到倒数第二个点
            for (let i = 1; i < coordinate.length - 1; i++) {
                reallyGeometry.appendCoordinate(_getMapPoint(coordinate[i][0], coordinate[i][1]));
            }
            let reallyPoint = new Array();

            for (let i = 1; i < this.requirePointArr.length - 1; i++) {
                //构造小车运动的线路上真实经过的坐标点
                reallyPoint.push(new ol.Feature({
                    type: 'point', state: 0,
                    num: coordinate[coordinate.length - 1][2],
                    status: coordinate[coordinate.length - 1][3],
                    address: coordinate[coordinate.length - 1][4],
                    ... this.requirePointAttr[i],
                    geometry: new ol.geom.Point(_getMapPoint(this.requirePointArr[i][0], this.requirePointArr[i][1]))
                }));
            }

            routeCoords = geometry.getCoordinates();
            routeLength = routeCoords.length;

            //小车行走的线路
            let routeFeature = new ol.Feature({
                type: 'route', state: 1,
                geometry: geometry
            });
            //运动的小车
            geoMarker = new ol.Feature({
                type: 'geoMarker', state: 1,
                geometry: new ol.geom.Point(routeCoords[0])
            });
            //轨迹开始坐标
            let startMarker = new ol.Feature({
                type: 'start', state: 0,
                ... this.requirePointAttr[0],
                num: coordinate[0][2],
                status: coordinate[0][3],
                address: coordinate[0][4],
                geometry: new ol.geom.Point(routeCoords[0])
            });
            //轨迹终止坐标
            let endMarker = new ol.Feature({
                type: 'end', state: 0,
                ... this.requirePointAttr[this.requirePointAttr.length - 1],
                num: coordinate[coordinate.length - 1][2],
                status: coordinate[coordinate.length - 1][3],
                address: coordinate[coordinate.length - 1][4],
                geometry: new ol.geom.Point(routeCoords[routeLength - 1])
            });

            //轨迹上所有的坐标的集合
            let vector = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [routeFeature, ...reallyPoint, geoMarker, startMarker, endMarker]
                }),
                style: function (feature) {
                    if (animating && feature.get('type') === 'geoMarker') { return null; }
                    return styles[feature.get('type')];
                }
            });

            //保存上一次的layer
            prevVector = vector;
            //在地图上添加坐标的点集
            that.map.addLayer(vector);
            if (!trackStyle || trackStyle && !trackStyle.isNotDynamic) {
                startButton.on('click', '#start-animation', startAnimation);
                let timeFunc = setTimeout(() => {
                    startAnimation();
                    clearTimeout(timeFunc);
                }, 50);
            }
            map && map.getView().fit(geometry.getExtent(), {
                padding: [300, 300, 300, 150],
                constrainResolution: false,
                nearest: true
            });
        } else if (coordinate.length > 0 && coordinate.length < 3) {
            //当做标点小于3个大于0个的时候
            let geometry = new ol.geom.LineString();
            for (let i = 0; i < coordinate.length; i++) {
                geometry.appendCoordinate(_getMapPoint(coordinate[i][0], coordinate[i][1]));
            }
            routeCoords = geometry.getCoordinates();
            routeLength = routeCoords.length;

            //小车行走的线路
            let routeFeature = new ol.Feature({
                type: 'route', state: 1,
                geometry: geometry
            });
            //运动的小车
            geoMarker = new ol.Feature({
                type: 'geoMarker', state: 1,
                geometry: new ol.geom.Point(routeCoords[0])
            });
            //轨迹开始坐标
            let startMarker = new ol.Feature({
                type: 'start', state: 0,
                num: coordinate[0][2],
                status: coordinate[0][3],
                address: coordinate[0][4],
                geometry: new ol.geom.Point(routeCoords[0])
            });
            //轨迹终止坐标
            let endMarker = new ol.Feature({
                type: 'end', state: 0,
                num: coordinate[coordinate.length - 1][2],
                status: coordinate[coordinate.length - 1][3],
                address: coordinate[coordinate.length - 1][4],
                geometry: new ol.geom.Point(routeCoords[routeLength - 1])
            });

            //轨迹上所有的坐标的集合
            let vector = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [routeFeature, geoMarker, startMarker, endMarker]
                }),
                style: function (feature) {
                    if (animating && feature.get('type') === 'geoMarker') { return null; }
                    return styles[feature.get('type')];
                }
            });

            //保存上一次的layer
            prevVector = vector;
            //在地图上添加坐标的点集
            that.map.addLayer(vector);

            if (!trackStyle || trackStyle && !trackStyle.isNotDynamic) {
                startButton.on('click', '#start-animation', startAnimation);
                let timeFunc = setTimeout(() => {
                    startAnimation();
                    clearTimeout(timeFunc);
                }, 50);
            }
            map && map.getView().fit(geometry.getExtent(), {
                padding: [300, 300, 300, 150],
                constrainResolution: false,
                nearest: true
            });
        }

        //小车运动函数
        this.moveFeature = function (event) {
            let vectorContext = event.vectorContext;
            let frameState = event.frameState;
            if (animating) {
                if (retime == 0) {
                    elapsedTime = frameState.time - now;
                } else {

                    elapsedTime = frameState.time - retime;
                }
                retime = frameState.time;
                let index = Math.round(that.defaultCarSpeed * elapsedTime / 1000);
                traversed += index;
                that.index = traversed;
                if (traversed >= routeLength) {
                    //当小车运动到终点的时候
                    moveEnd(true);
                    return;
                }
                let currentPoint = new ol.geom.Point(routeCoords[traversed]);
                let feature = new ol.Feature(currentPoint);
                try {
                    vectorContext.drawFeature(feature, styles.geoMarker);
                } catch (err) {
                    // Log.error('小车运动', err);
                }
            }
            //设置运动的进度条
            that.setState({
                carProgerss: Math.round((that.index + 1) / routeLength * 100)
            });
            that.map.render();
        };

        //开始小车的运动
        function startAnimation() {
            traversed = 0;      //走过的路程
            elapsedTime = 0;    //用过的时间
            retime = 0;         //保存上次运动所用的时间
            if (animating) {
                refreshAnimation();
            } else {
                animating = true;
                now = new Date().getTime();
                geoMarker.setStyle(null);
                that.map.on('postcompose', that.moveFeature);
                that.map.render();
            }
        }

        //当小车运动到终点
        function moveEnd(isend) {
            animating = false;
            let coord = isend ? routeCoords[routeLength - 1] : routeCoords[0];
            (geoMarker.getGeometry()).setCoordinates(coord);
            //防止出现问题当调用次函数的时在设置一下进度条为100%
            that.setState({
                carProgerss: 100
            });
            that.map.un('postcompose', that.moveFeature);
        }

        //小车重新运动
        function refreshAnimation() {
            if (that.state.carProgerss == 100) {
                that.setState({
                    carProgerss: 0
                });
            }
            animating = false;
            if (that.state.canRefreshAnimation) {
                startAnimation();
            }
        }
        that.setState({
            isLoading: false
        });
    }
    /**
     * @method: 显示调节小车运动速度
     * @param {type}  undefined
     * @return: undefined
     */
    adjustSpeed = () => {
        this.setState((prevState) => ({
            showAdjustSpeed: !prevState.showAdjustSpeed
        }));
    }
    //改变小车队的行驶速度
    setNewSpeed = (value) => {
        this.defaultCarSpeed = value + 4;
    }
    //关闭用户打开的显示框
    closeMapMarker = () => {
        this.marker.setPosition(undefined);
        return false;
    }
    render() {
        const { trackStyle } = this.props.options;
        const { isLoading } = this.state;
        return (
            <div id="trackSet-box">
                {isLoading && <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, bottom: 0, left: 0, right: 0, background: 'rgba(0, 0, 0, 0.3)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                        <Spin size="large" />
                    </div>
                </div>}
                {trackStyle && trackStyle.isNotDynamic ? '' : <div className="adjustSpeed" >
                    <img src={playback} className="imgSize" id="start-animation" />
                    <Progress percent={this.state.carProgerss} status="active" className="progress" />
                    <img src={speedcar} className="carImgSize" onClick={this.adjustSpeed} />
                    {this.state.showAdjustSpeed && <div className="adjustSlider">
                        <Slider vertical min={1} defaultValue={this.defaultCarSpeed} className="sliderChoose" onChange={this.setNewSpeed} />
                    </div>}
                </div>
                }
            </div>
        );
    }
}

export default PathQuery;
