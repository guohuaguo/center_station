import React, { Component } from 'react';
import ol from 'openlayers';
import { getVisualArea, getGisCluster, getGisPoint } from './GlobalFunc';
import CameraMenu from './CameraMenu';
import cameraImg from '../Image/camera_sprite24x.png';
/**
 * 摄像机组件
 * props {
 *  @param {Object} mapDom map组件ref
 *  @param {Array} layers 摄像机分类的所有图层
 *  @param {String} mapType Map服务类型  8500/9500
 *  @param {Array} markers 8500摄像机点位数据
 *  @param {Object} iconName 图层对应图标信息 { code: IconName }
 * }
 */
export default class Camera extends Component {
    constructor(props) {
        super(props);
        this.featureSources = {}; //资源
        this.clusterDistance = 60; //聚合距离 8500点位缩放使用
        this.isCluserSource = true; //点位是否聚合（默认聚合） 8500点位缩放使用
        this.map = null; //地图实例
        this.mapIsMove = false;  //地图是否在移动 9500点位使用
        this.timer = null;  //定时器  9500点位使用
        this.timeInterval = 1000;  //地图点位移动间隔时间 9500点位使用
        this.visibleGisLayerNum = 0; //9500显示的图层个数
    }
    componentDidMount(){
        const { mapDom, layers, markers, mapType } = this.props;
        //界面初始化
        this.map = mapDom.getBaseMap();
        //初始化获取图层资源
        Object.keys(layers).forEach((item) => {
            if(layers[item].getVisible()){
                this.visibleGisLayerNum += 1;
            }
            this.featureSources[item] = layers[item].getSource();
        });
        if(!this.map || 0 === Object.keys(this.featureSources).length){
            return;
        }
        //地图事件监听
        this.setMapListener();
        if('9500' !== mapType){
            this.loadMarkersOfNoGis(markers);
        }else{
            this.loadMarkersOfGis();
        }
    }
    componentWillReceiveProps(nextProps){
        const { mapType, markers } = this.props;
        //如果是8500地图服务，点位是在父组件获取后传入   9500是内部调取实现
        if('9500' !== mapType && nextProps.markers.length !== markers.length){
            this.loadMarkersOfNoGis(nextProps.markers);
            return;
        }
        //如果是9500地图服务器，初始一个类型的点位图层未全选，之后再次增加显示图层时，需要请求加载初始化未加载的图层
        let nowVisibleNum = Object.values(nextProps.layers).filter((item) => item.getVisible()).length;
        if('9500' === mapType && this.visibleGisLayerNum !== nowVisibleNum){
            //点击图层显示，才加载  若是隐藏操作，则不请求
            if(nowVisibleNum > this.visibleGisLayerNum){
                this.loadMarkersOfGis();
            }
            this.visibleGisLayerNum = nowVisibleNum;
        }
    }
    componentWillUnmount(){
        this.map && this.map.getView().removeEventListener('change:resolution');
        this.map &&  this.map.removeEventListener('movestart');
        this.map &&  this.map.removeEventListener('moveend');
    }
    //#region Common
    /**
     * 地图事件绑定
     */
    setMapListener = () => {
        //由于movestart、moveend事件在缩放时，也会触发；
        //所以change:resolution缩放事件，只控制8500点位的聚合
        //movestart、moveend监听9500的事件，优化接口请求次数
        // 地图缩放监听
        this.map.getView().on('change:resolution', this.zoomChangeNoGis);
        //地图移动开始
        this.map.on('movestart', () => {
            this.mapIsMove = true;
        });
        //地图移动结束
        this.map.on('moveend', () => {
            this.mapIsMove = false;
            this.moveChangeOfGis();
        });
    }
    /**
     * 创建点位元素
     * @param {Object} item 点位数据
     */
    loadFeature = (item) => {
        const { mapDom, mapType } = this.props;
        let position = [item.Lng, item.Lat];
        //9500服务时，/gis/point接口返回的是真实坐标，需转化为火星坐标
        //8500Map服务时，点位来自/api/marker/client（火星坐标），不需转化
        if('9500' === mapType){
            position = mapDom.getWGS2Mars(...position);
        }
        Object.assign(item, {
            Lng: position[0],
            Lat: position[1]
        });
        if(180 < position[0] || -180 > position[0] || 90 < position[1] || -90 > position[1]){
            return null;
        }
        return new ol.Feature({
            geometry: new ol.geom.Point(mapDom.getMapPoint(...position)),
            markerType: 'camera',
            markerData: JSON.stringify(item)
        });
    }
    /**
     * 设置点位元素样式
     * @param {Object} item 点位数据
     */
    getFeatureStyle = ({ image, offset = [], MarkerName, MarkerCode }) => {
        return new ol.style.Style({
            image: new ol.style.Icon({
                src: image || '',
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                crossOrigin: 'anonymous',
                scale: 1, //标注图标大小
                offsetOrigin: 'top-left',
                offset: offset,
                size:[24, 24]
            }),
            text: new ol.style.Text({
                offsetX: 0,
                offsetY: -10,
                text: MarkerName || MarkerCode,
                fill: new ol.style.Fill({ color: '#00f' })
            })
        });
    }
    /**
     * 设置聚类样式
     * @param {Number} size 聚合点位数目
    */
    getClusterStyle = (size) => {
        let style = new ol.style.Style({
            image: new ol.style.Icon({
                src: require(`../Image/cameraCluster${size > 64 ? 64 : (size > 48 ? 48 : 32)}.png`),
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                crossOrigin: 'anonymous',
                scale: 1, //标注图标大小
                offsetOrigin: 'bottom-center'
            }),
            text: new ol.style.Text({
                offsetX: 0,
                offsetY: size > 64 ? 30 : (size > 48 ? 20 : 15),
                font: '10px sans-serif',
                text: size.toString(),
                fill: new ol.style.Fill({
                    color: '#fff'
                })
            })
        });
        return style;
    }
    //#endregion
    //#region GIS服务直接获取可视区域聚合数
    /**
     * 9500地图缩放、移动处理事件
     */
    moveChangeOfGis = () => {
        const { mapType } = this.props;
        if('9500' !== mapType){
            return;
        }
        if(this.timer){
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.timer = setTimeout(() => {
            if(!this.mapIsMove){
                this.loadMarkersOfGis();
                this.mapIsMove = false;
            }
            clearTimeout(this.timer);
            this.timer = null;
        }, this.timeInterval);
    }
    /**
     * 9500地图服务点位加载
     * 判断缩放等级去请求聚合接口或点位接口
     */
    loadMarkersOfGis = () => {
        const { layers, mapDom } = this.props;
        let zoom = this.map.getView().getZoom();
        //zoom<=15 级 为聚合图层
        if(zoom % 1 === 0){
            let visualArea = getVisualArea(mapDom);
            Object.keys(layers).forEach((item) => {
                if(!layers[item].getVisible()){
                    return;
                }
                let param = { ...visualArea, zoom, layer: item };
                if((zoom <= 15)){
                    this.loadGisCluster(param, item);
                }else{
                    this.loadGisPoint(param, item);
                }
            });
        }
    }
    /**
     * 请求聚合接口，回调处理显示聚合点位
     * @param {Object} param 接口入参
     * @param {String} layerCode 图层编码
     */
    loadGisCluster = (param, layerCode) => {
        getGisCluster(param, 'Camera', (data) => {
            if(!data || !(data instanceof Array) || 0 === data.length){
                this.featureSources[layerCode].clear();
                return;
            }
            let features = [];
            data.forEach((item) => {
                let centerPoint = item.CenterPoint;
                if(typeof centerPoint.Lng !== 'number' || typeof centerPoint.Lat !== 'number'){
                    return;
                }
                let feature = this.loadFeature(centerPoint);
                if(feature){
                    feature.setStyle(this.getClusterStyle(item.Number));
                    features.push(feature);
                }
            });
            this.featureSources[layerCode].clear();
            this.featureSources[layerCode].addFeatures(features);
        });
    }
    /**
     * 请求点位接口，回调处理显示具体点位
     * @param {Object} param 接口入参
     * @param {String} layerCode 图层编码
     */
    loadGisPoint = (param, layerCode) => {
        getGisPoint(param, (data) => {
            if(!data || !(data instanceof Array) || 0 === data.length){
                this.featureSources[layerCode].clear();
                return;
            }
            let features = [];
            data.forEach((item) => {
                if(typeof item.Lng !== 'number' || typeof item.Lat !== 'number'){
                    return;
                }
                Object.assign(item, this.getPointImgOffset(item));
                let feature = this.loadFeature(item);
                if(feature){
                    feature.setStyle(this.getFeatureStyle(item));
                    features.push(feature);
                }
            });
            this.featureSources[layerCode].clear();
            this.featureSources[layerCode].addFeatures(features);
        });
    }
    /**
     * 获取摄像机点位的小图标（精灵图及其图片位置）
     * @param {Object} item 点位数据
     */
    getPointImgOffset = (item) => {
        const { iconName } = this.props;
        if(!iconName[item.LayerType]){
            return { image: cameraImg, offset: [] };
        }
        //获取精灵图中对应小图标的位置
        let startY = (iconName[item.LayerType] % 20000) * 4 * 24 ;
        let startX = (1 === item.Status || 4 === item.Status) ? 0 : ((2 === item.Status || 0 === item.Status) ? 24 : 48);
        if(item.MarkerType <= 2){
            startY = startY + (item.MarkerType - 1) * 24;
        }else if(item.MarkerType === 7){
            startY = startY + 2 * 24;
        }else if(item.MarkerType === 8){
            startY = startY + 3 * 24;
        }
        return { image: cameraImg, offset: [startX, startY] };
    }
    //#endregion
    //#region 点位一次性获取加载后，地图自己聚合
    /**
     * 8500地图缩放处理事件
     */
    zoomChangeNoGis = () => {
        const { mapType, layers } = this.props;
        if('9500' === mapType){
            return;
        }
        let zoom = this.map.getView().getZoom();
        //zoom<=15 级 为聚合图层
        if(zoom % 1 === 0){
            if((zoom <= 15) && !this.isCluserSource ){
                this.addClusterLayer();
                this.isCluserSource = true;
            }else if((zoom > 15) && this.isCluserSource){
                Object.keys(layers).forEach((item) => {
                    layers[item].setSource(this.featureSources[item]);
                });
                this.isCluserSource = false;
            }
        }
    }
    /**
     * 循环点位信息, 创建点位加载到地图上
     * @param {Array} markers 点位信息
     */
    loadMarkersOfNoGis = (markers) => {
        let markerObj = {};
        //将每个点位添加到地图上
        markers.forEach((item) => {
            let feature = this.loadFeature(item);
            if(feature){
                feature.setStyle(this.getFeatureStyle(item));
                if(markerObj[item.LayerCode]){
                    markerObj[item.LayerCode].push(feature);
                }else{
                    markerObj[item.LayerCode] = [feature];
                }
            }
        });
        //添加到地图上（将点位加载到对应资源中）
        Object.keys(this.featureSources).forEach((item) => {
            if(markerObj[item]){
                this.featureSources[item].addFeatures(markerObj[item]);
            }
        });
        // 判断是否聚合 <=15级为聚合
        let _zoom = this.map.getView().getZoom();
        this.isCluserSource = _zoom <= 15;
        if(_zoom && _zoom <= 15){
            //加载聚合图层
            this.addClusterLayer();
        }
    }
    /**
     * 添加聚合图层
     */
    addClusterLayer = () => {
        const { layers } = this.props;
        Object.keys(layers).forEach((item) => {
            //添加为聚合资源
            let _clusterSource = new ol.source.Cluster({
                distance: this.clusterDistance,
                source: this.featureSources[item]
            });
            layers[item].setSource(_clusterSource);
            //设置图层样式
            layers[item].setStyle((feature) => {
                let size = feature.get('features').length;
                return this.getClusterStyle(size);
            });
        });
    }
    //#endregion
    render() {
        const { mapDom, layers } = this.props;
        return (
            <CameraMenu mapDom={mapDom} layers={layers} />
        );
    }
}