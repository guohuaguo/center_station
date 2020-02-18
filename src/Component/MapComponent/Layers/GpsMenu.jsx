import React, { Component } from 'react';
import ol from 'openlayers';
import ReactDOM from 'react-dom';
import { Button, Modal, DatePicker } from 'antd';
import { livePlayVideo, getGpsRecord } from './GlobalFunc';
import UnvMap from '../../Map/UnvMapWithoutVM';
import PathQuery from '../Business/PathQuery';
import moment from 'moment';
import trackGpsStart from '../Image/trackGpsStart.png';
import trackEnd from '../Image//trackEnd.png';
import { getDistance } from './SortFeatures';
import $ from 'jquery';
import { message } from 'antd';
/**
 * GPS右键菜单组件
 * props {
 *  @param {Object} mapDom map组件ref
 * }
 */
export default class GpsMenu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,  //轨迹弹框是否可见
            modalMap: null,  //轨迹地图对象
            coordsData: [],  //轨迹点位数据
            startTime: moment().format('YYYY-MM-DD 00:00:00'),  //开始时间
            endTime: moment().format('YYYY-MM-DD 23:59:59')   //结束时间
        };
        this.map = null; //地图实例
        this.overlay = null;  //邮件菜单
        this.featureInfo = null; //当前右键的点位元素
        this.marCoord = null; //当前右键点击的火星坐标
        //轨迹样式
        this.trackStyle = {
            startImage: trackGpsStart,             //起点图标
            endImgae: trackEnd,                    //终点图标
            startAnchor: [0.5, 0.5],               //起点图标偏移量
            endAnchor: [0.5, 0.5],                 //终点图标偏移量
            isNotDynamic: true,                    //不需要动画
            routeColor: '#3BA6EC',                 //线的颜色
            routeWidth: 3                          //线的宽度
        };
        this.setTimeoutFunc = null;  //定时
    }
    componentDidMount() {
        const { mapDom } = this.props;
        this.map = mapDom.getBaseMap();
        this.map.on('click', () => {
            //单击时，如果右键菜单存在，则移除
            //setTimeout延迟是为了单击菜单项时，先完成菜单功能后，再移除
            this.setTimeoutFunc = setTimeout(() => {
                if (this.overlay) {
                    this.map.removeOverlay(this.overlay);
                    this.overlay = null;
                }
                clearTimeout(this.setTimeoutFunc);
            }, 0);
        });
        //右键
        $(this.map.getViewport()).on('contextmenu', (e) => {
            if (this.overlay) {
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
                if (this.overlay) {
                    return;
                }
                //设置弹出框内容，可以HTML自定义
                this.contextmenu(coordinate, feature);
            });
        });
    }
    componentWillUnmount() {
        this.setTimeoutFunc && clearTimeout(this.setTimeoutFunc);
    }
    /**
     * 加载右键菜单到地图上
     * @param {Array} coordinate 地图坐标
     * @param {Object} feature 点位元素
     */
    contextmenu = (coordinate, feature) => {
        let zoom = this.map.getView().getZoom();
        if (zoom <= 15 || 'gps' !== feature.get('markerType')) {
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
     * 实况
     */
    realityVideoClick = () => {
        const { PlayliveCode, DeviceName } = this.featureInfo;
        if (!PlayliveCode) {
            message.info('未绑定摄像机', 1);
            // Log.info(DeviceName + '未绑定摄像机');
            return;
        }
        livePlayVideo(PlayliveCode, DeviceName);
    }
    /**
     * 点位过滤
     */
    checkPoints = (records) => {
        let length = records.length;
        //第一个点与最后一个点无论是否符合均保留 所以点位过少，直接返回
        if (length < 3) {
            return records;
        }
        let firstPoint = records[0];
        let pointsAry = [firstPoint];
        let lastPoint = records[length - 1];
        let oldLng = firstPoint.Position.Lng;
        let oldLat = firstPoint.Position.Lat;
        let timeInterval = (moment(lastPoint.ConnectTime).unix() - moment(firstPoint.ConnectTime).unix()) / (24 * 60 * 60);
        let dis = 10;
        if (timeInterval <= 7) {
            dis = 10;
        } else if (timeInterval > 7 && timeInterval <= 30) {
            dis = 30;
        } else if (timeInterval > 30 && timeInterval <= 90) {
            dis = 60;
        } else if (timeInterval > 90 && timeInterval <= 180) {
            dis = 100;
        } else {
            dis = 150;
        }
        records.slice(1, -1).forEach((item) => {
            let nowLng = item.Position.Lng;
            let nowLat = item.Position.Lat;
            //两个点位之间距离小于基准距离时弃掉
            if (getDistance(nowLng, nowLat, oldLng, oldLat) * 1000 < dis) {
                return;
            }
            if (nowLng > 0 && nowLat > 0 && item.ConnectTime) {
                oldLng = nowLng;
                oldLat = nowLat;
                //保留经过筛选的点位以及gps信息
                pointsAry.push(item);
            }
        });
        pointsAry.push(lastPoint);
        return pointsAry;
    }
    /**
     * 查看轨迹
     */
    viewTrackClick = () => {
        this.setState({
            visible: true
        }, () => {
            const { DeviceCode, Code } = this.featureInfo;
            const { startTime, endTime } = this.state;
            getGpsRecord(DeviceCode || Code, startTime, endTime, (records) => {
                let coordsData = this.checkPoints(records);
                this.setState({
                    coordsData
                });
            });
        });
    }
    /**
     * 结束时间大于开始时间
     */
    disabledEndDate = (endValue) => {
        const { startTime } = this.state;
        return endValue.valueOf() <= moment(startTime).valueOf();
    }
    /**
     * 开始时间小于结束时间
     */
    disabledStartDate = (startValue) => {
        const { endTime } = this.state;
        return startValue.valueOf() >= moment(endTime).valueOf();
    }
    /**
     * 加载右键菜单
     */
    loadDom = () => {
        return (
            <ul>
                <li onClick={this.realityVideoClick}>实况</li>
                <li onClick={this.viewTrackClick}>查看轨迹</li>
            </ul>
        );
    }
    /**
     * 弹框关闭触发
     */
    closeModal = () => {
        //恢复默认查询条件
        this.setState({
            visible: false,
            startTime: moment().format('YYYY-MM-DD 00:00:00'),
            endTime: moment().format('YYYY-MM-DD 23:59:59'),
            coordsData: [] //轨迹点位信息
        });
    }
    /**
     * 搜索条件改变触发
     * @param {String} type 改变的类型
     * @param {String} value 改变后的值
     */
    changeValue = (type, value) => {
        this.setState({
            [type]: value
        });
    }
    /**
     * 地图组件加载完成后触发
     */
    loadModalMap = () => {
        this.setState({
            modalMap: this.modalMapDom.getBaseMap()
        });
    }
    render() {
        const { modalMap, coordsData, startTime, endTime, visible } = this.state;
        return (
            <Modal
                title="查看轨迹"
                visible={visible}
                width={1000}
                style={{ top: 'calc(50% - 325px)' }}
                className={'EWC-modal EWC-track'}
                footer={null}
                onCancel={this.closeModal}
            >
                <div className="EWC-form">
                    <div>
                        <label className="EWC-required">开始时间：</label>
                        <DatePicker
                            value={moment(startTime)}
                            showTime
                            format="YYYY-MM-DD HH:mm:ss"
                            dropdownClassName="EWC-data-picker"
                            onChange={(data, dataStr) => this.changeValue('startTime', dataStr)}
                            disabledDate={this.disabledStartDate}
                            disabledTime={this.disabledStartDate}
                            allowClear={false}
                            style={{ width: 170 }}
                        />
                        <label className="EWC-required">结束时间：</label>
                        <DatePicker
                            value={moment(endTime)}
                            showTime
                            format="YYYY-MM-DD HH:mm:ss"
                            dropdownClassName="EWC-data-picker"
                            onChange={(data, dataStr) => this.changeValue('endTime', dataStr)}
                            disabledDate={this.disabledEndDate}
                            disabledTime={this.disabledEndDate}
                            allowClear={false}
                            style={{ width: 170 }}
                        />
                        <Button type="primary" onClick={this.viewTrackClick}>查询</Button>
                    </div>
                </div>
                <div style={{ height: '548px' }}>
                    <UnvMap
                        ref={(self) => this.modalMapDom = self}
                        onMapLoaded={this.loadModalMap}
                    />
                </div>
                {
                    modalMap && <PathQuery options={{ map: modalMap, coordsArray: coordsData, isNotRoad: true, trackStyle: this.trackStyle }} />
                }
            </Modal>
        );
    }
}