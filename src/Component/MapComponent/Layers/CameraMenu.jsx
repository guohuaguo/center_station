import React, { Component } from 'react';
import { Popover, Modal } from 'antd';
import ol from 'openlayers';
import ReactDOM from 'react-dom';
import { livePlayVideo, playBackVideo, downloadVideo, livePlayGridTrace, playBackGridTrace,
    camerasDocument, getCameraType, quickPlayCamera } from './GlobalFunc';
import { getSortFeatures } from './SortFeatures';
import $ from 'jquery';
//实况网络追踪弹框的监听
window.MapTsmiStartGridTrace = '';
//回放网络追踪弹框的监听
window.MapTsmiStartVodGridTrace = '';
/**
 * 摄像机右键菜单组件
 * props {
 *  @param {Object} mapDom map组件ref
 *  @param {Array} layers 摄像机分类的所有图层
 * }
 */
export default class CameraMenu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false, //是否打开一机一档弹框
            modalDetails: {}  //一机一档弹框
        };
        this.quickPlayList = [5, 10, 15, 30, 60];  //快捷回放菜单
        this.map = null; //地图实例
        this.overlay = null;  //右键菜单
        this.featureInfo = null; //当前右键的点位元素
        this.marCoord = null; //当前右键点击的火星坐标
        this.cameraOfGridTrace = [];  //用于网格追踪的相机（最多6个）
        this.lineVectorLayer = null;  //网格追踪连线图层
        this.setTimeoutFunc = null;  //定时
    }
    componentDidMount(){
        const { mapDom } = this.props;
        this.listenWindowEvent();
        this.map = mapDom.getBaseMap();
        this.map.on('click', () => {
            //单击时，如果右键菜单存在，则移除
            //setTimeout延迟是为了单击菜单项时，先完成菜单功能后，再移除
            this.setTimeoutFunc = setTimeout(() => {
                if(this.overlay){
                    this.map.removeOverlay(this.overlay);
                    this.overlay = null;
                }
                clearTimeout(this.setTimeoutFunc);
            }, 0);
        });
        //右键
        $(this.map.getViewport()).on('contextmenu', (e) => {
            if(this.overlay){
                this.map.removeOverlay(this.overlay);
                this.overlay = null;
            }
            //在点击时获取像素区域
            let pixel = this.map.getEventPixel(e.originalEvent);
            //坐标
            let coordinate = this.map.getEventCoordinate(e);
            //火星坐标
            this.marCoord = mapDom.getMapLngLat(coordinate);
            this.map.forEachFeatureAtPixel(pixel, (feature) => {
                //像素区域内点位密集时，避免出现多个右键菜单
                if(this.overlay){
                    return;
                }
                //设置弹出框内容，可以HTML自定义
                this.contextmenu(coordinate, feature);
            });
        });
    }
    componentWillUnmount(){
        this.setTimeoutFunc && clearTimeout(this.setTimeoutFunc);
    }
    /**
     * 加载右键菜单到地图上
     * @param {Array} coordinate 地图坐标
     * @param {Object} feature 点位元素
     */
    contextmenu = (coordinate, feature) => {
        let zoom = this.map.getView().getZoom();
        if(zoom <= 15 || 'camera' !== feature.get('markerType')){
            return;
        }
        //点位元素
        this.featureInfo = JSON.parse(feature.get('markerData')) || {};
        let divDom = document.createElement('div');
        divDom.setAttribute('class', 'MC-right-menu');
        //右键菜单
        this.overlay = new ol.Overlay({
            position: coordinate,
            positioning: 'center-center',
            element: divDom,
            stopEvent: false
        });
        ReactDOM.render(
            <React.Fragment>
                {
                    this.loadDom()
                }
            </React.Fragment>,
            divDom);
        this.map.addOverlay(this.overlay);
    }
    /**
     * 绑定网格追踪的window监听事件
     */
    listenWindowEvent = () => {
        Object.defineProperty(window, 'MapTsmiStartGridTrace', {
            get:  (data) => data,
            set:  (data) => this.dealListener(data, 'livePlay')
        });
        Object.defineProperty(window, 'MapTsmiStartVodGridTrace', {
            get:  (data) => data,
            set:  (data) => this.dealListener(data, 'playBack')
        });
    }
    /**
     * 监听不同的操作方式，进行不同操作
     */
    dealListener = (data, type) => {
        let ary = data.split('=');
        //关闭弹框后，清除连线
        if(data.startsWith('close')){
            this.clearMapLine();
        }else if(data.startsWith('point') && ary[1]){
            //右键相机定位
            this.setMapCenter(...ary[1].split(','));
        }else if(data.startsWith('CameraMessage') && ary[1]){
            //双击重新进行网格追踪
            this.getNewCamerasAry(ary[1], type);
        }
    }
    /**
     * 双击网格追踪中的相机，再次以此为中心，找6个点
     */
    getNewCamerasAry = (cameraCode, type) => {
        this.featureInfo = {};
        this.cameraOfGridTrace.some((item) => {
            if(cameraCode === item.CameraCode){
                this.featureInfo = {
                    DeviceCode: item.CameraCode,
                    DeviceName: item.CameraName,
                    Lng: item.Lng,
                    Lat: item.Lat
                };
                return true;
            }
        });
        if('livePlay' === type){
            this.livePlayGridTrace();
            return;
        }
        if('playBack' === type){
            this.playBackGridTrace(true);
            return;
        }
    }
    /**
     * 清除连线图层
     */
    clearMapLine = () => {
        if(this.lineVectorLayer){
            this.map.removeLayer(this.lineVectorLayer);
        }
    }
    /**
     * 加载网格追踪连线
     */
    addMapLine = () => {
        this.clearMapLine();
        let allLineArr = [];
        let nowPoint = this.cameraOfGridTrace[0];
        //划线前将主相机定位到地图中心点
        this.setMapCenter(nowPoint.Lng, nowPoint.Lat);
        let nowPosition = this.map.getMapPoint(nowPoint.Lng, nowPoint.Lat);
        this.cameraOfGridTrace.slice(1).forEach((item) => {
            allLineArr.push({
                coordArr: [nowPosition, this.map.getMapPoint(item.Lng, item.Lat)],
                lineStyle: this.lineStyleFun()
            });
        });
        //创建vector图层
        this.lineVectorLayer = this.map.createVectorLayer({ zIndex: 100 });
        //创建线
        let lineSymbol = this.map.createLine(allLineArr);
        //将点添加到图层
        this.lineVectorLayer.getSource().addFeatures(lineSymbol);
        //将图层添加给地图对象
        this.map.addLayer(this.lineVectorLayer);
    }
    /**
     * 连线样式
     */
    lineStyleFun = () => {
        return  {
            stroke:{
                color:'#6AD1EA',
                width: 2
            },
            text:{
                //文本内容
                font: 'normal 14px 微软雅黑',
                //对齐方式
                textAlign: 'center',
                //文本基线
                textBaseline: 'middle',
                offsetX: 0,
                offsetY: 0
            }
        };
    }
    /**
     * 获取包含当前点位的最近6个点位摄像机
     */
    getNearPoint = (ifCheck) => {
        const { DeviceCode, DeviceName, Lng, Lat } = this.featureInfo;
        const { layers, mapDom } = this.props;
        let params = {
            mapDom,
            layers: Object.values(layers),
            nowCoordinate: Lng && Lat ? [Lng, Lat] : this.marCoord,
            num: 6
        };
        if(ifCheck){
            Object.assign(params, { checkCondition: (item) => item.offset && 0 === item.offset[0] });
        }
        let data = getSortFeatures(params);
        this.cameraOfGridTrace = [{
            CameraCode: DeviceCode,
            CameraName: DeviceName,
            Lng: Lng || this.marCoord[0],
            Lat: Lat || this.marCoord[1]
        }];
        data.some((item) => {
            if(item.DeviceCode !== DeviceCode){
                this.cameraOfGridTrace.push({
                    CameraCode: item.DeviceCode,
                    CameraName: item.DeviceName,
                    Lng: item.Lng,
                    Lat: item.Lat
                });
            }
            if(6 === this.cameraOfGridTrace.length){
                return true;
            }
        });
        return this.cameraOfGridTrace;
    }
    /**
     * 实况网格追踪
     */
    livePlayGridTrace = () => {
        livePlayGridTrace({
            Items: this.getNearPoint(true),
            count: 6
        });
        this.addMapLine();
    }
    /**
     * 回放网格追踪
     */
    playBackGridTrace = (playBack) => {
        playBackGridTrace({
            Items: this.getNearPoint(),
            count: 6
        }, true === playBack);
        this.addMapLine();
    }
    /**
     * 定位选择的相机位置为地图中心点位
     */
    setMapCenter = (lng, lat) => {
        const { mapDom } = this.props;
        if(null === lng || null === lat){
            return;
        }
        let position = mapDom.getMapPoint(lng - 0, lat - 0);
        this.map.getView().setCenter(position);
    }
    /**
     * 实况
     */
    livePlayVideoClick = () => {
        const { DeviceCode, DeviceName } = this.featureInfo;
        livePlayVideo(DeviceCode, DeviceName);
    }
    /**
     * 回放
     */
    playBackVideoClick = () => {
        const { DeviceCode, DeviceName } = this.featureInfo;
        playBackVideo(DeviceCode, DeviceName);
    }
    /**
     * 快捷回放
     */
    quickPlayClick = (minute) => {
        const { DeviceCode, DeviceName } = this.featureInfo;
        quickPlayCamera(DeviceCode, DeviceName, minute);
    }
    /**
     * 下载录像
     */
    downloadVideo = () => {
        const { DeviceCode, DeviceName } = this.featureInfo;
        downloadVideo(DeviceCode, DeviceName);
    }
    /**
     * 详细属性
     */
    detailClick = () => {
        const { DeviceCode } = this.featureInfo;
        getCameraType(DeviceCode);
    }
    /**
     * 一机一档信息
     */
    camerasDocumentClick = () => {
        const { DeviceCode } = this.featureInfo;
        this.setState({
            visible: true
        }, () => {
            camerasDocument(DeviceCode, (modalDetails) => {
                this.setState({
                    modalDetails
                });
            });
        });
    }
    /**
     * 关闭一机一档弹框
     */
    closeModal = () => {
        this.setState({
            visible: false
        });
    }
    /**
     * 加载右键菜单
     */
    loadDom = () => {
        return (
            <ul>
                <li onClick={this.livePlayVideoClick}>实况</li>
                <li onClick={this.playBackVideoClick}>回放</li>
                <Popover
                    overlayClassName="MC-right-menu"
                    getPopupContainer={() => document.getElementById('cameraQuickPlayBtn')}
                    placement="rightTop"
                    trigger="hover"
                    content={
                        <ul>
                            {
                                this.quickPlayList.map((item, index) =>
                                    <li key={index} onClick={() => this.quickPlayClick(item)} >{`${item}分钟`}</li>
                                )
                            }
                        </ul>
                    }
                >
                    <li id="cameraQuickPlayBtn">快捷回放</li>
                </Popover>
                <li onClick={this.livePlayGridTrace}>实况网格追踪</li>
                <li onClick={this.playBackGridTrace}>回放网格追踪</li>
                <li onClick={this.downloadVideo}>下载录像</li>
                <li onClick={this.detailClick}>详细属性</li>
                <li onClick={this.camerasDocumentClick}>一机一档信息</li>
            </ul>
        );
    }
    render() {
        const { visible, modalDetails } = this.state;
        return (
            <Modal
                title="一机一档信息"
                visible={visible}
                width={1000}
                style={{ top: 'calc(50% - 280px)' }}
                className={'EWC-modal EWC-cameras-document'}
                footer={null}
                onCancel={this.closeModal}
            >
                <div style={{ display: 'flex' }}>
                    <div style={{ width: 290 }}>
                        <div className="EWC-details">
                            <div>
                                <span>设备名称：</span>
                                <span title={modalDetails.SBMC}>{modalDetails.SBMC}</span>
                            </div>
                            <div>
                                <span>联网属性：</span>
                                <span>{modalDetails.LWSX}</span>
                            </div>
                            <div>
                                <span>设备编码：</span>
                                <span>{modalDetails.SBBM}</span>
                            </div>
                            <div>
                                <span>设备厂商：</span>
                                <span title={modalDetails.SBCS}>{modalDetails.SBCS}</span>
                            </div>
                            <div>
                                <span>设备类型：</span>
                                <span>{modalDetails.SBXH}</span>
                            </div>
                            <div>
                                <span>补光属性：</span>
                                <span>{modalDetails.BGSX}</span>
                            </div>
                            <div>
                                <span>编码格式：</span>
                                <span>{modalDetails.SXJBMGS}</span>
                            </div>
                            <div>
                                <span>MAC地址：</span>
                                <span>{modalDetails.MACDZ}</span>
                            </div>
                        </div>
                    </div>
                    <span className="EWC-vertical-line"></span>
                    <div style={{ width: 525 }}>
                        <div className="EWC-title">基本信息</div>
                        <div className="EWC-details">
                            <ul>
                                <li>
                                    <span>行政区域：</span>
                                    <span title={modalDetails.XZQY}>{modalDetails.XZQY}</span>
                                </li>
                                <li>
                                    <span>监控点位类型：</span>
                                    <span>{modalDetails.JKDWLX}</span>
                                </li>
                            </ul>
                            <ul>
                                <li>
                                    <span>设备型号：</span>
                                    <span title={modalDetails.SBXH}>{modalDetails.SBXH}</span>
                                </li>
                                <li>
                                    <span>点位俗称：</span>
                                    <span title={modalDetails.DWSC}>{modalDetails.DWSC}</span>
                                </li>
                            </ul>
                            <ul>
                                <li>
                                    <span>摄像机类型：</span>
                                    <span title={modalDetails.SXJLX}>{modalDetails.SXJLX}</span>
                                </li>
                                <li>
                                    <span>摄像机功能类型：</span>
                                    <span title={modalDetails.SXJGNLX}>{modalDetails.SXJGNLX}</span>
                                </li>
                            </ul>
                            <ul>
                                <li>
                                    <span>IPV4地址：</span>
                                    <span title={modalDetails.IPV4}>{modalDetails.IPV4}</span>
                                </li>
                                <li>
                                    <span>IPV6地址：</span>
                                    <span title={modalDetails.IPV6}>{modalDetails.IPV6}</span>
                                </li>
                            </ul>
                        </div>
                        <div className="EWC-title">位置属性</div>
                        <div className="EWC-details">
                            <ul>
                                <li>
                                    <span>安装地址：</span>
                                    <span title={modalDetails.AZDZ}>{modalDetails.AZDZ}</span>
                                </li>
                                <li>
                                    <span>摄像机位置类型：</span>
                                    <span title={modalDetails.SXJWZLX}>{modalDetails.SXJWZLX}</span>
                                </li>
                            </ul>
                            <ul>
                                <li>
                                    <span>经度：</span>
                                    <span>{modalDetails.JD}</span>
                                </li>
                                <li>
                                    <span>纬度：</span>
                                    <span>{modalDetails.WD}</span>
                                </li>
                            </ul>
                            <div>
                                <span>摄像机监控方位：</span>
                                <span>{modalDetails.JSFW}</span>
                            </div>
                        </div>
                        <div className="EWC-title">管理属性</div>
                        <div className="EWC-details">
                            <ul>
                                <li>
                                    <span>所属辖区公安机关：</span>
                                    <span title={modalDetails.SSXQGAJG}>{modalDetails.SSXQGAJG}</span>
                                </li>
                                <li>
                                    <span>安装时间：</span>
                                    <span>{modalDetails.AZSJ}</span>
                                </li>
                            </ul>
                            <ul>
                                <li>
                                    <span>管理单位：</span>
                                    <span title={modalDetails.GLDW}>{modalDetails.GLDW}</span>
                                </li>
                                <li>
                                    <span>管理单位联系方式：</span>
                                    <span>{modalDetails.GLDWLXFS}</span>
                                </li>
                            </ul>
                            <ul>
                                <li>
                                    <span>录像保存天数：</span>
                                    <span>{modalDetails.LXBCTS}</span>
                                </li>
                                <li>
                                    <span>设备状态：</span>
                                    <span>{modalDetails.SBZT}</span>
                                </li>
                            </ul>
                            <div>
                                <span>所属部门行业：</span>
                                <span title={modalDetails.SSBMHY}>{modalDetails.SSBMHY}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}