import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Button, Table, DatePicker, Modal, Tree, Icon, Radio, message, Checkbox } from 'antd';
import './SnapDataSource.less';
import Axios from 'axios';
import { MapFunc } from '../index.js';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { TreeNode } = Tree;
const _mapIp = '33.112.24.32';
let mapArea = [],
    zoom = 15;//地图层级
const format = 'YYYY-MM-DD HH:mm:ss';//时间格式

const columns = [
    {
        title: '摄像机名称',
        dataIndex: 'cameraName',
        key: 'cameraName'
    }
];

/**
 * 数据源-抓拍的属性  抓拍数据源数据量肯定不小 严格分页执行
 */
export default class SnapDataSource extends Component {
    static propTypes = {
        startTime: PropTypes.string,  //开始时间
        endTime: PropTypes.string,    //结束时间
        selectCam: PropTypes.array,  //选中的相机
        //
        selectedNum: PropTypes.number,  //选中的数据量
        snapData: PropTypes.array     //单页十条抓拍数据
    }
    static defaultProps = {
        selectedNum: 100000,   //肯定非常巨大
        snapData: [{ cameraCode: 'a', cameraName: '白永杰抓拍相机' }, { cameraCode: 'b', cameraName: '二号相机' }]  //抓拍数据
    }
    constructor(props) {
        super(props);
        this.state = {
            currentPage: 1,  //当前页的页码
            startTime: moment().startOf('day'),   //开始时间
            endTime: moment().endOf('day'),      //结束时间
            show: '',  //树选择和地图选择页面切换
            treeData: [], //树
            cameraList: [], //地图当前层级上的设备信息
            layer: [],
            areaInfo: [],
            cameraIdList: [], //地图上选择的设备
            treeType: 'adtree', //行政区划选择和标签选择切换

        };
        this.mapRef = React.createRef(null)//map的Dom节点
    }

    //#region 地图
    componentDidUpdate(prevProps, prevState) {
        if (prevState.layer !== this.state.layer || prevState.areaInfo !== this.state.areaInfo) {
            if (this.mapRef.current != null) {
                this.mapRef.current.map.getBaseMap().addEventListener('moveend', this.listen)
                return () => {
                    this.mapRef.current.map.getBaseMap().removeEventListener('moveend', this.listen)
                }
            }
        }
    }

    listen = () => {
        let mapDom = this.mapRef.current.map.getBaseMap(),
            mapExtent = mapDom.getView().calculateExtent(mapDom.getSize());
        mapArea = [...mapDom.getMapLngLat([mapExtent[0], mapExtent[1]]), ...mapDom.getMapLngLat([mapExtent[2], mapExtent[3]])]

        this.setLayer(this.state.layer, this.state.areaInfo)
    }

    getMapArea = () => {
        let axiosData = {
            url: 'http://' + _mapIp + ':7022/VIAP/api/map/maparea',
            method: 'GET',
        };
        Axios(axiosData).then((res) => {
            let areaInfo = []
            if (res.status === 200 && res.data.rtn === 0) {
                let data = res.data.MapAreaInfoList;
                for (let i = 0; i < data.length; i++) {
                    const element = data[i];
                    areaInfo.push({
                        code: element.code,
                        name: element.name,
                        pcode: element.pcode,
                        count: element.count,
                        areaShow: 1
                    })
                }
                this.setState({
                    areaInfo
                })
            }
        }).catch((err) => {
            message.error(err)
        })
    }

    //#region 图层
    getMapLayer = (layer = {}) => {
        const {
            LayerCode = "",
            LayerName = "",
            LayerImage = "",
            LayerType = "",
            LayerState = "",
            LayerCreateTime = "",
            LayerSource = "",
        } = this.state.layer

        let axiosData = {
            url: 'http://' + _mapIp + ':7022/VIAP/api/map/maplayer',
            method: 'GET',
            data: {
                LayerCode,
                LayerName,
                LayerImage,
                LayerType,
                LayerState,
                LayerCreateTime,
                LayerSource
            }
        };
        Axios(axiosData).then((res) => {
            let layerInfo = []
            if (res.status === 200 && res.data.rtn === 0) {
                let data = res.data.MapLayerInfoList;
                for (let i = 0; i < data.length; i++) {
                    const element = data[i];
                    layerInfo.push({
                        createTime: element.create_time,
                        layerCode: element.layer_code,
                        layerImage: element.layer_image,
                        layerName: element.layer_name,
                        layerSource: element.layer_source,
                        layerState: element.layer_state,
                        layerType: element.layer_type,
                        count: element.count,
                        layerShow: 1
                    })
                }
                this.setState({
                    layer: layerInfo
                })
            }
        }).catch((err) => {
            console.error(err)
        })
    }

