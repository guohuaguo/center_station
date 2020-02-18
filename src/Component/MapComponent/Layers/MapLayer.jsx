import React, { Component } from 'react';
import LayerTree from './LayerTree';
import Gps from './Gps';
import Camera from './Camera';
import Tollgate from './Tollgate';
import Worker from './marker.worker';
import { queryMapType } from './GlobalFunc';
import './layer.less';
/**
 * 地图图层点位数据加载
 * props {
 *  @param {String} className 图层筛选气泡卡片样式
 *  @param {Object} mapDom map组件ref
 *  @param {Array} onlyShowLayerType 限制展示的图层分类类型编码
 *  @param {Array} defaultShow 默认展示的图层分类类型编码
 *  @param {Function} getAllStatus GPS组件各类型总数获取回调
 *  @param {Function} getGpsRef GPS组件ref获取回调
 *  @param {Function} getMapLayer layer图层获取获取回调
 * }
 */
export default class MapLayer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            markers: {}, //摄像机、卡口点位（8500Map服务器）
            mapLayersObj: {}, //地图图层  { type: { code: layer } }
            loadLayerType: {  //图层分类合集(是否加载该类组件、图层分类名称)
                0: {
                    ifLoad: false,
                    name: '摄像机'
                },  //摄像机
                1: {
                    ifLoad: false,
                    name: '卡口'
                },  //卡口
                2: {
                    ifLoad: false,
                    name: '防区'
                },  //防区
                3: {
                    ifLoad: false,
                    name: '全景'
                },  //全景
                4: {
                    ifLoad: false,
                    name: '移动警务'
                },  //移动警务
                5: {
                    ifLoad: false,
                    name: ''
                },  //
                6: {
                    ifLoad: false,
                    name: '自定义'
                },  //自定义
                7: {
                    ifLoad: false,
                    name: '其他'
                }   //其他
            },
            mapType: null  //map服务器类型  8500或9500或''（无服务）
        };
        //各图层分类对应组件
        this.layer = {
            //摄像机
            0 : ({ mapDom, layers, markers, mapType, iconName }) =>
                <Camera
                    key="camera"
                    mapDom={mapDom}
                    layers={layers}
                    mapType={mapType}
                    markers={markers}
                    iconName={iconName}
                />,
            //卡口
            1: ({ mapDom, layers, markers, mapType, iconName }) =>
                <Tollgate
                    key="tollgate"
                    mapDom={mapDom}
                    layers={layers}
                    mapType={mapType}
                    markers={markers}
                    iconName={iconName}
                />,
            //防区
            2: '',
            //全景
            3: '',
            //移动警务
            4: ({ mapDom, getGpsRef, getAllStatus, layers }) =>
                <Gps
                    key="monitorgps"
                    mapDom={mapDom}
                    ref={getGpsRef}
                    getAllStatus={getAllStatus}
                    layers={layers}
                />,
            //
            5: '',
            //自定义
            6: '',
            //其他
            7: ''
        };
        this.iconNameObj = {}; //图层对应点位IconName  { type: { code: IconName } }
        this.domainInfo = {};  //用户信息
        this.ifLoadWorker = false;  //是否已经加载过new Worker()去获取8500点位
    }
    componentWillMount(){
        this.getMapType();
    }
    componentDidMount(){
        const { defaultShow } = this.props;
        const { loadLayerType } = this.state;
        defaultShow.forEach((item) => {
            if(loadLayerType[item]){
                loadLayerType[item].ifLoad = true;
            }
        });
        this.setState({
            loadLayerType
        });
    }
    /**
     * 查询地图类型
     * @param {Function} callback 地图类型获取后的回调
     */
    getMapType = (callback) => {
        const { mapType } = this.state;
        if(null !== mapType){
            if(callback && typeof callback === 'function'){
                callback(this.state.mapType);
            }
            return;
        }
        queryMapType().then((data) => {
            this.setState({
                mapType: data
            });
            if(callback && typeof callback === 'function'){
                callback(data);
            }
        }).catch(() => {

        });
    }
    /**
     * 图层筛选后，根据图层code判断是否加载该图层分类的组件
     * @param {Array} choosedCode 图层code
     */
    getChoosedCode = (choosedCode) => {
        const { mapLayersObj, loadLayerType } = this.state;
        Object.keys(mapLayersObj).forEach((type) => {   // item   layerType
            Object.keys(mapLayersObj[type]).forEach((code) => {   //item1 layerCode
                if(choosedCode.includes(code) && loadLayerType[type] && false === loadLayerType[type].ifLoad){
                    loadLayerType[type].ifLoad = true;
                    //GPS点位不是从此处获取，所以单独选择GPS时，不请求
                    if(4 !== type){
                        this.getMapType(this.getMarkers);
                    }
                }
            });
        });
        this.setState({
            loadLayerType
        });
    }
    /**
     * 获取图层后，组装成所需的图层数据结构  { type: { code: layer } }
     * @param {Array} mapLayersAry 组装的layer信息
     * @param {Array} layersOfInterface 接口返回的所有layer信息
     */
    getLayers = (mapLayersAry, layersOfInterface) => {
        const { onlyShowLayerType } = this.props;
        //根据接口获取的图层数据组装所需的IconName信息 { type: { code: IconName } }
        if(layersOfInterface instanceof Array){
            layersOfInterface.forEach((item) => {
                if(!this.iconNameObj[item.LayerType]){
                    this.iconNameObj[item.LayerType] = {};
                }
                if(item.LayerImageInfo){
                    this.iconNameObj[item.LayerType][item.LayerCode] = item.LayerImageInfo.IconName;
                }
            });
        }
        //初始化，获取图层信息后，默认展示除GPS以外的点位图层
        let ifloadWorker = !onlyShowLayerType || onlyShowLayerType.some((item) => 4 !== item);
        if(ifloadWorker){
            this.getMapType(this.getMarkers);
        }
        let typeObj = {};
        mapLayersAry.forEach((item) => {
            if(!typeObj[item.type]){
                typeObj[item.type] = {};
            }
            typeObj[item.type][item.code] = item.layer;
        });
        this.setState({
            mapLayersObj: typeObj
        }, () => {
            this.props.getMapLayer(this.state.mapLayersObj);
        });
    }
    /**
     * 8500Map服务点位读取
     */
    getMarkers = (mapType) => {
        const { onlyShowLayerType } = this.props;
        const { loadLayerType } = this.state;
        //由于8500点位不分类别，一次性获取，则只需要加载一次拿到点位即可
        if(!this.ifLoadWorker && '9500' !== mapType){
            let worker = new Worker();
            worker.postMessage(JSON.stringify({
                type: onlyShowLayerType || Object.keys(loadLayerType),
                token: window['v5Token'],
                organization: this.domainInfo.Code,
                iconName: this.iconNameObj,
                mapType: mapType
            }));
            worker.onmessage = (e) => {
                this.setState({
                    markers: JSON.parse(e.data)
                });
            };
            this.ifLoadWorker = true;
        }
    }
    /**
     * 获取用户信息
     * @param {Object} domainInfo 用户登录信息
     */
    getDomainInfo = (domainInfo) => {
        this.domainInfo = domainInfo;
    }
    /**
     * 根据type编码获取对应图层分类名称
     * @param {Array} ary type数组
     */
    getTypeName = (ary) => {
        const { loadLayerType } = this.state;
        return ary ? ary.map((item) => loadLayerType[item].name) : null;
    }
    render() {
        const { mapLayersObj, loadLayerType, markers, mapType } = this.state;
        const { mapDom, onlyShowLayerType, children, className, defaultShow } = this.props;
        return (
            <React.Fragment>
                <LayerTree
                    mapDom={mapDom}
                    onlyShow={this.getTypeName(onlyShowLayerType)}
                    defaultCheckedKeys={this.getTypeName(defaultShow)}
                    getLayers={this.getLayers}
                    getChoosedCode={this.getChoosedCode}
                    getDomainInfo={this.getDomainInfo}
                    className={className}
                    children={children}
                />
                {
                    null !== mapType ?
                        Object.keys(mapLayersObj).map((item) => {
                            if('function' === typeof this.layer[item] && loadLayerType[item] && loadLayerType[item].ifLoad){
                                return this.layer[item]({ ...this.props, ...{
                                    layers: mapLayersObj[item],
                                    markers: markers[item] || [],
                                    mapType,
                                    iconName: this.iconNameObj[item] || {}
                                }});
                            }else{
                                return null;
                            }
                        }) : null
                }
            </React.Fragment>
        );
    }
}