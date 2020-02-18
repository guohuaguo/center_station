/**
 * 基础地图模块
 * @Date 2017-3-8
 */
import ol from 'openlayers';
import '../style/index.less';
import del from '../Image/del_.png';
let draw;
let source;
let drawLayer;
let measureTooltiplist = [];
//创建一个当前要绘制的对象
let sketch = new ol.Feature();
//创建一个帮助提示框对象
let helpTooltipElement;
//创建一个帮助提示信息对象
let helpTooltip;
//创建一个测量提示框对象
let measureTooltipElement;
//创建一个测量提示信息对象
let measureTooltip;
let measureType;
//定义一个控制鼠标点击次数的变量
let count = 0;
function handeClean(map){
    measureTooltiplist.map((item) => {
        map.removeOverlay(item);
    });
    measureTooltiplist = [];
    //map.removeOverlay(helpTooltip);
    map.removeOverlay(measureTooltip);
    // map.removeInteraction(draw);
    source && source.clear();
    //count=0;
}
//创建测量提示框
function createMeasureTooltip(map) {
    //创建测量提示框的div
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.setAttribute('id', 'lengthLabel');
    //设置测量提示要素的样式
    measureTooltipElement.className = 'tooltip tooltip-measure';
    //创建一个测量提示的覆盖标注
    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    //将测量提示的覆盖标注添加到地图中
    map.addOverlay(measureTooltip);
    measureTooltiplist.push(measureTooltip);
}

//创建帮助提示框
function createHelpTooltip(map) {
    //如果已经存在帮助提示框则移除
    // if (helpTooltipElement&&helpTooltipElement.parentNode.removeChild) {
    //   helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    // }
    //创建帮助提示要素的div
    helpTooltipElement = document.createElement('div');
    //设置帮助提示要素的样式
    helpTooltipElement.className = 'tooltip hidden';
    //创建一个帮助提示的覆盖标注
    helpTooltip = new ol.Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
    });
    //将帮助提示的覆盖标注添加到地图中
    map.addOverlay(helpTooltip);
}
//格式化测量长度
function formatLength(map, line) {
    //定义长度变量
    let length;
    //计算平面距离
    length = Math.round(line.getLength() * 100) / 100;
    //定义输出变量
    let output;
    //如果长度大于1000，则使用km单位，否则使用m单位
    if (length > 1000) {
        output = Math.round(length / 1000 * 100) / 100 + ' ' + 'km'; //换算成KM单位
    } else {
        output = Math.round(length * 100) / 100 + ' ' + 'm'; //m为单位
    }
    return output;
}
//添加交互式绘图对象的函数
function addInteraction(map) {
    //创建一个交互式绘图对象
    draw = new ol.interaction.Draw({
        //绘制的数据源
        source: source,
        //绘制类型
        type: 'LineString',
        //样式
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255,255,255,1)'
            }),
            stroke: new ol.style.Stroke({
                width: 2,
                color:'#00f'
            }),
            image: new ol.style.Circle({
                radius: 3,
                stroke: new ol.style.Stroke({
                    color: 'rgba(255,0,0,1)'
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255,255,255,1)'
                })
            })
        })
    });
    //将交互绘图对象添加到地图中
    map.addInteraction(draw);
    //创建测量提示框
    createMeasureTooltip(map);
    //创建帮助提示框
    createHelpTooltip(map);

    //定义一个事件监听
    let listener;

    //绘制开始事件
    draw.on(
        'drawstart',
        function(evt) {
        //The feature being drawn.
            handeClean(map);
            sketch = evt.feature;
            //提示框的坐标
            let tooltipCoord = evt.coordinate;
            //地图单击事件
            map.on('singleclick', function(evt) {
            //设置测量提示信息的位置坐标，用来确定鼠标点击后测量提示框的位置
                measureTooltip.setPosition(evt.coordinate);
                //如果是第一次点击，则设置测量提示框的文本内容为起点
                if (count === 0) {
                    measureTooltipElement.innerHTML = '0km';
                }
                //根据鼠标点击位置生成一个点
                let point = new ol.geom.Point(evt.coordinate);
                //将该点要素添加到矢量数据源中
                source.addFeature(new ol.Feature(point));
                //更改测量提示框的样式，使测量提示框可见
                measureTooltipElement.className = 'tooltip tooltip-static';
                //创建测量提示框
                createMeasureTooltip(map);
                //点击次数增加
                count++;
            });
            //监听几何要素的change事件
            //Increases the revision counter and dispatches a 'change' event.

            listener = sketch.getGeometry().on('change', function(evt) {
                //The event target.
                //获取绘制的几何对象
                let geom = evt.target;
                //定义一个输出对象，用于记录面积和长度
                let output;
                if (geom instanceof ol.geom.LineString) {
                    //输出多线段的长度
                    output = formatLength(map, geom);
                    //获取多线段的最后一个点的坐标
                    tooltipCoord = geom.getLastCoordinate();
                }
                //设置测量提示框的内标签为最终输出结果
                measureTooltipElement.innerHTML = output;
                //设置测量提示信息的位置坐标
                measureTooltip.setPosition(tooltipCoord);
            });
            //地图双击事件
            map.on('dblclick', function(evt) {
                let point = new ol.geom.Point(evt.coordinate);
                source.addFeature(new ol.Feature(point));


                let _feature = new ol.Feature({
                    geometry: new ol.geom.Point(evt.coordinate),
                    name:'del'
                });
                _feature.setStyle(
                    new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [-1, 5],
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'pixels',
                            src: del,
                            crossOrigin: 'anonymous',
                            offsetOrigin: 'top-left',
                            offset: [0, 0],
                            scale: 1 //标注图标大小
                        })
                    })
                );
                source.addFeature(_feature);
                map.removeInteraction(draw);
            });
        },
        this
    );
    //绘制结束事件
    draw.on(
        'drawend',
        function(evt) {
            count = 0;
            //设置测量提示框的样式
            measureTooltipElement.className = 'tooltip tooltip-static';
            //设置偏移量
            measureTooltip.setOffset([0, -7]);
            measureTooltiplist.push(measureTooltip);//记录测距记录点位
            //清空绘制要素
            sketch = null;
            //清空测量提示要素
            measureTooltipElement = null;
            //创建测量提示框
            createMeasureTooltip(map);
            //移除事件监听
            ol.Observable.unByKey(listener);
            //移除地图单击事件
            map.removeEventListener('singleclick');
            /**
         * 鼠标点击的事件
         */
            map.on('click', function(evt) {
                let pixel = map.getEventPixel(evt.originalEvent);
                let feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                    return feature;
                });
                if((feature !== undefined) && feature.get('name') === 'del'){
                    handeClean(map);
                    map.addInteraction(draw);
                }
            });

        },
        this
    );
}

