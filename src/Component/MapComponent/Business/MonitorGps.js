
/**
 * GPS支持websocket推送
 *
 */
import { Component } from 'react';
import ol from 'openlayers';
import axios from 'axios';
import onLinePolice from '../Image/onLine_police.png';
import onLining from '../Image/onLineing_police.png';
import offLinePolice from '../Image/offLine_police.png';
import GPS32 from '../Image/GPS32.png';
import GPS48 from '../Image/GPS48.png';
import GPS64 from '../Image/GPS64.png';

export default class MonitorGps extends Component {
    constructor(props) {
        super(props);
        this.state = {
            statusData: {},   //gps状态
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
        this.featureSource = null; //资源
        this.layer = null;  //图层
        this.clusterDistance = 60; //聚合距离
        this.startValue = 0;  //起始值
        this.limit = 1000; //gps 每一次请求数量
        this.map = null;
        this.mapIsMove = false;  //地图是否在移动
    }
    componentDidMount() {
        //界面初始化
        this.map = this.props.mapDom.getBaseMap();
        //建立一个图层
        this.layer = this.addVector();
        // 地图缩放监听 g05047  20181107
        this.map.getView().on('change:resolution', this.zoomChangeHandle);
        this.map.on('movestart', () => { if (!this.mapIsMove) { this.mapIsMove = true; } });
        this.map.on('moveend', () => { if (this.mapIsMove) { this.mapIsMove = false; } });
        //初始化加载所有GPS
        this.loadData();
    }
    componentWillUnmount() {
        this.layer && this.map.removeLayer(this.layer);
        this.map && this.map.getView().removeEventListener('change:resolution');
        this.map && this.map.removeEventListener('movestart');
        this.map && this.map.removeEventListener('moveend');
    }
    /**
     * 获取地图的GPS资源
     */
    getGpsSource = () => {
        return this.featureSource;
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
        //添加为聚合资源
        if (!this.layer) {
            this.addVector();
        }
        let _clusterSource = new ol.source.Cluster({
            distance: this.clusterDistance,
            source: this.featureSource
        });
        this.layer.setSource(_clusterSource);
        //设置图层样式
        this.layer.setStyle((feature) => {
            return this.setClusterStyle(feature);
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
        //zoom<=15 级 为聚合图层
        if (zoom % 1 === 0) {
            if ((zoom <= 15) && !isCluserSource) {
                this.addClusterLayer();
                this.setState({ isCluserSource: true });
            } else if ((zoom > 15) && isCluserSource) {
                this.layer.setSource(this.featureSource);
                this.setState({ isCluserSource: false });
            }
        }
    }
    /**
     * 添加图层
     */
    addVector = () => {
        this.featureSource = new ol.source.Vector();
        return new ol.layer.Vector({
            source: this.featureSource
        });
    }
    /**
     * 加载GPS点位到地图上
     * @param {Array} gpsArr 点位集合
     * @param {Array} coord [经度,纬度]
     * @param {Object} gpsInfo 各状态警情的名称、图标信息
     * @param {String} deviceCode GPS的code值
     * gpsArr=[{ coord:[lng, lat], gpsInfo:this.gpsInfo[status], deviceCode:item.DeviceCode}]
     */
    addCustomIcon = (gpsArr) => {
        let gpsFeas = gpsArr.map((item) => {
            let feature = new ol.Feature({
                geometry: new ol.geom.Point(this.props.mapDom.getMapPoint(item.coord[0], item.coord[1])),
                id: item.deviceCode,
                name: item.deviceCode,
                status: item.gpsInfo.name,
                coord: item.coord
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
                        text: item.deviceCode + `（${item.gpsInfo.name}）`,
                        fill: new ol.style.Fill({ color: '#00f' })
                    })
                })
            );
            feature.setId(item.deviceCode);
            return feature;
        });
        this.featureSource.addFeatures(gpsFeas);
    }
    /**
     * 循环初始化的GPS信息, 加载元素并累加总数
     * @param {Array} data GPS信息
     */
    loadFeature = (data) => {
        const { statusData } = this.state;
        let gpsArr = [];
        //将每个点位添加到地图上
        data.forEach((item) => {
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
                    lat
                };
                statusData[item.DeviceCode] = itemData;
                gpsArr.push({ coord: [lng, lat], gpsInfo: this.gpsInfo[status], deviceCode: item.DeviceCode });
            }
        });
        //添加到地图上
        this.addCustomIcon(gpsArr);

        this.setState({ statusData });
        // 判断是否聚合 <=15级为聚合  g05047  20181107
        let _zoom = this.map.getView().getZoom();
        if (_zoom && _zoom <= 15) {
            //加载聚合图层
            this.addClusterLayer();
        }
        this.map.addLayer(this.layer);
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
        });
    }
    /**
     * 建立websocket连接，接收推送的GPS
     */
    onWebsocket = () => {
        let mapIp = this.props.mapDom.getMapIp();
        if (!mapIp) {
            return;
        }
        var ws = new WebSocket(`ws://${mapIp}:8097/api/notice/ws`);
        ws.onopen = () => {
            ws.send('Hello WebSockets!');
        };
        ws.onmessage = (evt) => {
            if (!this.mapIsMove) {
                this.opreateMsg(JSON.parse(evt.data));
            }
        };
        ws.onclose = () => {
        };
        ws.onerror = function () {
        };
    }
    /**
     * 根据推送接收到的信息进行不同操作
     */
    opreateMsg = (data) => {
        let type = data.Sub;
        let message = JSON.parse(data.Msg);
        //G0 移动坐标或新增GPS
        if (type === 'G0') {
            this.moveIcon(message);
            return;
        }
        //  G1 在线、离线变化  修改图标
        if (type === 'G1') {
            this.modifyIcon(message);
            return;
        }
        //G2 删除
        if (type === 'G2') {
            this.deleteIcon(message.Code);
            return;
        }
        //G3 修改信息,刷新图层
        if (type === 'G3') {
            this.changeStatus(message.DeviceCode, 'update', {
                name: message.DeviceName
            });
            return;
        }
        //G4 增加图标
        if (type === 'G4') {
            return;
        }
        //G5 改变模式
        if (type === 'G5') {
            //Perform = 0 性能模式/Realtime = 1 实时模式/  Force = 2 强制刷新
            //现在所有点位都是强制刷新模式，所以不作处理
            return;
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
        let features = this.featureSource.getFeatures();
        return features.find((item) => item.getId() === code);
    }
    /**
     * G0 移动点位或新GPS上线
     * @param {Object} message GPS信息
     */
    moveIcon = (message) => {
        let fea = this.findFeature(message.Code);
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
            let lng = message.Lng;
            let lat = message.Lat;
            if ((180 >= lng && -180 <= lng) && (85 >= lat && -85 <= lat)) {
                let itemData = {
                    status: '10',
                    code: message.Code,
                    name: message.Code,
                    time: message.Time,
                    lng: message.Lng,
                    lat: message.Lat
                };
                this.changeStatus(message.Code, 'add', itemData);
                //添加到地图上
                this.addCustomIcon([{ coord: [lng, lat], gpsInfo: this.gpsInfo['10'], deviceCode: message.Code }]);
                //传出数据
                this.exprtData();
            }
        }
    }
    /**
     * G2 删除点位
     * @param {String} code GPS的code值
     */
    deleteIcon = (code) => {
        //根据code找到要删除的Feature并在地图上删除
        let fea = this.findFeature(code);
        fea && this.featureSource.removeFeature(fea);
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
        let fea = this.findFeature(message.DeviceCode);
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
                    text: message.DeviceCode + `（${gpsInfo.name}）`,
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
        return null;
    }
}
