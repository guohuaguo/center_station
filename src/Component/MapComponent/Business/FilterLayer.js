
import React, { Component } from 'react';
import ol from 'openlayers';
import AddVisibleRange from './AddVisibleRange';
import { Button, Tree } from 'antd' ;
import '../style/index.less';
/* eslint-disable */
//可视域图层
let viewLayer = new ol.layer.Vector({
    source: new ol.source.Vector()
});
//树选择
const TreeNode = Tree.TreeNode;
const clusterDistance = 20;
class FilterLayer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLayer: false,
            isMarker: false,
            value: '',
            checkedKeys: ['0'],
            treeData: [
                {
                    title: '全选',
                    key: '0',
                    children: []
                }
            ]
        };
    }
    componentDidMount() {
        const {getMapPoint} = this.props;
        const that = this;
        if (!that.map) {
            that.map = this.props.map;
            that._getMapPoint=getMapPoint;
            that.map.addLayer(viewLayer);
            //  绑定地图缩放事件
            that.map.getView().on('change:resolution', that.zoomChangeHandle);
        }
    }
    componentWillReceiveProps(nextprops) {
        const that = this;
        const {layerData} = nextprops;
        //树形数据组装
        let _data = [];
        if(layerData.length!==0){
            if (!that.map) {
                that.map = nextprops.map;
            }
            that.createLayerGroup(that.map, that._getMapPoint, layerData);
            //组装树形数据
            layerData.map((item, idx) => {
                let dataArr = [];
                for(let key in item.children){
                    dataArr.push(item.children[key])
                }
                _data.push({
                    title: item.title,
                    key: '0-' + idx,
                    children: dataArr.map((item, index) => {
                        let _key = '0-' + idx + '-' + index;
                        return { title: item.title, key: _key };
                    })
                });
            });
            let treeData = [
                {
                    title: '全选',
                    key: '0',
                    children: _data
                }
            ];
            this.setState({treeData});
        }
    }
    //组件卸载前清除添加在地图上的图层
    componentWillUnmount(){
        const that = this;
        for (let key in that.layerGroupData) {
            that.map.removeLayer(that.layerGroupData[key]);
        }
        that.cluserLayerArr.forEach((item)=>that.map.removeLayer(item.layer));
    }
  layerGroupData = []; //所有子图层  0-0-0,0-0-1,0-1-0,0-1-1,0-2-0,
  map=null; //地图对象
  _getMapPoint;//点位转换
  zoomData=''; //地图级别
  cluserLayerArr = []; // 聚合图层

    //改变图层的显隐
  changeLayer = () => {
      const that = this;
      const { checkedKeys } = that.state;
      if(!(checkedKeys.find((item)=>item==='0')!==undefined)){
          that.cluserLayerArr.forEach((item)=>{
              item.layer.setVisible(false);
          })
          for (let key in that.layerGroupData) {
              that.layerGroupData[key].setVisible(false);
              checkedKeys.map((item, index) => {
                  if (that.layerGroupData[item]) {
                      that.layerGroupData[item].setVisible(true);
                  }
              });
          }
      }else{
          for (let key in that.layerGroupData) {
              that.layerGroupData[key].setVisible(true);
          }
      }
  };
  // 创建图层
  createLayers= (layerData) => {
      const that = this;
      const {getFilterLayerInfo}=this.props;
      layerData.map((item, index) => {
          let dataArr = [];
          for(let key in item.children){
              dataArr.push(item.children[key])
          }
          dataArr.map((itm, idx) => {
              that.layerGroupData['0-' + index + '-' + idx] = new ol.layer.Vector({
                  source: new ol.source.Vector()
              });
          });
      });
      //返回当前所有图层的信息
      if(getFilterLayerInfo){
          getFilterLayerInfo(that.layerGroupData);
      }

  }
  // 添加图层数据
