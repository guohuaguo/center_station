import React, { Component, Fragment } from 'react';
import UnvMap from './Map/UnvMapWithoutVM'
import { FilterFeature, addTrack } from './MapComponent';
import { Button, Divider, Icon, Radio, Tooltip, message, Input, List, Pagination } from 'antd';
import {
    camera, select, nomapdev, choose, line, rectangle, circle, polygon, cameraCluster32, cameraCluster48,
    cameraCluster64, blueEndPoint, blueMiddlePoint, blueStartPoint, selected
} from './Image/ImgExport';
import lodash from 'lodash'
import './MapFunc.less';
import $ from 'jquery';
import ol from 'openlayers';
import ReactDOM from 'react-dom';
//import { getMapLayer } from './func';
import Axios from 'axios';



const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Search } = Input;

const IconArr = [{
    name: 'LineString',
    src: line
}, {
    name: 'Rectangle',
    src: rectangle
}, {
    name: 'Circle',
    src: circle
}, {
    name: 'Polygon',
    src: polygon
}]

/**
 * 同行分析轨迹上的弹框,点击显示
 * @param {object} data 绘制轨迹每一点的数据
 * @param {string} flag 标识位，标识是画红色轨迹还是蓝色轨迹，这两者的数据格式是不同的
 */
function trailPopup(item, results, index) {
    let SnatchInfo = lodash.find(results, (n) => { return n.cameraID === item.tollgateID })
    return (
        <div id="trailPopup" className="trailPopup" >
            
        </div>
    );

}

export default class Map extends Component {

    constructor(props) {
        super(props);
        // GAServerRestful.loginDebug('loadmin', 'admin_123');
        this.state = {
            // isControlAreaModalShow: false,  //布控区域的地图选择弹出框是否显示，false表示不显示，true表示显示，默认不显示
            chooseMenuVisible: false,       //地图选择按钮是否显示
            drawType: 'None',         //框选类型，一共四种选择，"Circle","Rectangle","Polygon"， "LineString"
            currentSelectd: [],             //当前框选中的卡口
            pointVectorLayer: '',           //当前地图图层
            cameraData: [],                 //外域卡口数据
            currentZoom: 16,                //当前地图显示级别
            currentCenter: [],              //当前地图显示中心位置
            tollgatesList: [],               //卡口编码列表
            tollgates: [],
            isLine: false,
            mapLayer: props.getLayer,                 //图层选择
            height: window.innerHeight - 50,
            map: '',
            getMapPoint: '',
            trackDatas: [],
            track: '',
            isSelect: props.isSelect ? props.isSelect : false,
            left: 340,
            openAble: false,
            top: 10,
            disx: '',
            disy: '',
            searchData: [],
            searchVectorLayer: '',
            current: 1,
            pageSize: 20,
            pageSum: 0,
            searchText: ''
        };
        this.wh = window.innerHeight;
        this.publicPeerPointStyle = {
            textAlign: 'center',
            display: 'inline-block',
            color: '#fff',
            position: 'relative',
            top: '-10px'
        };
        this.overlay = null;//右键菜单
        this.setTimeoutFunc = null; //定时
    }

