import React, { Component } from 'react';
import ol from 'openlayers';
import { getDefenceApi, delDefenceApi, addDefenceApi } from './ApiUtils';
import { drawPolygon, getArgbToRgba } from '../olUtils';
import SetDefence from './SetDefence';
import confirmPic from '../Image/confirm.png';
import dels from '../Image/dels.png';
import { Icon, Popover, Modal } from 'antd';
const confirm = Modal.confirm;
let getMapPoint, getMapLngLat;
class DrawDefence extends Component {
    constructor(props){
        super(props);
        this.state = {
            isDisplay:'none',
            isShowSet:false,
            drawPointArr:[],
            isSelected:'',
            upData:{},
            upFeature:''
        };
    }
    componentDidMount(){
        let that = this;
        if(!that.tmap) {
            that.tmap = that.props.map;
            getMapPoint = that.props.getMapPoint;
            getMapLngLat = that.props.getMapLngLat;

            that.tmap.addLayer(this.polygonLayer);
            //加载防区
            that.loadDefence();

        }
    }
    componentWillUnmount(){
        const that = this;
        //移除地图绑定的事件
        that.tmap.removeInteraction(that.draw);
        that.tmap.removeEventListener('click');
        that.tmap.removeLayer(that.layer);
        that.tmap.removeLayer(that.polygonLayer);

    }
  tmap=null;
  isArea = true;
  layer=null;//防区图层
  popElemt=null;
  // 防区source
  defenceSource = new ol.source.Vector();
  polygonLayer = new ol.layer.Vector({
      source: this.defenceSource,
      style: new ol.style.Style({
          fill: new ol.style.Fill({
              color: 'rgba(255,0,0,0.5)'
          }),
          stroke: new ol.style.Stroke({
              color: '#000',
              width: 2
          })
      })
  })
  // 菜单栏
  isShowSel = () => {
      if(this.state.isDisplay === 'none'){
          this.setState({
              isDisplay: 'flex'
          });
      }else{
          this.setState({
              isDisplay: 'none'
          });
      }
  }
  //加载防区
  loadDefence=() => {
      const that = this;
      //获取防区数据接口  每次获取100个多次请求
      const limit = 1000;
      let offset = 0;
      let isSendRequest = true; //是否需要发送请求
      getDefenceApi(offset, limit, (result) => {   //获取防区数据的回调函数
          if(result && result.Result){
              let _result = result.Result;
              let _len = _result.length;
              //判断是否需要再次请求
              isSendRequest = _len === limit ? true : false;
              offset = isSendRequest ? offset + limit : offset;
              if(_len > 0){
                  _result.forEach((item) => {//遍历防区
                      if(item.Points.length && item.Points.length > 0){
                          item.Points = item.Points.map((item) => {
                              let coord = item.split(',');
                              return getMapPoint(parseFloat(coord[1]), parseFloat(coord[0]));  //防区坐标点转换
                          });
                      }
                      //填充颜色转换 '#7fef585d'转rgba
                      if(item.FillColor !== ''){
                          item.FillColor = getArgbToRgba(item.FillColor);
                      }

                      //绘制防区 如果layer为undefined的时，创建图层并返回图层信息，保证所有防区都在一个图层
                      that.layer = drawPolygon(that.tmap, that.layer, item).layer;
                  });
              }
          }
      });
  }
  //绘制防区
  draw_polygon=() => {
      let that = this;
      that.draw = new ol.interaction.Draw({
          source: this.defenceSource,
          type: 'Polygon',
          style: new ol.style.Style({
              fill: new ol.style.Fill({
                  color: 'rgba(255,0,0,0.5)'
              }),
              stroke: new ol.style.Stroke({
                  color:'#f00',
                  width: 2
              })
          })
      });

      that.draw.on('drawstart', function(event){
      });
      // 监听线绘制结束事件，获取坐标
      that.draw.on('drawend', function(event){
          that.isArea = false;
          that.popElemt = document.getElementById('operate');
          let tooltipCoord = event.feature.getGeometry().getCoordinates();
          that.setState({ drawPointArr:tooltipCoord });
          let i = tooltipCoord[0].length - 2;
          //获取提示图标
          let areaOk = document.getElementById('areaOk');
          let areaNo = document.getElementById('areaNo');
          // 操作图标
          that.overlay = new ol.Overlay({
              element: that.popElemt,
              position: tooltipCoord[0][i],
              autoPan: true,
              autoPanAnimation: {
                  duration: 250
              }
          });
          that.tmap.addOverlay(that.overlay);
          that.popElemt.style.display = 'flex';
          //确认绘制
          areaOk.onclick = () => {
              that.areaOk();
          };
          //取消绘制
          areaNo.onclick = () => { //删除当前的feature
              that.areaCancel(that.popElemt);
          };
          that.tmap.removeInteraction(that.draw);
      });
  }
  addArea = (e) => {//添加防区
      let that = this;
      const { isSelected } = that.state;
      //移除地图单击事件
      that.tmap.removeEventListener('click');
      that.isArea = true;
      if(isSelected === e.target.dataset.i){
          that.setState({ isSelected:'' });
          that.isArea = false;
      }else{
          that.setState({ isSelected:e.target.dataset.i });
      }
      if(!that.isArea){
          return;
      }
      /**
     * 是否可以修改
     *  */
      // let modify = new ol.interaction.Modify({source: s});
      // tmap.addInteraction(modify);
      // let snap = new ol.interaction.Snap({source: s});
      // tmap.addInteraction(snap);
      if(!that.draw){
          that.draw_polygon();
      }
      that.tmap.addInteraction(that.draw);
  }
  // 鼠标点击地图选中要素  删除 or 修改
  ListMapClickFunc=() => {
      let that = this;
      const { isSelected } = that.state;
      //移除地图单击事件
      that.tmap.removeEventListener('click');
      //鼠标点击地图叠加要素监听函数
      that.tmap.on('click', function (evt) {
          let pixel = that.tmap.getEventPixel(evt.originalEvent);
          that.tmap.forEachFeatureAtPixel(pixel, function (feature, _layer) {
              if(_layer === that.layer){
                  if(isSelected === 'delete'){  //删除选中防区
                      that.showConfirm(() => {
                          let Code = feature.get('Code');
                          delDefenceApi(Code);
                          that.layer.getSource().removeFeature(feature, false);
                      });
                  }else if(isSelected === 'edit'){
                      //修改防区
                      let upData = {
                          'Code': feature.get('Code'),
                          'Name': feature.get('Name'),
                          'BorderColor': feature.get('BorderColor'),
                          'FontColor': feature.get('FontColor'),
                          'BoundaryWidth': feature.get('BoundaryWidth'),
                          'Layer': feature.get('Layer'),
                          'IsDottedLine':feature.get('IsDottedLine'),
                          'FillColor': feature.get('FillColor'),
                          'Points':feature.get('Points')
                      };
                      that.setState({ upData:upData, isShowSet:true, upFeature:feature });
                  }
              }
              return feature;
          });
      });
  }
  // 确认删除提示框
  showConfirm(delFun) {
      confirm({
          className:'confirmDelDefence',
          title: '是否删除此防区',
          onOk() {
              return new Promise((resolve, reject) => {

                  resolve(delFun());

              }).catch(() => {});
          },
          onCancel() {}
      });
  }
  // 删除选中防区
  delArea = (e) => {
      let that = this;
      const { isSelected } = that.state;
      if(isSelected === e.target.dataset.i){
          that.setState({ isSelected:'' });
          //移除地图单击事件
          that.tmap.removeEventListener('click');
      }else{
          that.setState({ isSelected:e.target.dataset.i }, () => {that.ListMapClickFunc();});
      }
      //移除绘制交互
      that.tmap.removeInteraction(that.draw);
  }
  // 修改防区
  updArea = (e) => {
      let that = this;
      const { isSelected } = that.state;
      if(isSelected === e.target.dataset.i){
          that.setState({ isSelected:'' });
          //移除地图单击事件
          that.tmap.removeEventListener('click');
      }else{
          that.setState({ isSelected:e.target.dataset.i }, that.ListMapClickFunc);
      }
  }