createLayerGroup=(map, getMapPoint, layerData)=>{
    let that = this;
    this.createLayers(layerData);
    layerData.map((item, index) => {
        let dataArr = [];
        for(let key in item.children){
            dataArr.push(item.children[key])
        }
        dataArr.map((itm, idx) => {
            let subFeatures = [];
            itm.markInfo.map((subItem, subIndex) => {
                if(!!subItem.imgIcon){
                    //创建mark点位要素
                    let _subFeature = new ol.Feature({
                        geometry: new ol.geom.Point(getMapPoint(subItem.coord[0], subItem.coord[1])),
                        Id:subItem.id,
                        // mark信息
                        MarkName:subItem.markName,
                        MarkCode:subItem.markCode,
                        MarkerDesc:subItem.markerDesc,
                        MarkerStreet:subItem.markerStreet,
                        MarkerType:subItem.markerType,
                        MarkerAngle:subItem.markerAngle,
                        // 设备信息
                        DeviceCode:subItem.deviceCode,
                        DeviceName:subItem.deviceName,
                        CreateTime:subItem.createTime,
                        UserName:subItem.userName,
                        // 可视域半径、可视域角度
                        ViewSheds:subItem.viewSheds,
                        ViewAngle:subItem.viewAngle,
                        // 图层信息
                        LayerType:subItem.layerType,
                        LayerCode:subItem.layerCode,
                        Lng:subItem.coord[0],
                        Lat:subItem.coord[1]

                    });
                    // 要素样式设置
                    _subFeature.setStyle(
                        new ol.style.Style({
                            image: new ol.style.Icon({
                                src:subItem.imgIcon?subItem.imgIcon:'',
                                anchorXUnits: 'fraction',
                                anchorYUnits: 'pixels',
                                crossOrigin: 'anonymous',
                                scale: 1, //标注图标大小
                                offsetOrigin: 'top-left',
                                offset:subItem.offset || subItem.offset,
                                size:[24,24]
                            }),
                            text: new ol.style.Text({
                                offsetX: 0,
                                offsetY: -10,
                                text:subItem.markName,
                                fill: new ol.style.Fill({ color: '#00f' })
                            })
                        })
                    );
                    subFeatures.push(_subFeature);
                    if(subItem.viewSheds&&subItem.layerType===0){
                        //可视域数据组装
                        let options = {
                            map:map,
                            origin:getMapPoint(subItem.coord[0], subItem.coord[1]),
                            radius:subItem.viewSheds,
                            viewAngle:subItem.viewAngle,
                            markerAngle:subItem.markerAngle,
                            viewLayer:viewLayer,
                            featureObj:_subFeature
                        }
                        //添加可视域
                        AddVisibleRange.rotatedAngleHandel(options);
                    }
                }
            });
            that.layerGroupData['0-' + index + '-' + idx]&&that.layerGroupData['0-' + index + '-' + idx]
                .getSource()
                .addFeatures(subFeatures);
        });
    });
    for (let key in that.layerGroupData) {
        that.cluserLayerArr.push({layer:that.layerGroupData[key], source:that.layerGroupData[key].getSource(), key:key});
        // 判断当前的级别是否聚合
        let _zoom = that.map.getView().getZoom();
        if(_zoom<15){
            that.addClusterLayer(that.layerGroupData[key], that.layerGroupData[key].getSource(), key);
            viewLayer.setVisible(false);
        }
        that.map.addLayer(that.layerGroupData[key]);   //将图层组添加到地图上
    }
}

  // 添加聚合图层
  addClusterLayer = (layer, featureSource, key)=>{
      //添加为聚合资源
      if(!layer){
          return;
      }
      let _clusterSource = new ol.source.Cluster({
          distance: clusterDistance,
          source: featureSource
      });
      layer.setSource(_clusterSource);
      //设置聚类样式
      function setClusterStyle(feature) {
          // key = '0-0-*'为相机   '0-1-*'为卡口s
          let iconType = '';
          if(key&&key.includes('0-1-')){
              iconType = 'tollgateCluster';
          }else if(key&&key.includes('0-0-')){
              iconType = 'cameraCluster';
          }
          let features = feature.get('features');
          let size = features.length;
          let style='';
          // 聚合图片选择
          let iconName = '';
          if(size>64){
              iconName = 64;
          }else if(size>48){
              iconName = 48;
          }else{
              iconName = 32;
          }
          style = [new ol.style.Style({
              image: new ol.style.Icon({
                  src:iconType!==''&&require(`../Image/${iconType+iconName}.png`),
                  anchorXUnits: 'fraction',
                  anchorYUnits: 'pixels',
                  crossOrigin: 'anonymous',
                  scale: 1, //标注图标大小
                  offsetOrigin: 'bottom-center'
              }),
              text: new ol.style.Text({
                  offsetX: 0,
                  offsetY: size>64?30:(size>48?20:15),
                  font: '10px sans-serif',
                  text: size.toString(),
                  fill: new ol.style.Fill({
                      color: '#fff'
                  })
              })
          })];
          return style;
      }
      layer.setStyle(function(feature) {  //设置图层样式);
          return setClusterStyle(feature);
      })
  }
  //地图缩放和移动处理事件  g05047  20181107
  zoomChangeHandle=()=>{
      let that = this;
      let zoom = that.map.getView().getZoom();
      that.zoomData=zoom;

      let timer = setTimeout(()=>{
          if(zoom===that.zoomData){
              //if zoom<15 级 为聚合图层
              if(zoom<15){
                  that.cluserLayerArr.forEach((item)=>{
                      item&&that.addClusterLayer(item.layer, item.source, item.key);
                      viewLayer.setVisible(false);
                  })
              }else{
                  that.cluserLayerArr.forEach((item)=>{
                      item&&item.layer.setSource(item.source);
                      viewLayer.setVisible(true);
                  })
                 
              }
          }else{
              clearInterval(timer);
          }
      }, 1000)
  }

  onExpand = (expandedKeys) => {
      this.setState({
          expandedKeys,
          autoExpandParent: false
      });
  };
  //选中的列表
  onCheck = (checkedKeys) => {
      this.setState({ checkedKeys });
  };

  renderTreeNodes = (data) => {
      return data.map((item) => {
          if (item.children) {
              return (
                  <TreeNode title={item.title} key={item.key} dataRef={item}>
                      {this.renderTreeNodes(item.children)}
                  </TreeNode>
              );
          }
          return <TreeNode {...item} />;
      });
  };

  //menu的显示开关
  layerSelect = () => {
      if (this.state.isLayer) {
          this.setState({
              isLayer: false
          });
      } else {
          this.setState({
              isLayer: true
          });
      }
  };

  render() {
      const {treeData} = this.state;
      return (
          <div className="layerChange">
              <div className="toolChildren layerCon" onClick={this.layerSelect}>
                  <span className="layerIcon" />
                      图层
              </div>
              {this.state.isLayer && (
                  <div className="layer-select">
                      <Tree
                          checkable
                          onExpand={this.onExpand}
                          expandedKeys={this.state.expandedKeys}
                          autoExpandParent={this.state.autoExpandParent}
                          onCheck={this.onCheck}
                          checkedKeys={this.state.checkedKeys}
                          selectedKeys={this.state.checkedKeys}
                          defaultExpandAll
                      >
                          {this.renderTreeNodes(treeData)}
                      </Tree>
                      <div className="footer">
                          <Button type="primary" onClick={this.changeLayer}>
                              确定
                          </Button>
                          <Button className="btn" onClick={this.layerSelect}>
                              取消
                          </Button>
                      </div>
                  </div>
              )}
          </div>
      );
  }
}
export default FilterLayer;
