/**
 * 加载卡口摄像机组件
 */
import React, { Component } from 'react';
import { Modal } from 'antd';
import ol from 'openlayers';
import tollgeteIcon from '../Image/30002-31-1.png';
import $ from 'jquery';
import '../style/index.less';
import { getUserInfo } from '../utils';
import { loadDataFuc, modifyDeviceData, findDeviceData, deletedDeviceData, getMarkerInfo, getLayersInfo } from './ApiUtils';
import { addVector } from '../utils';
import AddCamera from './AddCamera';
import AddBayonet from './AddBayonet';
import AddVisibleRange from './AddVisibleRange';
import camera_sprite24x from '../Image/camera_sprite24x.png';
import tollgate_sprite24x from '../Image/tollgate_sprite24x.png';
import moment from 'moment';
const confirm = Modal.confirm;
let  features, visableSource, map, detailElement, detailTip, rightMenuElement, rightMenu;
let  visableLayer,  featureSource;
let tollgateLayer, tollgateSource;
let cameraLayer, cameraSource;
let zoomData = 0;
const clusterDistance = 20; //聚合距离
class LoadCrossCamera extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data:[],
            marker:{},
            optionPiontData:{},
            showEdit:false,
            showInput:false,
            optionFeature:{},
            modifyData:{},
            moveIconCoord:[],
            showEditCamera:false,
            message:{},
            addOrModify:'',
            bayonetShow:false,
            cameraShow:false
        };
    }
    //界面初始化
    componentDidMount = () => {
        const that = this;
        map = this.props.map;
        console.log('map', map);
        // //加载所有点位
        //请求用户信息
        //建立图层
        tollgateLayer = addVector(map);  //卡口图层
        tollgateSource = tollgateLayer.getSource();//卡口source

        cameraLayer = addVector(map);  //相机图层
        cameraSource = cameraLayer.getSource();//相机source

        getUserInfo((userInfo) => {
            //请求用户所能访问的图层
            getLayersInfo(userInfo.UserCode, this.getLayers);
        });

        //监听事件
        //拖拽点位
        this.dropCase();
        //移入点位显示点位详情信息
        this.showDetail();
        //点位点击右键出现菜单
        this.rightMenu();
        //双击点位
        this.dblclick();
        // 地图缩放监听,聚合图层
        map.getView().on('change:resolution', that.zoomChangeHandle);
        //组织鼠标移入的默认行为
        document.addEventListener('dragover', function( event ) {
            event.preventDefault();
        }, false);
    }
    componentWillUnmount(){
        map.removeLayer(tollgateLayer);
        map.removeLayer(cameraLayer);
        map.removeOverlay(rightMenu);
        map.removeOverlay(detailTip);
    }
    //无地图服务获取图层信息根据用户图层权限加载图层
    getLayers = (result) => {
        const that = this;
        let _result  = result.LayerInfos;
        if(_result){
            //点位信息添加
            that.loadData(_result);
        }
    }
    //点位点击右键出现菜单
    rightMenu=() => {
        const that = this;
        // 获取右键菜单标签
        rightMenuElement = document.getElementById('contexa_map');
        //创建一个的覆盖标注
        rightMenu = new ol.Overlay({
            element: rightMenuElement,
            offset: [15, 0],
            positioning: 'center-left'
        });
        //将帮助提示的覆盖标注添加到地图中
        map.addOverlay(rightMenu);
        //openlayer没有自带的右键事件，用Jquery监听鼠标右键事件
        $(map.getViewport()).on('contextmenu', function(event){
            //屏蔽自带的右键事件
            event.preventDefault();
            //根据鼠标当前像素点 取到feature
            let pixel = map.getEventPixel(event.originalEvent);
            let feature = map.forEachFeatureAtPixel(pixel, function(feature){
                return feature;
            });
            let zoom = map.getView().getZoom();
            //当获取到feature并且不聚合时出现详情信息
            if (!!feature && zoom > 15 ) {
                const result = that.lableOperate(feature, event, rightMenu, rightMenuElement);
                //把取到的数据存起来
                if(!!result){
                    that.setState({
                        optionPiontData: result,
                        optionFeature:feature
                    });
                }
            }
        });

        //因为onclicl事件失效，此处用原生点击事件
        //点击右键列表的删除选项
        let menuDelete = document.getElementById('mapShow-menuDelete');
        menuDelete.addEventListener('click', function(){
            //删除按钮绑定删除事件
            that.deleteIcon();
        });
        //点击右键列表的修改选项
        let menuModify = document.getElementById('mapShow-menuModify');
        menuModify.addEventListener('click', function(){
            //删除按钮绑定删除事件
            that.modifyIcon();
        });
    }
    //双击元素
    dblclick=() => {
        const { callBackShow } = this.props;
        $(map.on('dblclick', function(event){
            //屏蔽自带的右键事件
            event.preventDefault();
            //根据鼠标当前像素点 取到feature
            let pixel = map.getEventPixel(event.originalEvent);
            let feature = map.forEachFeatureAtPixel(pixel, function(feature){
                return feature;
            });
            let zoom = map.getView().getZoom();
            //当获取到feature并且不聚合时出现详情信息
            if (!!feature && zoom > 15 ) {
                //双击后的回调函数
                if(callBackShow && typeof callBackShow === 'function'){
                    callBackShow(feature.get('Id'));
                }
            }
        }));

    }
    //移入点位显示点位详情信息
    showDetail=() => {
        const that = this;
        // 获取详情标签
        detailElement = document.getElementById('mapShow-detail');
        //创建一个详情的标注
        detailTip = new ol.Overlay({
            element: detailElement,
            offset: [-20, -10],
            positioning: 'bottom-right'
        });
        //将详情的标注加到地图中
        map.addOverlay(detailTip);
        //监听鼠标移动事件
        map.on('pointermove', function(event) {
            //根据窗口坐标获取到feature
            let pixel = map.getEventPixel(event.originalEvent);

            let feature = map.forEachFeatureAtPixel(pixel, function (feature) {
                return  feature;
            });
            let zoom = map.getView().getZoom();
            //当获取到feature并且不聚合时，出现详情信息
            if (!!feature && zoom > 15 ) {
                //获取到html标签
                let nameDetail = document.getElementById('mapShow-nameDetail');
                let locationDetail = document.getElementById('mapShow-locationDetail');
                //将feature的内容显示在html标签上
                if(!!nameDetail && !!locationDetail) {
                //将详情跟随点位显示，并返回点位信息
                    const result = that.lableOperate(feature, event, detailTip, detailElement);
                    nameDetail.innerHTML = `卡口名称：${result.Id}`;
                    locationDetail.innerHTML = `所属区域：${result.MarkerDomain}`;
                }
            }else {
                //鼠标不在点位上时不显示详情
                $(detailElement).addClass('hidden');
            }
        });
    }
    //鼠标事件获取到feature后的操作
    lableOperate = (feature, event, lableList, lableElement) => {
        const { getMapLngLat } = this.props;
        //取得地图实际坐标
        let geometry = feature.getGeometry();
        let coordinate = geometry.getCoordinates();
        //根据坐标设置菜单位置
        lableList.setPosition(coordinate);
        //不是聚合图层时显示菜单
        $(lableElement).removeClass('hidden');
        //根据feature取得数据并返回
        let optionPiontData = {
            Lng:getMapLngLat(coordinate)[0], //坐标转化为经纬度
            Lat:getMapLngLat(coordinate)[1],
            Id:feature.get('Id'),
            MarkerName : feature.get('MarkerName'),
            MarkerDomain : feature.get('MarkerDomain'),
            DeviceCode:feature.get('DeviceCode')
        };
        return optionPiontData;
    }
    //拖拽点位
    dropCase = () => {
        const { getMapLngLat } = this.props;
        let that = this;
        //拖动完成后触发
        document.addEventListener('dragend', function(event) {
            let coordinate = map.getEventCoordinate(event);
            let lonlat = getMapLngLat(coordinate);
            //当有设备拖入时
            let id = that.props.optionData.resId;
            let type = that.props.optionData.resourceInfo.resType;
            //markertype=31是卡口
            let option = 0;
            let layerNum = 30001;
            if (type === 31) {
                option = 1;
            } else {
                layerNum = '';
            }
            findDeviceData(id, option, (data) => {
                if (data.Number === 0){
                    that.addNewPoint(lonlat, layerNum);
                } else if(data.Number === 1) {
                    that.moveCoord(data.Markers[0], lonlat, layerNum);
                }
            });
            that.setState({ moveIconCoord:lonlat });
        });
        //单击时让右键菜单隐藏
        map.on('singleclick', function(evt) {
            $(rightMenuElement).addClass('hidden');
        });
    }

    //修改点位
    modifyIcon=() => {
        const { optionFeature } = this.state;
        const type = optionFeature.get('LayerType');
        //右键菜单消失
        $(rightMenuElement).addClass('hidden');
        if (type === 30001) {
            findDeviceData(optionFeature.get('DeviceCode'), 1, (data) => {
                if(!!data.Markers[0]){
                    this.setState({
                        optionPiontData:data.Markers[0],
                        showEditCamera:true,
                        showInput:false,
                        addOrModify:'modify',
                        bayonetShow:true,
                        cameraShow:false
                    });
                }
            });
        }  else {
            findDeviceData(optionFeature.get('DeviceCode'), 0, (data) => {
                if(!!data.Markers[0]){
                    this.setState({
                        optionPiontData:data.Markers[0],
                        showEditCamera:true,
                        showInput:false,
                        addOrModify:'modify',
                        bayonetShow:false,
                        cameraShow:true
                    });
                }
            });
        }

    }

    addClusterLayer = () => {
        //添加为聚合资源
        if(!tollgateLayer){
            return;
        }
        function setClusterFun(_layer, _source, _icon){
            let _clusterSource = new ol.source.Cluster({
                distance: clusterDistance,
                source: _source
            });
            _layer.setSource(_clusterSource);
            //设置聚类样式
            function setClusterStyle(feature) {
                //   '30001'为卡口
                let iconType = _icon;
                let features = feature.get('features');
                let size = features.length;
                let style = '';
                // 聚合图片选择
                let iconName = '';
                if(size > 64){
                    iconName = 64;
                }else if(size > 48){
                    iconName = 48;
                }else{
                    iconName = 32;
                }
                style = [new ol.style.Style({
                    image: new ol.style.Icon({
                        src:require(`../Image/${iconType + iconName}.png`),
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
                })];
                return style;
            }
            _layer.setStyle(function(feature) {  //设置图层样式);
                return setClusterStyle(feature);
            });
        }

        setClusterFun(tollgateLayer, tollgateSource, 'tollgateCluster');
        cameraLayer && setClusterFun(cameraLayer, cameraSource, 'cameraCluster');
    }

    //地图缩放和移动处理事件
    zoomChangeHandle=() => {
        let that = this;
        let zoom = map.getView().getZoom();
        zoomData = zoom;
        let timer = setTimeout(() => {
            if(zoom === zoomData){
            //if zoom<15 级 为聚合图层
                if(zoom < 15){
                    that.addClusterLayer();
                }else{
                    tollgateLayer.setSource(tollgateSource);
                    cameraLayer.setSource(cameraSource);
                }
            }else{
                clearInterval(timer);
            }
        }, 400);
    }


    //新增数据成功后在地图上新增点位
    addNewFeature=(data) => {

        let dataInfo = data.Markers[0];
        if(dataInfo.MarkerType === 31) {//卡口
            this.addIcon( tollgateSource, tollgeteIcon, dataInfo );
        }  else {//相机
            this.addIcon( cameraSource, tollgeteIcon, dataInfo );
        }
    }
    //新增点位
    addNewPoint=(coord, type) => {
        let data = this.props.optionData;
        let result = {
            'Lng': coord[0],
            'Lat': coord[1],
            'Id': moment(new Date()).format('YYYYMMDDHHmmss'),
            'MarkerCode': data.resId,
            'MarkerName':data.nodeText,
            'MarkerDomain': '',
            'MarkerStreet': '',
            'MarkerDesc': '',
            'LayerType': type,
            'MarkerType': '',
            'ViewSheds': 0,
            'ViewAngle': 0,
            'MarkerAngle': 0,
            'DeviceCode': data.resId,
            'DeviceName': data.nodeText,
            'LocalDomainIp': '',
            'LocalDomainCode': '',
            'CreateTime':  moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            'ModifyTime': '',
            'UserName': data.resourceInfo.orgName,
            'Var1': '',
            'Var2': '',
            'Int1': 0,
            'Int2': 0
        };
        if (data.resourceInfo.resType === 31) {
            this.setState({
                bayonetShow:true,
                cameraShow:false
            });
        } else if (data.resourceInfo.resType === 1001){
            this.setState({
                bayonetShow:false,
                cameraShow:true
            });
        }
        this.setState({
            showEditCamera:true,
            showInput:false,
            optionPiontData:result,
            addOrModify:'add'
        });
    }

    moveCoord = (data, coord, type) => {
        let that = this;
        confirm({
            title: `${data.DeviceName}已存在，是否修改位置`,
            onOk() {
                let result = Object.assign({}, data);
                result.Lng = coord[0];
                result.Lat = coord[1];
                result.ModifyTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                that.moveIcon(result, type);///移动位置移动位置移动位置
            }
        });
    }

   //移动点位
   moveIcon = (data, type) => {
       //删除图标
       if (type === 30001){
           let feature = tollgateSource.getFeatureById(data.Id);

           if(!!feature) {
               tollgateSource.removeFeature(feature);
               this.addIcon(tollgateSource, tollgeteIcon, data);
           }
       } else {
           let feature = cameraSource.getFeatureById(data.Id);
           if(!!feature) {
               cameraSource.removeFeature(feature);
               this.addIcon(cameraSource, tollgeteIcon, data);
           }
       }


       $(rightMenuElement).addClass('hidden');
       //修改坐标的接口
       modifyDeviceData(data);
   }

   //删除这个元素
   deleteFeature = ( type ) => {
       const { optionFeature } = this.state;
       if (type === 30001){//卡口
           tollgateSource = tollgateLayer.getSource();
           tollgateSource.removeFeature(optionFeature);
       } else {//相机
           cameraSource = cameraLayer.getSource();
           cameraSource.removeFeature(optionFeature);
       }
       $(rightMenuElement).addClass('hidden');
   }

   // 删除点位
   deleteIcon = () => {
       //调删除接口
       this.deleteData();
       this.deleteFeaturePiont();
   }

    //加载图层和元素，返回图层
    loadFeature = (data, layerInfo) => {
        //将每个点位添加到地图上
        data.map(( item, index ) => {
            let startY = 0;
            let startX = 0;
            if(item.LayerType === 30001){//卡口
                // 相机的layerType:0  卡口的 layerType:1
                let getImageInfo = layerInfo.find((itm) => itm.LayerType === 1);
                let markTypePic = getImageInfo.LayerImageInfo.IconName;
                // 1.如果是卡口加载卡口精灵图
                item.image = tollgate_sprite24x;    //使用卡口精灵图
                startY = (markTypePic % 30000) * 24 ;
            }else{//相机
                // 2.如果是相机加载相机精灵图
                let getImageInfo = layerInfo.find((itm) => itm.LayerType === 0 && itm.LayerCode === item.LayerType);
                let markTypePic = getImageInfo.LayerImageInfo.IconName;
                item.image = camera_sprite24x;    //使用摄像机精灵图
                startY = (markTypePic % 20000) * 4 * 24 ;
                if(item.MarkerType <= 2){
                    startY = startY + (item.MarkerType - 1) * 24;
                }else if(item.MarkerType === 7){
                    startY = startY + 2 * 24;
                }else if(item.MarkerType === 8){
                    startY = startY + 3 * 24;
                }
            }
            startX = item.Status === 0 ? 24 : 0;
            item.offset = [startX, startY];
            //添加到地图上
            let icon = tollgeteIcon;
            // let MarkerType = '31';
            // if(item.LayerType===30001){
            //     MarkerType = '31';
            // }else{
            //     MarkerType = item.MarkerType;
            // }

            // try{
            //     icon = require(`../CameraIcon/${item.LayerType}-${MarkerType}-${item.Status===0?2:1}.png`);
            // } catch(err){
            //     icon = tip;
            // }
            if(item.MarkerType === 31){
                this.addIcon( tollgateSource, icon, item );

            }else{
                this.addIcon( cameraSource, icon, item);

            }
        });
        tollgateSource = tollgateLayer.getSource();
        cameraSource = cameraLayer.getSource();
        features = tollgateSource.getFeatures();
        // 判断是否聚合 <15级为聚合  g05047  20181107
        let _zoom = map.getView().getZoom();
        if(_zoom && _zoom < 15){
            //加载聚合图层
            this.addClusterLayer();
        }
        // 显示图层  g05047  20181107
        tollgateLayer.setVisible(true);
        cameraLayer.setVisible(true);
    }
    //自定义点位： 实际坐标
    addIcon=(source, icon, item) => {
        const { getMapPoint } = this.props;
        let feature = 0;
        feature = new ol.Feature({
            geometry: new ol.geom.Point(getMapPoint(item.Lng, item.Lat)),
            MarkerName: item.MarkerName,
            MarkerDomain:item.MarkerDomain,
            Id:item.Id,
            DeviceCode:item.DeviceCode,
            LayerType:item.LayerType,
            Lng: item.Lng,
            Lat: item.Lat
        });
        feature.setStyle(
            new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 1],              //锚点
                    anchorYUnits: 'pixels',         //锚
                    src:item.image ? item.image : icon,
                    offsetOrigin: 'top-left',
                    offset:item.offset || item.offset,
                    size:[24, 24]
                }),
                text: new ol.style.Text({
                    offsetX: 0,
                    offsetY: -20,
                    textAlign: 'top',            //位置
                    textBaseline: 'top',         //基准线
                    font: '10px 微软雅黑',    //文字样式
                    text: item.DeviceCode,      //文本内容
                    fill: new ol.style.Fill({       //文本填充样式（即文字颜色)
                        color: '#000'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 1
                    })
                })
            })
        );
        feature.setId(item.Id);
        if(item.viewSheds){
            //可视域数据组装
            let options = {
                map:map,
                origin:getMapPoint(item.Lng, item.Lat),
                radius:item.ViewSheds,
                viewAngle:item.ViewAngle,
                markerAngle:item.MarkerAngle,
                viewLayer: visableLayer,
                featureObj:feature
            };
            //添加可视域
            AddVisibleRange.rotatedAngleHandel(options);
        }
        if(item.LayerType === 30001){
            tollgateSource.addFeatures([feature]);
        }else{
            cameraSource.addFeatures([feature]);
        }
        // return feature;
    }

    //最多每次加一千个点
    loadData = (layerInfo) => {
        const { getMapLngLat } = this.props;
        // 获取地图的可视范围
        let  arr = map.getView().calculateExtent(map.getSize());
        let  leftBottom = getMapLngLat([arr[0], arr[1]]);//左下
        let  rightTop = getMapLngLat([arr[2], arr[3]]);//右上
        //确定入参
        let condition = {
            slat:leftBottom[1], //起点_纬度
            slng:leftBottom[0], //起点_经度
            elat:rightTop[1], //终点_纬度j
            elng:rightTop[0], //终点_经度
            layer:'1,2,4,30001', //图层编码   -1查所有图层
            offset:0, //查询起点下标
            limit:1000//偏移量
        };
        //第一次调接口查询总共多少条
        loadDataFuc(condition, (data) => {
            this.setState({ data:data.Markers });
            this.loadFeature( data.Markers, layerInfo);
            //当大于一千条时，循环，每一千条加载一次
            let result = parseInt(data.Total / 1000);
            for(let i = 0; i < result; i += 1){
                let resultInfo = Object.assign({}, condition);
                resultInfo.offset = (i + 1) * 1000;
                loadDataFuc(condition, (data) => {
                    this.setState({ data: data.Markers });
                    this.loadFeature( data.Markers, layerInfo);
                });
            }
        });
    }

    deleteFeaturePiont =(Id) => {
        const { optionFeature } = this.state;
        let type = optionFeature.get('LayerType');
        this.deleteFeature( type );
    }

    //删除数据
    deleteData = () => {
        const { optionFeature } = this.state;
        let result = {
            'Markers': [{
                'Lng':optionFeature.get('Lng'),
                'Lat': optionFeature.get('Lat'),
                'Id': optionFeature.get('Id')
            }] };
        deletedDeviceData(result, () => {
            this.deleteFeaturePiont(optionFeature.get('Id'));
        });
    }
    changeEditCamera=(e) => {
        this.setState({ showEditCamera:e });
    }

    modifyFeature=() => {
    }
    render() {
        const { bayonetShow, cameraShow, optionPiontData, addOrModify, showEditCamera } = this.state;
        return (
            <div  className="contextmenu hidden">
                <ul id="contexa_map">
                    <li  id="mapShow-menuModify" className="menuItem" onClick={this.modifyIcon}>  修改标记  </li>
                    <div className="menuLine"></div>
                    <li id="mapShow-menuDelete" className="menuItem" onClick={() => this.deleteIcon} >  删除标记  </li>
                </ul>
                {bayonetShow && showEditCamera && <AddBayonet showVisible={this.changeEditCamera} addOrModify={addOrModify} addNewData={optionPiontData} callBack={this.editResult}  addNewFeature={this.addNewFeature} modifyFeature={this.modifyFeature}/>}
                {cameraShow && showEditCamera && <AddCamera showVisible={this.changeEditCamera} addOrModify={addOrModify} addNewData={optionPiontData} callBack={this.editResult}  addNewFeature={this.addNewFeature}  modifyFeature={this.modifyFeature}/>}
                <ul id="mapShow-detail">
                    <li  id="mapShow-nameDetail" className="detailTooltip"></li>
                    <li id="mapShow-locationDetail"className="detailTooltip"></li>
                </ul>

            </div>
        );
    }
}
export default LoadCrossCamera;