    setLayer = (layers, areaInfoList) => {
        if (this.state.layer.length === 0) {
            this.getMapLayer()
        }
        if (areaInfoList.length === 0) {
            this.getMapArea()
        }
        let mapDom = this.mapRef.current.map.getBaseMap(),
            mapExtent = mapDom.getView().calculateExtent(mapDom.getSize());
        //结果是火星坐标
        mapArea = [...mapDom.getMapLngLat([mapExtent[0], mapExtent[1]]), ...mapDom.getMapLngLat([mapExtent[2], mapExtent[3]])];
        //转换为wgs84坐标
        mapArea = [...mapDom.getMars2WGS(mapArea[0], mapArea[1]), ...mapDom.getMars2WGS(mapArea[2], mapArea[3])]
        zoom = mapDom.getView().getZoom();
        let codeArray = [];
        layers.forEach((item) => {
            if (!!item.layerShow) {
                codeArray.push(item.layerCode)
            }
        })
        if (codeArray.length === 0 && this.layer.length !== 0) {
            codeArray = ["-1"]
        }
        let areaCodeList = [];
        areaInfoList.forEach((item) => {
            if (!!item.areaShow) {
                areaCodeList.push(item.code)
            }
        })
        if (areaCodeList.length === 0 && areaInfoList.length !== 0) {
            areaCodeList = ["-1"]
        }
        if (zoom <= 15) {
            this.mapClusterInfo(...mapArea, zoom, codeArray, areaCodeList)
        } else {
            this.searchAreaCamera(...mapArea, 0, codeArray, areaCodeList)
        }
        this.setState({
            layer: layers
        })
    }
    //#endregion

    /**
     * 聚合
     */
    mapClusterInfo = (slng, slat, elng, elat, zoom, layercodelist = [], areacodelist = []) => {
        let axiosData = {
            url: 'http://' + _mapIp + ':7022/VIAP/api/map/clusterinfo',
            method: 'POST',
            data: {
                limit: 1000,
                offset: 0,
                layercodelist,
                areacodelist,
                slat,
                slng,
                elat,
                elng,
                zoom
            }
        };
        Axios(axiosData).then((res) => {
            let cameraInfoList = []
            if (res.status === 200 && res.data.rtn === 0) {
                let data = res.data.clusterInfoList;
                if (Array.isArray(data)) {
                    for (let i = 0; i < data.length; i++) {
                        const element = data[i];
                        if (~~element.lng === 0 || ~~element.lat === 0) {
                            continue
                        }
                        cameraInfoList.push({
                            longitude: element.lng,
                            latitude: element.lat,
                            name: element.number,
                            tollgateID: i
                        })
                    }
                    this.setState({
                        cameraList: cameraInfoList
                    })
                } else {
                    this.setState({
                        cameraList: []
                    })
                }
            }
        }).catch((err) => {
            console.error(err)
        })
    }

    /**
     * 请求相机
     */
    searchAreaCamera = (slng, slat, elng, elat, offset = 0, layercodelist = [], areacodelist = []) => {
        let axiosData = {
            url: 'http://' + _mapIp + ':7022/VIAP/api/map/rangecamerainfo',
            method: 'POST',
            data: {
                limit: 2000,
                offset,
                layercodelist,
                areacodelist,
                slat,
                slng,
                elat,
                elng
            }
        };
        Axios(axiosData).then((res) => {
            let cameraInfoList = []
            if (res.status === 200 && res.data.rtn === 0) {
                let data = res.data.CamInfoList;
                if (Array.isArray(data)) {
                    for (let i = 0; i < data.length; i++) {
                        const element = data[i];
                        if (~~element.jd === 0 || ~~element.wd === 0) {
                            continue
                        }
                        cameraInfoList.push({
                            longitude: element.jd,
                            latitude: element.wd,
                            name: element.azdz,
                            tollgateID: element.sbbm
                        })
                    }
                    this.setState({
                        cameraList: cameraInfoList
                    })
                    if (data.length === 2000) {
                        this.searchAreaCamera(slng, slat, elng, elat, offset += 2000, layercodelist, areacodelist)
                    }
                } else {
                    this.setState({
                        cameraList: []
                    })
                }
            }
        }).catch((err) => {
            console.error(err)
        })
    }