  //确认当前绘制
  areaOk = () => {
      this.setState({ isShowSet:true });
  }
  //删除当前绘制
  areaCancel = (element) => {
      this.defenceSource.clear();
      element.style.display = 'none';
  }
  //获取防区设置信息
  getSetInfo = (setInfo) => {
      let that = this;
      const { drawPointArr, isSelected, upFeature, upData } = this.state;
      let _mapPointArr, _draParm;
      _draParm = Object.assign({}, setInfo);
      this.setState({ isShowSet:false }, () => {if(that.popElemt && that.popElemt.style){that.popElemt.style.display = 'none';}});

      if(isSelected === 'edit'){  //修改
          _draParm.Points = upData.Points;
          setInfo.Points = upData.Points.map((item) => {let _mapPoint = getMapLngLat(item);return _mapPoint[1] + ',' + _mapPoint[0];});
          that.layer.getSource().removeFeature(upFeature);
      }else{  //新增
          if(drawPointArr[0]){
              _mapPointArr = drawPointArr[0].map((item) => {let _mapPoint = getMapLngLat(item);return _mapPoint[1] + ',' + _mapPoint[0];});
          }
          _draParm.Points = drawPointArr[0];
          //清除当前绘制的
          that.defenceSource.clear();
          setInfo.Points = _mapPointArr;
      }
      //填充颜色转换 '#7fef585d'转rgba
      _draParm.FillColor = getArgbToRgba(_draParm.FillColor);
      //重新绘制更新or添加的防区
      that.layer = drawPolygon(that.tmap, that.layer, _draParm).layer;
      //新增防区 刷后台数据
      if(isSelected === 'edit'){
          addDefenceApi(true, setInfo);
      }else{
          addDefenceApi(false, setInfo);
          that.setState({ isSelected:'' });
      }
  }
  //取消当前的设置
  cancelSet= () => {
      this.setState({ isShowSet:false });
  }

