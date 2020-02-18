import React, { Component } from 'react';
import ol from 'openlayers';
import ReactDOM from 'react-dom';
import { getTollgateCamera, getTollgateVideo, startTollgateVideo } from './GlobalFunc';
import $ from 'jquery';
import axios from 'axios';
/**
 * 卡口右键菜单组件
 * props {
 *  @param {Object} mapDom map组件ref
 * }
 */
export default class TollgateMenu extends Component {
    constructor(props) {
        super(props);
        this.map = null; //地图实例
        this.overlay = null;  //邮件菜单
        this.featureInfo = null; //当前右键的点位元素
        this.marCoord = null; //当前右键点击的火星坐标
        this.setTimeoutFunc = null; //定时
    }
    componentDidMount(){
        const { mapDom } = this.props;
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
        if(zoom <= 15 || 'tollgate' !== feature.get('markerType')){
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
     * 启动
     */
    startClick = () => {
        const {  MarkerCode, DeviceCode, DeviceName, MarkerName } = this.featureInfo;
        //卡口摄像机
        let videoMarker = [];
        //卡口相机
        let cameraMarker = [];
        let request = [
            getTollgateVideo(DeviceCode || MarkerCode, (data) => videoMarker = data),
            getTollgateCamera(DeviceCode || MarkerCode, (data) => cameraMarker = data)
        ];
        axios.all(request).then(axios.spread(() => {
            startTollgateVideo(DeviceCode || MarkerCode, DeviceName || MarkerName, videoMarker, cameraMarker);
        }));
    }
    /**
     * 加载右键菜单
     */
    loadDom = () => {
        return (
            <ul>
                <li onClick={this.startClick}>启动</li>
            </ul>
        );
    }
    render() {
        return null;
    }
}