function _measure(map) {
    map.removeLayer(drawLayer);
    map.removeOverlay(helpTooltip);
    map.removeOverlay(measureTooltip);
    //定义矢量数据源
    source = new ol.source.Vector();
    //定义矢量图层
    drawLayer = new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255,255,255,1)'
            }),
            stroke: new ol.style.Stroke({
                color: '#f00',
                width: 2
            }),
            image: new ol.style.Circle({
                radius:3,
                stroke: new ol.style.Stroke({
                    color: 'rgba(255,0,0,1)'
                }),
                fill: new ol.style.Fill({
                    color: '#fff'
                })
            })
        })
    });
    //将矢量图层添加到地图中
    map.addLayer(drawLayer);

    //继续绘制线段的提示信息
    let continueLineMsg = '单击以继续绘制直线';

    //鼠标移动触发的函数
    let pointerMoveHandler = function(evt) {
    //Indicates if the map is currently being dragged.
    //Only set for POINTERDRAG and POINTERMOVE events. Default is false.
    //如果是平移地图则直接结束
        if (evt.dragging) {
            return;
        }
        //帮助提示信息
        let helpMsg = '单击开始';

        if (sketch) {
            //获取绘图对象的几何要素
            let geom = sketch.getGeometry();
            //如果当前绘制的几何要素是多线段，则将绘制提示信息设置为多线段绘制提示信息
            if (geom instanceof ol.geom.LineString) {
                helpMsg = continueLineMsg;
            }
        }
        //设置帮助提示要素的内标签为帮助提示信息
        helpTooltipElement.innerHTML = helpMsg;
        //设置帮助提示信息的位置
        helpTooltip.setPosition(evt.coordinate);
    };
    //触发pointermove事件
    map.on('pointermove', pointerMoveHandler);
    //添加交互绘图对象
    addInteraction(map);
}
function measure(map, isMeasure){
    if(!!isMeasure){
        _measure(map);
    }else{
        map.removeInteraction(draw);
        handeClean(map);
        map.removeLayer(drawLayer);
        if (helpTooltipElement) {
            helpTooltipElement.parentNode && helpTooltipElement.parentNode.removeChild && helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
    }
}
class DistanceMeasure{
  static measure=measure;
}

export default DistanceMeasure;
