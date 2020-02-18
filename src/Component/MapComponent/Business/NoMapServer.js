import React, { Component } from 'react';
import ol from 'openlayers';
import html2canvas from 'html2canvas';
import { getLayersInfo, getMarkerInfo, delMark } from './ApiUtils';
import FilterLayer from './FilterLayer';
import SetVisibleRange from './SetVisibleRange';
import { getUserInfo } from '../utils';
import $ from 'jquery';
//图层信息数据格式
let layerDatas = [];
class NoMapServer extends Component {
    constructor(props){
        super(props);
        this.state = {
            _layerDatas:[],
            isShowRange:false,
            imageUrl:'',
            ponitInfo:null
        };
    }
    componentWillMount(){
        //请求用户信息
        getUserInfo((userInfo) => {
            //请求用户所能访问的图层
            getLayersInfo(userInfo.UserCode, this.getLayers);
        });
    }
    componentDidMount(){
        const { map } = this.props;
        let that = this;
        // 右键弹框
        let element = document.getElementById('contextmenu_container');
        let menu_overlay = new ol.Overlay({
            element: element,
            positioning: 'top-left',
            offset:[5, 5],
            autoPan:true
        });
        // 右键事件绑定
        $(map.getViewport()).on('contextmenu', function(e){
            e.preventDefault();
            let pixel = map.getEventPixel(e.originalEvent);
            let coordinate = map.getEventCoordinate(e);
            map.forEachFeatureAtPixel(pixel, function (feature, _layer) {
                if(feature.get('MarkName')){
                    menu_overlay.setMap(map);
                    menu_overlay.setPosition(coordinate);
                }
                $('#modify').click(() => {
                    //打开相机修改界面
                    that.setState({ isShowRange:true, ponitInfo:feature }, that.getPicCut);
                });
                $('#del').click(() => {
                    function delFea(){
                        menu_overlay.setPosition(undefined);
                        _layer.getSource().removeFeature(feature);
                    }
                    //打开相机修改界面
                    delMark(parseInt(feature.get('Id')), delFea);
                });
            });
        });
        // 鼠标左击移除 g05047  20181108
        map.on('click', function(e){
            menu_overlay.setPosition(undefined);
        });
    }
    //无地图服务获取图层信息根据用户图层权限加载图层
    getLayers = (result) => {
        let _result  = result.LayerInfos;
        if(_result){
            _result.forEach((item) => {
                if((item.LayerType === 0) && !layerDatas[0]){
                    layerDatas[0] = {
                        title: '摄像机',
                        children: {},
                        layerType:0
                    };
                }else if((item.LayerType === 1) && !layerDatas[1]){
                    layerDatas[1] = {
                        title: '卡口',
                        children: {},
                        layerType:1
                    };
                }else if((item.LayerType === 2) && !layerDatas[2]){
                    layerDatas[2] = {
                        title: '防区',
                        children: {},
                        layerType:1
                    };
                }else if((item.LayerType === 3) && !layerDatas[3]){
                    layerDatas[3] = {
                        title: '全景',
                        children: {},
                        layerType:3
                    };
                }else if((item.LayerType === 4) && !layerDatas[4]){
                    layerDatas[4] = {
                        title: '移动警务',
                        children: {},
                        layerType:4
                    };
                }else if((item.LayerType === 6) && !layerDatas[6]){
                    layerDatas[6] = {
                        title: '自定义',
                        children: {},
                        layerType:6
                    };
                }else if((item.LayerType === 7) && !layerDatas[7]){
                    layerDatas[7] = {
                        title: '其他',
                        children: {},
                        layerType:7
                    };
                }
                layerDatas[item.LayerType].children[String(item.LayerCode)] = { title:item.LayerName, markInfo: [], layerCode:item.LayerCode };
            });
            //点位信息添加
            getMarkerInfo(-1, _result, this.getMarks);
        }
    }

    getMarks=(_result) => {
        if(_result){
            _result.forEach((item) => {
                layerDatas[item.LayerType].children[String(item.LayerCode)] &&
          layerDatas[item.LayerType].children[String(item.LayerCode)].markInfo.push({   //点位携带的信息
              id:item.Id,   //markId
              markName:item.MarkerName,
              markCode:item.MarkerCode,
              markerDesc:item.MarkerDesc,
              markerStreet:item.MarkerStreet,
              markerAngle:item.MarkerAngle,
              markerType:item.MarkerType,

              deviceCode:item.DeviceCode,
              deviceName:item.DeviceName,
              createTime:item.CreateTime,
              userName:item.UserName,

              coord:[item.Lng, item.Lat],
              viewAngle:item.ViewAngle,
              viewSheds:item.ViewSheds,

              layerType:item.LayerType,
              layerCode:item.LayerCode,
              imgIcon:item.image,
              offset:item.offset
          });
            });
            // })
            //图层数据
            this.setState({ _layerDatas:layerDatas });
        }
    }

  // 关闭设置弹框
  callBack=(data) => {
      this.setState({ isShowRange:false });
  }
  // 获取创建的图层信息
  getFilterLayerInfo = (data) => {

  }
   // 截图作为设置可视域的背景
   getPicCut = () => {
       const { map } = this.props;
       let that = this;
       let canvas2 = document.createElement('canvas');
       let w = 400;
       let h = 400;
       canvas2.width = 400;
       canvas2.height = 400;
       canvas2.style.width = w + 'px';
       canvas2.style.height = h + 'px';
       let context = canvas2.getContext('2d');
       html2canvas(document.querySelector('.unvSelfMap'), {
           async: false,
           allowTaint: true,
           imageTimeout: 0,
           taintTest: false,
           useCORS: true,
           canvas:canvas2
       }).then(function(canvas) {

           // 生成截图url
           let imageUrl = canvas.toDataURL('image/png');
           that.setState({ imageUrl });
       });
   }


   render(){
       const { map, getMapPoint } = this.props;
       const { _layerDatas, isShowRange, imageUrl, ponitInfo } = this.state;
       return (
           <div>
               <div  className="contextmenu" style={{ display:'none' }}>
                   <ul id="contextmenu_container" style={{ background:'#fff', fontSize:'12px' }}>
                       <li id="modify">修改</li>
                       <li id="del">删除</li>
                   </ul>
               </div>
               <FilterLayer map={map} getMapPoint={getMapPoint}  layerData={_layerDatas}   getFilterLayerInfo={this.getFilterLayerInfo}/>
               {isShowRange && <SetVisibleRange  map={map} callBack={this.callBack} imageUrl={imageUrl} ponitInfo={ponitInfo}/>}
           </div>
       );

   }

}
export default NoMapServer;