    componentDidMount() {
        //调接口拿到数据
        const { getDataList } = this.props
        let toll = getDataList ? getDataList : []
        let mapDom = this.map.getBaseMap();
        this.map.getBaseMap().on('moveend', () => {
            this.setState({
                currentZoom: mapDom.getView().getZoom(),
                currentCenter: mapDom.getView().getCenter()
            })
        })

        //要素的事件 'click'、'dblclick'、'singleclick'、'pointermove'、'pointerdrag'
        this.map.getBaseMap().on('click', (event) => {
            //单击时，如果右键菜单存在，则移除
            //setTimeout延迟是为了单击菜单项时，先完成菜单功能后，再移除
            this.setTimeoutFunc = setTimeout(() => {
                if (this.overlay) {
                    mapDom.removeOverlay(this.overlay);
                    this.overlay = null;
                }
                clearTimeout(this.setTimeoutFunc);
            }, 0);
            //根据窗口坐标获取到feature
            let pixel = mapDom.getEventPixel(event.originalEvent);
            let feature = mapDom.forEachFeatureAtPixel(pixel, function (feature) {
                return feature;
            });
            if (feature != undefined) {
                console.info(feature.getProperties())

            }
            // //Dom资源
            // this.popDomHtml = document.createElement('div');
            // this.popDomHtml.style.width = '100px';
            // this.popDomHtml.style.height = '100px';
            // this.popDomHtml.style.background = '#f00';
            // // 显示的内容
            // let popAttr = {
            //     offset: [10, 10]      //偏移量
            // };
            // //创建popup
            // this.popUp = mapDom.createPopup(popAttr);
            // // 添加
            // mapDom.addOverlay(this.popUp);
            // //取得地图实际坐标
            // let geometry = feature.getGeometry();
            // let coordinate = geometry.getCoordinates();
            // this.popDomHtml.innerHTML = feature.get('name');
            // this.popUp.setPosition(coordinate);
            // this.popUp.setElement(this.popDomHtml);
            // //移除事件
            // UnvMapObj.removeEventListener('singleclick');
        });

        $(mapDom.getViewport()).on('contextmenu', (event) => {
            if (this.overlay) {
                mapDom.removeOverlay(this.overlay)
                this.overlay = null;
            }
            //alert(mapDom.getEventCoordinate(event))
            //根据窗口坐标获取到feature
            let coordinate = mapDom.getEventCoordinate(event)
            let pixel = mapDom.getEventPixel(event.originalEvent);
            let feature = mapDom.forEachFeatureAtPixel(pixel, function (feature) {
                return feature;
            });
            //设置弹出框内容，可以HTML自定义
            if (feature != undefined) {
                this.contextMenu(coordinate, feature.getProperties())
            }
        })

        typeof (window.ExcuteUiFunction) === 'function' && this.platformLogin()

    }

