#参数说明：
  options：{}    组件参数
  coords:[]      坐标
  coordsArray:[[],[]] 坐标组
  coordsArrayObj:[{},{}] 类对象数组
  lon: Number    经度  
  lat: Number    纬度 
  center:[]      地图中心坐标 
  icon：String   图标
  startIcon:String  起始图标
  endIcon:String  结束图标
  callBack: Function 回调函数

#导入组件
import { UnvMap, GAServerRestful } from "./BaseComponent";
import {LocationPoint, Location, HeatMap,FilterFeature,DistanceMeasure,LayerChange} from "./MapComponent";


注意：以下组件的props不需要传map参数的的组件都是自带地图的，需要传map参数的组件的方法执行都是在
 <UnvMap
          onMapLoaded={this.onMapLoaded}
          ref={self => {
            this.map = self;
          }}
        />

的onMapLoaded方法中执行的。（地图加载完成之后加载）
#基础方法
let map =this.map.getBaseMap();   //获取当前地图对象

add：
map.addLayer(layer)       //添加矢量图层
map.addLayers([layer]);   //添加矢量图层
map.addOverLay()          //添加overLayer

remove:
map.removeLayer(layer);   //移除矢量图层
map.removeOverlay(overlay);  //移除overlay

get:
map.getView().getZoom()/getCenter();
layer.getSource();
set:
map.getView().setCenter();/setZomm()



在图层中添加要素：
layer.getSource().addFeatures([feature]);

map对象的一系列设置参考openlayer官网

this.map.addIcon(coords,icon);  //在地图上添加点位    coords=[lon,lat] //点位坐标   icon:图标
this.map.addLine(coordsArray);   //在地图上绘制线     coordsArray=[[lon,lat],[lon,lat]]  点集
that.map.addHeatMap(coordsArrayObj); //添加热力图     coordsArrayObj=[{coords:[120.198636, 30.2785820],count:1}]  //热力点

#1.定位组件LocationPoint(没有交互)    无需加载地图
<LocationPoint
          options={{coords:[120.198636, 30.2785820],icon:'cat.png'}}
        />

#2.定位组件Location(有交互) 无需加载地图
  //callBack会返回选取的坐标信息
<Location
           options={{coords:[120.198636, 30.2785820],icon:'cat.png',callBack:(data)=>console.log(data)}}
        />
#3.热力图组件 无需加载地图
 //coordsArrayObj:点位数组    center：地图中心位置
<HeatMap 
          options={{coordsArrayObj:[{coords:[120.198636, 30.2785820],count:1}],center:[120.198636, 30.2785820]}}
        />
#4.测量  需加载地图
//map:是map对象，isMeasure:是否取消测量  true(可以测量)false(取消测量)

DistanceMeasure.measuree(map,isMeasure);    //测量
#5.要素框选组件 需加载地图
//drawType:  "Circle"、"LineString","Rectangle","Polygon" 

let options={
      map:map,     //map对象
      featureLayer：featureLayer,//要框选的要素所在的图层
      drawType:"Circle",  //框选类型
      getMapPoint:getMapPoint,   //84坐标转换经纬度  that.map.getMapPoint
      callBack:data=>console.log(data)  //回调函数可以返回框选的数据
    }

 FilterFeature.selectFeatures(options);    //框选要素
 FilterFeature.handleClean(map);//清除框选
 #7.图层显示筛选  需加载地图
  //组件接受的参数格式[{typeName:'',layerArr:[{title:'',layer:图层}]}]
  //参数
    let layerData = [{
      typeName:'摄像机',
      layerArr:[
        {title:'视频专网',layer:videoLayer},
        {title:'公安自建',layer:gaLayer}
      ]
    },{
      typeName:'卡口',
      layerArr:[
        {title:'卡口',layer:tollgalLayer}
      ]
    }]

 <LayerChange  map={map} layerData={layerData}/>
#6.轨迹组件 无需加载地图
<Track 
          options={{coordsArray:[[120.14805, 30.26971],[120.14805, 30.26971]],startIcon:"startIcon.png",endIcon:"endIcon.png"}}/>
        />

#7.无地图服务 加载1000点 
  //参数： map：地图对象    getMapPoint：经纬度转地图点位 

  <NoMapServer map={map} getMapPoint={getMapPoint}/>

#8.gps推送支持websocket
   //参数  map：地图对象    getMapPoint：经纬度转地图点位  mapIp：map服务器ip
<MonitorGps map={map} getMapPoint={getMapPoint} mapIp={mapIp}/> 

#9.强业务组件的动态可视域支持

#10.地图加载摄像机、卡口的强业务组件

#11.使用地图组件开发的加载GPS、防区的强业务组件

    ##防区：
      //参数： map：地图对象    getMapPoint：经纬度转地图点位   getMapLngLat：地图点位转经纬度
    <DrawDefence  map={map} getMapPoint={getMapPoint} getMapLngLat={getMapLngLat}/>

#12.地图组件及强业务组件的imosSdk.js接口







<!-- #7.地图上设备框选要素业务组件   无需加载地图
//mapSelectData:[{coords:[108.967213, 34.276221],icon:endIcon,name:"设备",text:"设备"}]    //设备数据

<MapSelect mapSelectData={mapSelectData}/>

#8.图层筛选(强业务组件)   需加载地图
//map:map对象   getMapPoint:经纬度转地图坐标  layerData:图层数据   callBack：返回图层信息
//layerData=[
  {
    title: "摄像机",
    children: {
      '1':{ title: "视频专网", markInfo:[{markName:'123',markCode:'123',coord:[108.967213, 34.276221]}], icon: imgs,layerCode:1},
      '2':{ title: "公安自建", markInfo:[{markName:'123',markCode:'123',coord:[109.967213, 34.276221]}], icon: imgs,layerCode:2 },
      '3':{ title: "社会资源", markInfo:[{markName:'123',markCode:'123',coord:[118.967213, 34.276221]}], icon: imgs,layerCode:3 }
    },
    layerType:0
  },
  {
    title: "卡口",
    children: {
      '4':{ title: "卡口", markInfo:[{markName:'123',markCode:'123',coord:[120.967213, 34.276221]}], icon: point_pink,layerCode:4}
    },
    layerType:1
  }];

 <FilterLayer map={map} getMapPoint={getMapPoint}  layerData={layerData} callBack={data=>console.log(data)}/> -->
 





增加依赖：

 import html2canvas from 'html2canvas';   //动态可视域中用

