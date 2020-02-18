
import React, { Component } from 'react';
import ol from 'openlayers';
import GpsMenu from './GpsMenu';
import axios from 'axios';
import onLinePolice from '../Image/onLine_police.png';
import onLining from '../Image/onLineing_police.png';
import offLinePolice from '../Image/offLine_police.png';
import GPS32 from '../Image/GPS32.png';
import GPS48 from '../Image/GPS48.png';
import GPS64 from '../Image/GPS64.png';
/**
 * GPS组件
 * props {
 *  @param {Object} mapDom map组件ref
 *  @param {Array} layers GPS分类的所有图层
 *  @param {Function} getAllStatus GPS组件各类型总数获取回调
 * }
 */
export default class MonitorGps extends Component {
    constructor(props) {
        super(props);
        this.state = {
            statusData: {},   //gps信息
            isCluserSource: true, //默认聚合
            mapIsMove: false // 地图是否移动
        };
        this.gpsInfo = {
            '00': {
                icon: offLinePolice,
                name: '离线',
                num: 0
            },
            '01': {
                icon: offLinePolice,
                name: '离线',
                num: 0
            },
            '10': {
                icon: onLinePolice,
                name: '巡逻',
                num: 0
            },
            '11': {
                icon: onLining,
                name: '出警',
                num: 0
            }
        };
        this.featureSources = {}; //资源
        this.clusterDistance = 60; //聚合距离
        this.startValue = 0;  //起始值
        this.limit = 1000; //gps 每一次请求数量
        this.map = null;
        this.mapIsMove = false;  //地图是否在移动
    }
    componentDidMount() {
        const { mapDom, layers } = this.props;
        //界面初始化
        this.map = mapDom.getBaseMap();
        //初始化获取图层资源
        Object.keys(layers).forEach((item) => {
            this.featureSources[item] = layers[item].getSource();
        });
        // 地图缩放监听 g05047  20181107
        this.map.getView().on('change:resolution', this.zoomChangeHandle);
        this.map.on('movestart', () => { if (!this.mapIsMove) { this.mapIsMove = true; } });
        this.map.on('moveend', () => { if (this.mapIsMove) { this.mapIsMove = false; } });
        //初始化加载所有GPS
        this.loadData();
        //加载聚合图层
        this.loadCluster();
    }
    componentWillUnmount() {
        this.map && this.map.getView().removeEventListener('change:resolution');
        this.map && this.map.removeEventListener('movestart');
        this.map && this.map.removeEventListener('moveend');
    }
    /**
     * 加载聚合图层
     */
    loadCluster = () => {
        // 判断是否聚合 <=15级为聚合  g05047  20181107
        let _zoom = this.map.getView().getZoom();
        this.setState({
            isCluserSource: _zoom <= 15
        });
        if (_zoom && _zoom <= 15) {
            //加载聚合图层
            this.addClusterLayer();
        }
    }
    /**
     * 获取地图的GPS资源
     */
    getGpsSource = () => {
        return this.featureSources;
    }
    /**
     * 获取GPS信息
     */
    getGpsInfo = () => {
        return this.state.statusData;
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
                return this.setClusterStyle(feature);
            });
        });
    }
    /**
     * @method 设置聚类样式
     * @param {Object} feature 要素对象
    */
    setClusterStyle = (feature) => {
        let size = feature.get('features').length;
        let style = new ol.style.Style({
            image: new ol.style.Icon({
                src: size > 64 ? GPS64 : (size > 48 ? GPS48 : GPS32),
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
    /**
     * 地图缩放和移动处理事件
     *
     */
    zoomChangeHandle = () => {
        let zoom = this.map && this.map.getView().getZoom();
        const { isCluserSource } = this.state;
        const { layers } = this.props;
        //zoom<=15 级 为聚合图层
        if (zoom % 1 === 0) {
            if ((zoom <= 15) && !isCluserSource) {
                this.addClusterLayer();
                this.setState({ isCluserSource: true });
            } else if ((zoom > 15) && isCluserSource) {
                Object.keys(layers).forEach((item) => {
                    layers[item].setSource(this.featureSources[item]);
                });
                this.setState({ isCluserSource: false });
            }
        }
    }
    /**
     * 创建点位元素
     * @param {Object} item 组装后的点位数据
     * @param {Object} message 原生的点位数据
     */
    getFeature = (item, message) => {
        const { mapDom } = this.props;
        let feature = new ol.Feature({
            geometry: new ol.geom.Point(mapDom.getMapPoint(item.coord[0], item.coord[1])),
            id: item.deviceCode,
            name: item.deviceName,
            status: item.gpsInfo.name,
            coord: item.coord,
            markerType: 'gps',
            markerData: JSON.stringify(message)
        });
        feature.setStyle(
            new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 19],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    src: item.gpsInfo.icon,
                    crossOrigin: 'anonymous',
                    offsetOrigin: 'bottom-right',
                    offset: [1, 1],
                    scale: 1 //标注图标大小
                }),
                text: new ol.style.Text({
                    offsetX: 5,
                    offsetY: -30,
                    text: item.deviceName + `（${item.gpsInfo.name}）`,
                    fill: new ol.style.Fill({ color: '#00f' })
                })
            })
        );
        feature.setId(item.deviceCode);
        return feature;
    }
    /**
     * 循环初始化的GPS信息, 加载元素并累加总数
     * @param {Array} data GPS信息
     */
    loadFeature = (data) => {
        const { mapDom } = this.props;
        const { statusData } = this.state;
        let gpsObj = {};
        //将每个点位添加到地图上
        data.forEach((item) => {
            if (typeof item.X !== 'number' || typeof item.Y !== 'number') {
                return;
            }
            //更加点位的状态取得点位的图标并加入到总状态中
            let status = item.Status1 + '' + item.Status2;
            //各状态GPS总数累加
            this.gpsInfo[status].num += 1;
            // 判断数据是否符合要求
            let lng = item.X;
            let lat = item.Y;
            if ((180 >= lng && -180 <= lng) && (85 >= lat && -85 <= lat)) {
                //将所有点位的状态存起来
                let itemData = {
                    status,
                    code: item.DeviceCode,
                    name: item.DeviceName || item.DeviceCode,
                    time: item.GpsTime.replace(/[T|Z]/g, ' ').trim(),
                    lng,
                    lat,
                    layerCode: item.LayerType
                };
                statusData[item.DeviceCode] = itemData;
                let feature = this.getFeature({
                    coord: [lng, lat],
                    gpsInfo: this.gpsInfo[status],
                    deviceCode: item.DeviceCode,
                    deviceName: item.DeviceName || item.DeviceCode
                }, item);
                if (gpsObj[item.LayerType]) {
                    gpsObj[item.LayerType].push(feature);
                } else {
                    gpsObj[item.LayerType] = [feature];
                }
            }
        });
        //添加到地图上（将点位加载到对应资源中）
        Object.keys(this.featureSources).forEach((item) => {
            if (gpsObj[item]) {
                this.featureSources[item].addFeatures(gpsObj[item]);
            }
        });

        this.setState({ statusData });
    }
    /**
     * 调用接口初始化加载所有GPS数据
     */
    loadData = () => {
        let condition = {
            from: this.startValue,
            count: this.limit
        };
        axios({
            method: 'get',
            url: '/map/api/gps/device',
            params: condition
        }).then((res) => {
            if (res.data.Devices.length > 0) {
                this.loadFeature(res.data.Devices);
            }
            //若返回的GPS数等于请求总数，认定还有GPS数据未获取，再次请求
            if (res.data.Count === this.limit) {
                this.startValue += this.limit;
                this.loadData();
            } else {
                this.onWebsocket();
                this.exprtData();
            }
        }).catch((err) => {
            console.error(err);
        });
    }
    /**
     * 建立websocket连接，接收推送的GPS
     */
    onWebsocket = () => {
        // SubSocketCenter.sub(['G0', 'G1', 'G2', 'G3'], (data) => {
        //     const { Type, Msg } = data;
        //     this.opreateMsg(Type, Msg);
        // }, 'MCGps');
    }
    /**
     * 根据推送接收到的信息进行不同操作
     */
    opreateMsg = (type, message) => {
        switch (type) {
            //G0 移动坐标或新增GPS
            case 'G0':
                this.moveIcon(message);
                break;
            //  G1 在线、离线变化  修改图标
            case 'G1':
                this.modifyIcon(message);
                break;
            //G2 删除
            case 'G2':
                this.deleteIcon(message.Code);
                break;
            //G3 修改信息,刷新图层
            case 'G3':
                this.changeStatus(message.DeviceCode, 'update', {
                    name: message.DeviceName,
                    layerCode: message.LayerType
                });
                break;
            //G4 增加图标
            case 'G4':
                break;
            //G5 改变模式
            case 'G5':
                //Perform = 0 性能模式/Realtime = 1 实时模式/  Force = 2 强制刷新
                //现在所有点位都是强制刷新模式，所以不作处理
                break;
            default:
                break;
        }
    }
    /**
     * @method 改变状态数据
     * @param {String} code 推送信息编码
     * @param {String} sign 操作类型
     * @param {Object} newData 设备信息
     */
    changeStatus = (code, sign, newData) => {
        const { statusData } = this.state;
        if ('add' !== sign && !statusData[code]) {
            return;
        }
        //信息改变
        if ('change' === sign) {  //修改状态
            let agoStatus = statusData[code].status;
            if (this.gpsInfo[agoStatus].num >= 1) {
                this.gpsInfo[agoStatus].num -= 1;
            }
            statusData[code] = Object.assign(statusData[code], newData);
            this.gpsInfo[newData.status].num += 1;
        } else if ('remove' === sign) {  //移除
            let agoStatus = statusData[code].status;
            if (this.gpsInfo[agoStatus].num >= 1) {
                this.gpsInfo[agoStatus].num -= 1;
            }
            delete statusData[code];
        } else if ('add' === sign) {  //新增
            statusData[code] = newData;
            this.gpsInfo[newData.status].num += 1;
        } else if ('update' === sign) {  //更新其他数据（除状态外）
            statusData[code] = Object.assign(statusData[code], newData);
        }
        this.setState({ statusData });
    }
    /**
     * @method 传出总状态
     * @param {String} code 推送信息编码
     * @param {String} sign 操作类型
     * @param {Object} newData 设备信息
     */
    exprtData = () => {
        const { getAllStatus } = this.props;
        //将结果数据传出到回调函数中
        if (getAllStatus && typeof getAllStatus === 'function') {
            getAllStatus({
                onLine: this.gpsInfo['11'].num,
                onPolice: this.gpsInfo['10'].num,
                underLine: this.gpsInfo['00'].num + this.gpsInfo['01'].num
            });
        }
    }
    /**
     * 根据GPS信息的Code找到这个元素
     * @param {String} code GPS的code值
     */
    findFeature = (code) => {
        let feature = null;
        let source = null;
        Object.values(this.featureSources).some((item) => {
            let ifFind = item.getFeatures().some((item1) => {
                if (item1.getId() === code) {
                    feature = item1;
                    source = item;
                    return true;
                }
            });
            if (ifFind) {
                return true;
            }
        });
        return {
            fea: feature,
            source
        };
    }
    /**
     * G0 移动点位或新GPS上线
     * @param {Object} message GPS信息
     */
    moveIcon = (message) => {
        let { fea } = this.findFeature(message.Code);
        //如果地图上已有此点位，则只移动点位
        if (!!fea) {
            let feaGeometry = fea.getGeometry();
            let feaCood = feaGeometry.getCoordinates();
            let newCoord = this.props.mapDom.getMapPoint(message.MarsLng, message.MarsLat);
            let deltaX = newCoord[0] - feaCood[0];
            let deltaY = newCoord[1] - feaCood[1];
            feaGeometry.translate(deltaX, deltaY);
            this.changeStatus(message.Code, 'update', {
                lng: message.MarsLng,
                lat: message.MarsLat
            });
        } else {
            //可能会有新增GPS设备的可能(即新上线了gps设备)
            //默认新增的设备的状态为巡逻中(因为没传状态)
            // 判断数据是否符合要求
            let lng = message.MarsLng;
            let lat = message.MarsLat;
            if ((180 >= lng && -180 <= lng) && (85 >= lat && -85 <= lat)) {
                let itemData = {
                    status: '10',
                    code: message.Code,
                    name: message.Code,
                    time: message.Time,
                    lng: message.MarsLng,
                    lat: message.MarsLat
                };
                this.changeStatus(message.Code, 'add', itemData);
                //添加到地图上
                let feature = this.getFeature({
                    coord: [lng, lat],
                    gpsInfo: this.gpsInfo['10'],
                    deviceName: message.Code,
                    deviceCode: message.Code
                }, message);
                if (this.featureSources['60001']) {
                    this.featureSources['60001'].addFeature(feature);
                    //传出数据
                    this.exprtData();
                }
            }
        }
    }
    /**
     * G2 删除点位
     * @param {String} code GPS的code值
     */
    deleteIcon = (code) => {
        //根据code找到要删除的Feature并在地图上删除
        let { fea, source } = this.findFeature(code);
        if (!source || !fea) {
            return;
        }
        source.removeFeature(fea);
        //找到并在总状态中删除这个点位的状态
        this.changeStatus(code, 'remove');
        this.exprtData();
    }
    /**
     * G1 修改点位图标，状态 在线离线
     * @param {Object} message 推送的信息
     */
    modifyIcon = (message) => {
        //找到这个元素,并改变它的图标
        let { fea } = this.findFeature(message.DeviceCode);
        let status = message.Status1 + '' + message.Status2;
        let gpsInfo = this.gpsInfo[status];
        fea && fea.setStyle(
            new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 19],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    src: gpsInfo.icon,
                    crossOrigin: 'anonymous',
                    offsetOrigin: 'bottom-right',
                    offset: [1, 1],
                    scale: 1 //标注图标大小
                }),
                text: new ol.style.Text({
                    offsetX: 5,
                    offsetY: -30,
                    text: fea.get('name') + `（${gpsInfo.name}）`,
                    fill: new ol.style.Fill({ color: '#00f' })
                })
            })
        );
        let itemData = { status };
        if (message.Time) {
            itemData.time = message.Time;
        }
        //在总状态中添加这个新的状态，并传出
        this.changeStatus(message.DeviceCode, 'change', itemData);
        this.exprtData();
    }
    render() {
        const { mapDom, layers } = this.props;
        return (
            <GpsMenu mapDom={mapDom} layers={layers} />
        );
    }
}