    /**
     * 调取内部的选中设备信息
     * @param {Object} cameraIdList 选中的设备 
     */
    getCameraId = (cameraIdList) => {
        this.setState({
            cameraIdList
        })
    }
    //#endregion

    /**
      * 切换页面的事件
      * @param {Number} page 页面
      * @param {Number} pageSize 每页的条数 这边应该固定都是10
      */
    _pageChange = (page, pageSize) => {
        console.log(page)
        //这里还需要做改变数据源的事情
        this.setState({
            currentPage: page
        });
    }

    /**
     * 点击选择器点击确认后的回调
     * @param {moment} dates 时间 
     */
    _rangePickerChange = (dates, dateStrings) => {
        console.log(dates);
        console.log(dateStrings);
        //时间变化了也要改变数据源

    }

    /**
     * 获取保存在本界面的属性，供父组件调用
     */
    getCondition = () => {
        //这里还没写好呢
        let ret = {
            startTime: this.state.startTime, //开始时间
            endTime: this.state.endTime,   //结束时间
            selectCam: []   //选择的相机
        }
        return ret;
    }

    /**
     * 市级区划加载
     */
    _adTreeLoad = () => {
        let axiosData = {
            url: '/VIAP/api/xzqh',
            method: 'GET'
        }
        Axios(axiosData).then(res => {
            let data = res.data
            if (data.rtn === 0) {
                let tree = []
                for (let i = 0; i < data.data.length; i++) {
                    const element = data.data[i]
                    tree.push({
                        title: element.name,
                        key: element.id
                    })
                }
                this.setState({
                    treeData: tree
                })
            }

        });
    }

    /**
     * 树选择按钮点击事件
     */
    _treeSelect = () => {
        this.setState({
            show: 'tree',
            treeType:'adtree',
            treeData: []
        })
        this._adTreeLoad()
    }

    /**
     * 地图选择按钮点击事件
     */
    _mapSelect = () => {
        this.setState({
            show: 'map'
        })
    }



    /**
     * 关闭树选择和地图选择框
     */
    _cancelModel = () => {
        this.setState({
            show: ''
        })
    }

    /**
     * 标签选择与行政区划选择区分
     * @param {Object} e 
     */
    treeChange = (e) => {
        this.setState({
            treeType: e.target.value,
            treeData: []
        })
        if (e.target.value === 'adtree') {
            this._adTreeLoad()
        } else {
            let axiosData = {
                url: '/VIAP/api/labellist',
                method: 'GET',
                params: {
                    attr: '2'
                }
            }
            Axios(axiosData).then(res => {
                let data = res.data
                if (data.rtn === 0) {
                    data.dataList.forEach((item, index) => {
                        this.setState({
                            treeData: this.state.treeData.push({
                                label: item.labelName,
                            })
                        })
                    })
                }
            }).catch(error => {
                console.log(error)
            })
            //测试
            this.setState({
                treeData: [
                    { label: '身份证', value: '1' },
                    { label: '年龄', value: '2' },
                    { label: '性别', value: '3' },
                    { label: '身高', value: '4' }
                ]
            })
        }
    }

    /**
     * 标签选择
     * @param {Object} e 
     */
    tagTreeChange = (e) => {

    }

    /**
     * 异步加载数据
     * @param {Object} treeNode 树节点
     * @param {String} treeType 区分标签选择和行政区划选择 
     */
    loadData = (treeNode, treeType) =>
        new Promise(resolve => {
            if (treeNode.props.children) {
                resolve();
                return;
            }
            let axiosData = {
                url: '/VIAP/api/getdev',
                method: 'GET',
                params: {
                    xzqy: treeNode.props.eventKey
                }
            };
            Axios(axiosData).then((res) => {
                let data = res.data
                if (data.rtn === 0) {
                    if (data.dataList.length !== 0) {
                        let tree = []
                        for (let i = 0; i < data.dataList.length; i++) {
                            const element = data.dataList[i];
                            tree.push({
                                title: element.xzqy,
                                key: element.id,
                                isLeaf: true
                            })
                        }
                        treeNode.props.dataRef.children = tree
                    } else {
                        treeNode.props.dataRef.children = []
                    }
                    this.setState({
                        treeData: [...this.state.treeData],
                    })
                    resolve()
                }
            });
            //测试
            setTimeout(() => {
                treeNode.props.dataRef.children = [
                    { title: 'Child Node', key: `${treeNode.props.eventKey}-0` },
                    { title: 'Child Node', key: `${treeNode.props.eventKey}-1` },
                ];
                this.setState({
                    treeData: [...this.state.treeData],
                });
                resolve();
            }, 1000);
        });