    //创建右键菜单
    contextMenu = (coordinate, featureInfo) => {
        let mapDom = this.map.getBaseMap(), zoom = mapDom.getView().getZoom();
        if (zoom <= 15) {
            return;
        }
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
                <ul style={{ background: 'white', color: 'black', border: '1px solid #bfbfbf', zIndex: 1 }}>
                    <li style={{ textAlign: 'center', zIndex: 1 }} onClick={() => this.videoPlay(featureInfo)}>视频播放</li>
                </ul>
            </React.Fragment>,
            divDom);
        mapDom.addOverlay(this.overlay);
    }

    videoPlay = (featureInfo) => {
        let pId = featureInfo.tollgateID;
        let id = '';
        if (!pId) {
            alert("请输入视频播放ID")
            return;
        }
        let axiosData = {
            url: 'http://33.112.24.32:7022/VIAP/api/adg/devicetransform',
            method: 'GET',
            params: {
                sbbm: pId
            }
        }
        Axios(axiosData).then(ret => {
            let data = ret.data
            if (data.rtn === 0) {
                id = data.message
                if (id) {
                    let ret = window.ExcuteUiFunction("VideoPlay", "0", id);
                    if (ret) {
                        if (JSON.parse(ret).RetData !== '0') {
                            alert('播放失败')
                        }
                    }
                }
            } else {
                message.error('转换失败')
            }
        }).catch(rej => {
            console.log(rej)
        })

    }

    platformLogin = () => {
        let pParams = '33.120.249.228|6666|xiezhang@yj.wz|123456';
        let ret = window.ExcuteUiFunction("LoadPlatform", "0", pParams);
    }

    componentWillReceiveProps(nexProps) {
        let { getDataList, trackData, alarmData } = nexProps;
        let toll = getDataList ? getDataList : []
        if (trackData && trackData.length > 0 && this.props.trackData !== nexProps.trackData) {
            this._drowOriginTrack(trackData.sort(this.ownSort), true)
        } else if (trackData && trackData.length === 0 && this.state.trackDatas.length !== 0) {
            this._drowOriginTrack(trackData, false)
        }
        if (alarmData && alarmData.longitude > 0 && alarmData.latitude > 0) {
            let mapDom = this.map.getBaseMap()
            let marsPoint = mapDom.getWGS2Mars(parseFloat(alarmData.longitude), parseFloat(alarmData.latitude))
            mapDom.getView().setCenter(mapDom.getMapPoint(marsPoint[0], marsPoint[1]))
            this.setState({
                currentCenter: [marsPoint[0], marsPoint[1]]
            })
        }
        this.setState({
            tollgates: toll,
            mapLayer: nexProps.getLayer || [],
            trackDatas: trackData
        }, () => {
            this.onMapLoaded();
        })

    }
    componentWillUpdate(nextProps, nextState) {
    }

    componentWillUnmount() {
        this.setTimeoutFunc && clearTimeout(this.setTimeoutFunc);
    }

    //#region 地图加载
    onMapLoaded = () => {
        let { tollgates, drawType, currentZoom, currentCenter } = this.state;
        let that = this;
        let map = that.map.getBaseMap();
        this.setState({
            map: map
        });
        //   获取地图对象
        if (!this.map) {
            return;
        }
        this.drawMapPoint(tollgates, currentZoom, currentCenter, drawType)

    }

    drawMapPoint = (tollgates, currentZoom, currentCenter, drawType) => {
        const { isRegion } = this.props
        let UnvMapObj = this.map.getBaseMap();
        //   创建vector图层
        let pointVectorLayer = UnvMapObj.createVectorLayer();
        this.setState({
            pointVectorLayer: pointVectorLayer
        });
        let tmpList = [];
        console.log(tollgates)
        tollgates && tollgates.length > 0 && tollgates.map((item) => {
            let iconObj = this.judgeType(currentZoom, item.name)
            let marsPoint = UnvMapObj.getWGS2Mars(parseFloat(item.longitude), parseFloat(item.latitude))
            tmpList.push({
                coord: (UnvMapObj.getMapPoint(parseFloat(marsPoint[0]), parseFloat(marsPoint[1]))),
                pointAttr: { name: item.name, tollgateID: item.tollgateID },
                pointStyle: {
                    image: {
                        //控制标注图片和文字之间的距离
                        anchor: [0.5, 0],
                        //标注样式的起点位置
                        anchorOrigin: 'bottom-right',
                        anchorXUnits: 'fraction',
                        //Y方向单位：像素
                        anchorYUnits: 'pixels',
                        crossOrigin: 'anonymous',
                        //偏移起点位置的方向
                        offsetOrigin: 'center',
                        offset: [0, 0],
                        //透明度
                        opacity: 0.8,
                        //标注图标大小
                        scale: 1,
                        //图片路径
                        src: iconObj.src,
                        size: iconObj.size
                    },
                    text: iconObj.text
                }
            });
        });
        //   创建点
        let pointSymbol = UnvMapObj.createPoint(tmpList);

        this.state.pointVectorLayer.getSource().clear()
        //   将点添加到图层
        pointVectorLayer.getSource().addFeatures(pointSymbol);
        //   将图层添加给地图对象
        UnvMapObj.addLayer(pointVectorLayer);

        // if (isRegion) 
        {
            // 1.点位转换函数
            let getMapPoint = UnvMapObj.getMapPoint;
            // 4.框选框选出指定图层上的数据
            let options = {
                map: UnvMapObj, //地图对象
                featureLayer: pointVectorLayer, //指定的图层
                drawType: drawType,
                getMapPoint: getMapPoint,  //经纬度转地图坐标
                callBack: (result) => {
                    this.mapSelectCallBack(result);
                } //回调函数返回框选的要素[]
            };
            FilterFeature.selectFeatures(options);
        }
    }
    //#endregion

    //#region 画轨迹
    _drowOriginTrack = (data, isLine) => {
        const { results } = this.props
        let changePointData = [];
        data.forEach((item, index) => {
            if (item.longitude !== null && item.latitude !== null) {
                let size = index.toString().length;
                let common = index !== 0 && index !== data.length - 1 ? '16px' : '24px';
                let totalPointStyle = {
                    ...this.publicPeerPointStyle,
                    width: common,
                    height: common,
                    // height:`${32 * size}px`,
                    // width:`${32 * size}px`,
                    background: index === 0 ? `url(${blueStartPoint}) no-repeat` : index === data.length - 1 ? `url(${blueEndPoint}) no-repeat` : `url(${blueMiddlePoint}) no-repeat`,
                    //text: index + 1
                };
                let tempArr = {
                    trigger: 'click',
                    // 获取点位上弹框DOM
                    popupContent: trailPopup(item, results, index),
                    coord: [item.longitude, item.latitude],
                    ConnectTime: item.ConnectTime,
                    pointStyle: totalPointStyle,
                    popupVisible: false,
                    id: `red${index}`
                };
                changePointData.push(tempArr);
            }
        });

        let peerTrackData = [{
            lineArrPoint: changePointData,
            lineStyle: {
                stroke: {
                    color: '#1890ff',
                    width: 2
                }
            }
        }];
        let obj = this.map.getBaseMap(),
            track = obj.createVectorLayer();
        obj.addLayer(track)
        this.setState({
            track
        })
        if (data.length > 0) {
            addTrack(peerTrackData, obj, track, isLine);
            if (this.state.track) {
                obj.removeLayer(this.state.track)
            }
        } else {
            addTrack(peerTrackData, obj, this.state.track, isLine);
        }
    }

    ownSort = (a, b) => {
        if (a.ConnectTime <= b.ConnectTime) {
            return -1
        } else {
            return 1
        }
    }
    //#endregion

    //#region 聚合
    judgeType = (currentZoom, num) => {
        let src,
            size,
            text = {
                text: `${num}`,
                fill: {
                    color: 'white'
                },
                textAlign: 'center'
            };
        if (currentZoom <= 15) {
            switch (true) {
                case num >= 10000:
                    src = cameraCluster64
                    size = [64, 64]
                    text = {
                        ...text,
                        offsetY: -32
                    }
                    break;
                case num < 10000 && num >= 1000:
                    src = cameraCluster48
                    size = [48, 48]
                    text = {
                        ...text,
                        offsetY: -24
                    }
                    break;
                case num < 1000:
                    src = cameraCluster32
                    size = [32, 32]
                    text = {
                        ...text,
                        offsetY: -16
                    }
                    break;
                default:
                    break;
            }
        } else {
            src = camera
            //30
            size = [24, 24]
            text = {}
        }
        return {
            src,
            size,
            text
        }
    }

    //#endregion

    //#region 框选


    /**
     * 地图框选回调方法
     */
    mapSelectCallBack = (result) => {
        let newList = [],
            cameraIdList = []

        if (this.state.currentZoom <= 15) {
            return
        }
        if (result) {
            result.map((item, index) => {
                newList.push({
                    coord: [item.getGeometry().getCoordinates()[0], item.getGeometry().getCoordinates()[1]], //投影坐标
                    name: item.getProperties().name,
                    index: index,
                    tollgateID: item.getProperties().tollgateID
                });
                cameraIdList.push({
                    id: item.getProperties().tollgateID,
                    name: item.getProperties().name
                })
            });
        }
        const { getCheckedList, getCameraId } = this.props
        typeof getCheckedList === 'function' && getCheckedList(newList)
        this.setState({
            currentSelectd: newList
        });
        typeof (getCameraId) === 'function' && getCameraId(cameraIdList)

    }

    /**
     * 选择按钮差号调用方法
     */
    closeMenu = () => {
        this.setState({
            chooseMenuVisible: false
        });
    }

    /**
     * 选择按钮点击方法
     */
    showDrawBtn = () => {
        this.setState({
            chooseMenuVisible: true
        });
    }

    /**
     * 修改地图框选样式
     */
    changeDrawType = (e) => {
        let that = this;
        //   获取地图对象
        let UnvMapObj = that.map.getBaseMap();
        let nowZoom = UnvMapObj.getView().getZoom();
        let centerCoord = UnvMapObj.getView().getCenter();

        this.setState({
            drawType: e.target.value,
            currentZoom: nowZoom,
            currentCenter: centerCoord
        }, () => {
            const { drawType, tollgates } = this.state
            this.drawMapPoint(tollgates, nowZoom, centerCoord, drawType)
        });
    }

    checkDrawType = (type) => {
        const { drawType, tollgates, currentZoom, currentCenter } = this.state
        if (type === drawType) {
            this.setState({
                drawType: 'None'
            }, () => {
                this.drawMapPoint(tollgates, currentZoom, currentCenter, 'None')
            })
        } else {
            this.setState({
                drawType: type
            }, () => {
                this.drawMapPoint(tollgates, currentZoom, currentCenter, type)
            })
        }
    }

    /**
     * 地图选择设备清空按钮触发方法
     */
    cleanOutList = (callBack = true) => {
        this.setState({
            currentSelectd: []
        }, () => {
            this.onMapLoaded();
            if (callBack) {
                const { getCheckedList } = this.props
                typeof getCheckedList === 'function' && getCheckedList([])
            }
        });
    }

    /**
     * 地图选择删除设备
     */
    deleteDev = (item, index) => {
        let { currentSelectd } = this.state;
        currentSelectd.splice(index, 1);
        this.setState({
            currentSelectd: currentSelectd
        });
    }
    //#endregion

    //#region 图层
    showLayer = (index, show) => {
        const { mapLayer } = this.state
        const { setLayer } = this.props
        let layer = JSON.parse(JSON.stringify(mapLayer))
        layer[index].layerShow = show
        this.setState({
            mapLayer: layer
        })
        typeof setLayer === 'function' && setLayer(layer)
    }
    //#endregion

    //搜索框可拖拽
    onMouseDown = (event) => {

        if (event.target.id !== 'input') {
            const { left, top } = this.state
            let disx = event.clientX - 200 - left,
                disy = event.clientY - 50 - top,
                that = this;
            document.onmousemove = function (e) {
                let left = e.clientX - 200 - disx,
                    top = e.clientY - 50 - disy,
                    box = document.getElementById('mapsearch'),
                    maxWidth = window.innerWidth - 200 - box.offsetWidth,
                    maxHeight = window.innerHeight - 50 - box.offsetHeight

                that.setState({
                    left: left > 0 ? (left > maxWidth ? maxWidth : left) : 0,
                    top: top > 0 ? (top > maxHeight ? maxHeight : top) : 0
                })
            }

            document.onmouseup = function () {
                document.onmousemove = null;
                document.onmousedown = null;
            }
        }

    }

    //搜索栏收起展开
    setOpen = () => {
        this.setState({
            openAble: !this.state.openAble
        })
    }

    //点位搜索
    pointSearch = (e, offset = 0, limit = 20) => {
        let axiosData = {
            url: 'http://33.112.24.32:7022/VIAP/api/adg/camselect',
            method: 'POST',
            data: {
                keystring: e,
                offset,
                limit,
            }
        }
        Axios(axiosData).then(ret => {
            let data = ret.data
            if (data.rtn === 0) {
                this.setState({
                    searchData: data.results,
                    pageSum: data.total,
                    openAble: true,
                    searchText: e
                })
                this.showData(data.results)
            } else {
                message.error(data.message)
            }
        }).catch(rej => {
            message.error(rej)
        })

    }

    showData = (data) => {
        if (this.state.searchVectorLayer) {
            this.state.searchVectorLayer.getSource().clear()
        }
        let UnvMapObj = this.map.getBaseMap();
        //   创建vector图层
        let searchVectorLayer = UnvMapObj.createVectorLayer({ zIndex: 1 });
        this.setState({
            searchVectorLayer
        });
        let tmpList = [];

        data && data.length > 0 && data.map((item, index) => {
            let text = {
                text: `${index + 1}`,
                fill: {
                    color: 'white'
                },
                textAlign: 'center',
                offsetY: -18
            };
            let marsPoint = UnvMapObj.getWGS2Mars(parseFloat(Number(item.longitude)), parseFloat(Number(item.latitude)))
            console.log(marsPoint)
            tmpList.push({
                coord: (UnvMapObj.getMapPoint(parseFloat(marsPoint[0]), parseFloat(marsPoint[1]))),
                pointAttr: { name: item.name, tollgateID: item.tollgateID },
                pointStyle: {
                    image: {
                        //控制标注图片和文字之间的距离
                        anchor: [0.5, 0],
                        //标注样式的起点位置
                        anchorOrigin: 'bottom-right',
                        anchorXUnits: 'fraction',
                        //Y方向单位：像素
                        anchorYUnits: 'pixels',
                        crossOrigin: 'anonymous',
                        //偏移起点位置的方向
                        offsetOrigin: 'center',
                        offset: [0, 0],
                        //透明度
                        opacity: 0.8,
                        //标注图标大小
                        scale: 1,
                        //图片路径
                        src: select,
                        size: [18, 30]
                    },
                    text
                }
            });
        });
        //   创建点
        let pointSymbol = UnvMapObj.createPoint(tmpList);
        //   将点添加到图层
        searchVectorLayer.getSource().addFeatures(pointSymbol);
        //   将图层添加给地图对象
        UnvMapObj.addLayer(searchVectorLayer);
    }
    //列表点击地图定位
    changePosition = (info) => {
        let mapDom = this.map.getBaseMap()
        mapDom.getView().setZoom(16)
        let marsPoint = mapDom.getWGS2Mars(parseFloat(info.longitude), parseFloat(info.latitude))
        mapDom.getView().setCenter(mapDom.getMapPoint(marsPoint[0], marsPoint[1]))
        this.setState({
            currentCenter: [marsPoint[0], marsPoint[1]]
        })
    }

    //分页
    showChange = (page, pageSize) => {
        this.setState({
            current: page,
            pageSize,
            searchData: []
        })
        this.pointSearch(this.state.searchText, (page - 1) * pageSize, pageSize)
    }

    showSizeChange = (current, size) => {
        this.setState({
            current,
            pageSize: size,
            searchData: []
        })
        this.pointSearch(this.state.searchText, (current - 1) * size, size)
    }

    render() {
        let { chooseMenuVisible, currentSelectd, height, mapLayer, drawType,
            isSelect, left, top, openAble, searchData, pageSize, pageSum, current } = this.state;
        const { isRegion, type } = this.props
        let newLayer = mapLayer.map((item) => {
            return item.count
        })
        let sum = 0
        if (newLayer.length > 0) {
            sum = newLayer.reduce((pre, cur) => {
                return pre + cur
            })
        }
        const paginationProps = {
            simple: true,
            size: 'small',
            pageSize: pageSize,
            current: current,
            total: pageSum,
            showTotal: total => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: this.showChange,
            onShowSizeChange: this.showSizeChange
        }
        return (
            <div className="controlarea-choose-dev" id="Map_Com">
                {
                    isRegion && <div className="controlarea-choose-list">
                        <div className="controlarea-choose-toolbar">
                            <div className="controlarea-choose-list-desc">已选设备：<span></span>{currentSelectd.length}个</div>
                            {
                                isRegion && <Button
                                    onClick={this.cleanOutList}
                                >清空</Button>
                            }
                        </div>
                        {
                            currentSelectd.length > 0 ?
                                <ul className="controlarea-ul-wrapper" style={{ height: `${this.wh * 0.8 - 150}px` }}>
                                    {
                                        currentSelectd.map((item, index) => {
                                            return (
                                                <li className="controlarea-li-show" key={index}>
                                                    <div className="controlarea-div-show">
                                                        {
                                                            index < 9 ?
                                                                <div className="controlarea-show-img">
                                                                    <span className="controlarea-show-num">{index + 1}</span>
                                                                </div>
                                                                :
                                                                <div className="controlarea-show-img">
                                                                    <span className="controlarea-show-num-double">{index + 1}</span>
                                                                </div>
                                                        }
                                                        <span className="controlarea-show-name">{item.name}</span>
                                                        <span
                                                            className="controlarea-show-delete"
                                                            onClick={() => { this.deleteDev(item, index); }}
                                                        ></span>
                                                    </div>
                                                </li>
                                            );
                                        })
                                    }
                                </ul>
                                :
                                <div className="controlarea-devlist-nodev">
                                    <img src={nomapdev} alt="nomapdev" />
                                    <div>您还没选择设备，请选择</div>
                                </div>
                        }
                    </div>
                }
                {
                    isRegion && mapLayer.length > 0 && <ul className="controlarea_layer">
                        <li>{mapLayer.length}个图层 &nbsp;&nbsp;&nbsp; {sum}条记录</li>
                        {
                            mapLayer.map((item, index) => {
                                return <li key={item.layerCode}>
                                    <Tooltip title={item.layerName}>
                                        <span >{item.layerName}
                                            <span style={{ fontSize: 10 }}> ({item.count})</span>
                                        </span>
                                    </Tooltip>
                                    {
                                        !!item.layerShow ? <Icon type="eye" onClick={() => this.showLayer(index, 0)}></Icon> :
                                            <Icon type="eye-invisible" onClick={() => this.showLayer(index, 1)} ></Icon>
                                    }
                                </li>
                            })
                        }
                    </ul>
                }
                <div className="controlarea-choose-map" style={{ height, width: '100%' }}>
                    {
                        isSelect === false && <div className="controlarea-choose-map-wrapper"
                            style={{ left: type === 'home' ? 250 : '', right: type === 'home' ? '' : -68, color: type === 'home' ? 'white' : '' }}
                        >
                            <div className="controlarea-choose-map-btn">
                                <Button style={{ height: 35, background: type === 'home' ? 'rgba(50, 56, 68, 1)' : 'white' }} onClick={this.showDrawBtn}>
                                    <img src={choose} alt="choose" />
                                    选择</Button>
                                <div
                                    className="controlarea-choose-map-btn-box"
                                    style={{
                                        opacity: chooseMenuVisible ? 1 : 0,
                                        background: type === 'home' ? 'rgba(50, 56, 68, 1)' : 'white',
                                        right: type === 'home' ? -84 : 77,
                                        top: type === 'home' ? -40 : ''
                                    }}
                                >
                                    <div className="controlarea-add-control-dropdown">选择</div>
                                    <Icon onClick={this.closeMenu} type="close" />
                                    <Divider />
                                    <div className="controlarea-choose-map-btn-group" >
                                        <div className="controlarea-choose-map_icon">
                                            {
                                                IconArr.map((item, index) => {
                                                    return <div
                                                        className={drawType === item.name ? "controlarea-choose-map_icon-show" : "controlarea-choose-map_icon-noshow"}
                                                        onClick={() => this.checkDrawType(item.name)}
                                                        key={index}
                                                    >
                                                        <img src={item.src} alt={item.name} />
                                                    </div>
                                                })
                                            }
                                        </div>
                                        {/* <RadioGroup
                                            // onChange={this.changeDrawType}
                                            defaultValue="LineString"
                                        >
                                            <RadioButton value="LineString" onClick={() => this.checkDrawType("LineString")}>
                                                <img src={line} alt="line" />
                                            </RadioButton>
                                            <RadioButton value="Rectangle" onClick={() => this.checkDrawType("Rectangle")}>
                                                <img src={rectangle} alt="rectangle" />
                                            </RadioButton>
                                            <RadioButton value="Circle" onClick={() => this.checkDrawType("Circle")}>
                                                <img src={circle} alt="circle" />
                                            </RadioButton>
                                            <RadioButton value="Polygon" onClick={() => this.checkDrawType("Polygon")}>
                                                <img src={polygon} alt="polygon" />
                                            </RadioButton>
                                        </RadioGroup> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                    {
                        isSelect === false && <div className='controlarea-choose-map-search'
                            id='mapsearch'
                            style={{ left, top }}
                            onMouseDown={this.onMouseDown}
                        >
                            <Search placeholder='点位搜索' id='input'
                                style={{ width: 200, margin: '10px 30px 10px 20px', zIndex: 2 }}
                                onSearch={(e) => this.pointSearch(e, (current - 1) * pageSize, pageSize)}
                            ></Search>
                            <a onClick={this.setOpen}>
                                {`${openAble ? '收起' : '展开'}`}<Icon type={openAble ? 'up' : 'down'} ></Icon>
                            </a>
                            <div className='controlarea-choose-map-search-ul'
                                style={{ display: openAble ? 'block' : 'none', height: height / 2 - 100 }}>
                                <Divider></Divider>
                                <List
                                    style={{ display: openAble ? 'block' : 'none' }}
                                    dataSource={searchData}
                                    // pagination={paginationProps}
                                    renderItem={(item, index) => (
                                        <List.Item onClick={() => this.changePosition(item)}
                                        >
                                            <div className='img-box'
                                                style={{
                                                    background: `url(${select}) no-repeat`, width: 18,
                                                    height: 27, textAlign: 'center', color: 'white', fontSize: 10
                                                }}
                                            >{index + 1}</div>
                                            <p title={item.name}>{item.name}</p>
                                            <Icon type='play-circle'
                                                onClick={() => this.videoPlay(item)}
                                                style={{ fontSize: 20, position: 'absolute', right: 10, color: '#8080807a' }}
                                            ></Icon>
                                        </List.Item>
                                    )}
                                >

                                </List>
                                <div style={{ display: 'flex', float: 'right', marginTop: 14 }}>
                                    <span>共{pageSum}条</span>
                                    <Pagination
                                        simple={true}
                                        size={'small'}
                                        pageSize={pageSize}
                                        current={current}
                                        total={pageSum}
                                        showSizeChanger={true}
                                        showQuickJumper={true}
                                        onChange={this.showChange}
                                        onShowSizeChange={this.showSizeChange}
                                    ></Pagination>
                                </div>
                            </div>
                        </div>
                    }
                    <UnvMap ref={(self) => { this.map = self; }} onMapLoaded={this.onMapLoaded} mapServerIp={this.props.mapServerIp} />
                </div>
            </div>
        );
    }
}