  render() {
      const { isShowSet, isDisplay, isSelected, upData } = this.state;
      return (
          <div className="drawDefence" map={this.props.map}>
              <div className="toolChildren areaCon" style={{ cursor:'pointer' }} onClick={this.isShowSel}>
                  <span className="areaIcon"></span>
            防区
              </div>
              <div className="areaOperation" style={{ display:isDisplay }}>
                  <Popover content={'添加防区'}><Icon type="folder-add" style={{ cursor:'pointer', top:'10px', backgroundColor:isSelected === 'add' ? '#FF9933' : '#fff' }} onClick={this.addArea} data-i="add"></Icon></Popover>
                  <Popover content={'删除防区'}><Icon type="delete" style={{ cursor:'pointer', backgroundColor:isSelected === 'delete' ? '#FF9933' : '#fff' }} onClick={this.delArea} data-i="delete"></Icon></Popover>
                  <Popover content={'修改防区'}><Icon type="edit" style={{ cursor:'pointer', backgroundColor:isSelected === 'edit' ? '#FF9933' : '#fff' }} onClick={this.updArea} data-i="edit"></Icon></Popover>
              </div>
              <div  id="operate">
                  <img id="areaNo" src={dels}/>
                  <img id="areaOk" src={confirmPic}/>
              </div>
              {isShowSet && <SetDefence  getSetInfo={this.getSetInfo} setType={isSelected} upData={upData} callBack={this.cancelSet}/>}
          </div>
      );
  }
}

export default DrawDefence;