    /**
     * 异步数据处理
     * @param {Object} data 树的数据 
     */
    renderTreeNodes = (data) =>
        data.map(item => {
            if (item.children) {
                return (
                    <TreeNode title={item.title} key={item.key} dataRef={item}>
                        {this.renderTreeNodes(item.children)}
                    </TreeNode>
                );
            }
            return <TreeNode key={item.key} {...item} dataRef={item} />;
        });

    /**
     * 复选框触发事件
     * @param {Array} selectArray 所有选中的行政区划，混合市级和区级
     */
    onCheck = (selectArray) => {
        let array = [...selectArray], index = array.length
        for (let i = 0; i < array.length; i++) {
            const element = array[i]
            if (element.length > 6) {
                index = i
                break
            }
        }
        //截取的市级行政区划
        let CamRegionList = array.splice(0, index)

    }

    /**
     * 确定按钮触发事件
     */
    onOk = () => {
        //数据向外传递,区分树选择和地图选择
        if (this.state.show === 'tree') {

        } else {

        }
        this.setState({
            show: ''
        })
    }

    render() {
        const { snapData, selectedNum } = this.props;
        const { currentPage, show, treeData, cameraList, layer, startTime, endTime, treeType } = this.state;
        return (
            <div className='OperatorAttribute_SnapDataSource_main'>
                <span>
                    <span>
                        地点选择：
                </span>
                    <Button onClick={this._treeSelect}>树选择</Button>
                    <Button onClick={this._mapSelect}>地图选择</Button>
                </span>
                <div className='OperatorAttribute_SnapDataSource_main_table'>
                    <span>
                        摄像机列表：
                    </span>
                    <span style={{ float: 'right' }}>
                        {`已选${selectedNum}个`}
                    </span>
                    <Table rowKey={record => record.cameraCode} columns={columns} dataSource={snapData} bordered pagination={{
                        // size: "small",
                        simple: true,
                        total: selectedNum,  //总数
                        pageSize: 10, //默认每页就十条
                        current: currentPage,  //当前页
                        onChange: this._pageChange,
                        // showQuickJumper: true,
                        style: { textAlign: 'center', float: 'none' }
                    }} />
                </div>
                <span>查询时间：</span>
                <RangePicker
                    showTime={{ format }}
                    defaultValue={[startTime, endTime]}
                    style={{ marginTop: '10px', width: '100%' }}
                    onChange={this._rangePickerChange}
                />

                {
                    show && <Modal
                        title={show === 'tree' ? '树选择' : '地图选择'}
                        visible={show ? true : false}
                        mask={false}
                        width={show === 'map' ? ' calc(100vw - 700px)' : 520}
                        onCancel={this._cancelModel}
                        onOk={this.onOk}
                        wrapClassName='OperatorAttribute_SnapDataSource_modal'
                    >
                        <div className='OperatorAttribute_SnapDataSource_modl_body'>
                            {
                                show === 'tree' && <div>
                                    <Radio.Group onChange={this.treeChange} value={treeType}>
                                        <Radio value={'adtree'}>根据行政区划</Radio>
                                        <Radio value={'tagtree'}>根据标签</Radio>
                                    </Radio.Group>
                                    {
                                        treeType === 'adtree' && <Tree
                                            showLine
                                            showIcon
                                            checkable
                                            switcherIcon={<Icon type='plus-square' />}
                                            loadData={(treeNode) => this.loadData(treeNode, treeType)}
                                            onCheck={this.onCheck}
                                        >
                                            {this.renderTreeNodes(treeData)}
                                        </Tree>
                                    }
                                    {
                                        treeType === 'tagtree' && <Checkbox.Group
                                            style={{marginTop:20}}
                                            options={treeData}
                                            onChange={this.tagTreeChange}
                                        ></Checkbox.Group>
                                    }
                                </div>
                            }
                            {
                                show === 'map' &&
                                <MapFunc
                                    getDataList={cameraList}
                                    getLayer={layer}
                                    setLayer={this.setLayer}
                                    ref={this.mapRef}
                                    isRegion={true}//控制左侧已选设备框显示
                                    mapServerIp={_mapIp}
                                    getCameraId={this.getCameraId}
                                />
                            }
                        </div>
                    </Modal>
                }
            </div>
        )
    }
}