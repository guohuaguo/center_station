import axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom';
import { Popover } from 'antd';
import ol from 'openlayers';
let lay = [];
/**
 * @private
 * @method 不加载路网数据时的轨迹
 * @returns {string}
 */
function drawTrackLine(UnvMapObj, coordsArray, lineAttr, lineStyle, trackLayer, callBack, isLine) {
    //不查询路网
    let lineDataArr = coordsArray.map((item) => {
        let _coord = UnvMapObj.getWGS2Mars(item.Position.Lng, item.Position.Lat)
        return UnvMapObj.getMapPoint(_coord[0], _coord[1]);
    }

    );
    // 画线
    console.log({ coordArr: lineDataArr, lineAttr, lineStyle })
    let lineFeatures = UnvMapObj.createLine([{ coordArr: lineDataArr, lineAttr, lineStyle }]);
    if (isLine) {
        trackLayer.getSource().addFeatures(lineFeatures);
        lay.forEach(item => {
            UnvMapObj.removeOverlay(item)
        })
    } else {
        UnvMapObj.removeLayer(trackLayer);
        lay.forEach(item => {
            UnvMapObj.removeOverlay(item)
        })

    }
    //自适应
    let area = lineFeatures[0].getGeometry().getExtent();
    UnvMapObj.getView().fit(area, {
        padding: [300, 300, 300, 150],
        constrainResolution: false,
        nearest: true
    });

    if (callBack && typeof callBack === 'function') {
        callBack();
    }
}
/**
 * 请求路网数据
 * @param {Object} UnvMapObj 地图对象
 * @param {Array} coordsArray 线请求参数
 * @param {Object} lineStyle 线的样式
 * @param {String} lineAttr 线的属性
 * @param {Object} trackLayer 图层
 * @param {Fun} callBack  回调函数
 *
*/
function getRoadNetData(UnvMapObj, coordsArray, lineStyle, lineAttr, trackLayer, callBack, isLine) {
    //调接口得到路网数据
    axios({
        method: 'POST',
        url: '/map/api/roadmap?isface=true',
        data: coordsArray || []
    }).then((res) => {
        if (Object.is(res.data.ErrCode, 0)) {
            //将路网数据画到地图上
            let lineDataArr = [];
            // lineDataArr.push(UnvMapObj.getMapPoint(startPosition.Lng, startPosition.Lat));
            //数据组装
            res.data.TrajectoryItems.forEach(
                (partLineData) => {
                    lineDataArr.push(UnvMapObj.getMapPoint(partLineData.StartPoint.Position.Lng, partLineData.StartPoint.Position.Lat));
                    partLineData.Points && partLineData.Points.forEach(
                        (partPointData) => {
                            lineDataArr.push(UnvMapObj.getMapPoint(partPointData.Lng, partPointData.Lat));
                        }
                    );
                    lineDataArr.push(UnvMapObj.getMapPoint(partLineData.EndPoint.Position.Lng, partLineData.EndPoint.Position.Lat));
                }
            );
            // 画线
            let lineFeatures = UnvMapObj.createLine([{ coordArr: lineDataArr, lineAttr, lineStyle }]);
            trackLayer.getSource().addFeatures(lineFeatures);
            // 添加点
            if (callBack && typeof callBack === 'function') {
                callBack();
            }
        } else {
            drawTrackLine(UnvMapObj, coordsArray, lineAttr, lineStyle, trackLayer, callBack);
        }
    }).catch((err) => {
        drawTrackLine(UnvMapObj, coordsArray, lineAttr, lineStyle, trackLayer, callBack, isLine);
    });
}
/**
     * @private
     * @method 生成guid唯一编码
     * @returns {string} 唯一编码
     */
function _guid() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
}
/**
 * 添加线上的点位
 * @param {Object} UnvMapObj 地图对象
 * @param {Array} pointArr 点集合
 * @param {Array} trackLayer 轨迹图层
*/
function addPointOnLine(UnvMapObj, pointArr) {
    pointArr.forEach((item) => {
        let id = item.id || _guid();
        let divDom = document.createElement('div');
        divDom.style.position = 'relative';
        divDom.setAttribute('id', `${id}`);
        const content = item.popupContent;
        //报警点绘制
        let newOverlay = new ol.Overlay({
            id: id,
            position: item.coord,
            positioning: 'center-center',
            element: divDom,
            stopEvent: false
        });
        lay.push(newOverlay)
        UnvMapObj.addOverlay(newOverlay);
        ReactDOM.render(
            <React.Fragment>
                {item.popupVisible ? <Popover content={content} visible placement="top" trigger={item.trigger || ''} getPopupContainer={() => document.getElementById(id)}>
                    <span style={item.pointStyle}>{item.pointStyle.text}</span>
                </Popover> : <Popover content={content} placement="top" trigger={item.trigger || ''} getPopupContainer={() => document.getElementById(id)}>
                        <span style={item.pointStyle}>{item.pointStyle.text}</span>
                    </Popover>}
            </React.Fragment>,
            divDom);
    });
}
/**
 * 加载轨迹数据
 * @param {Array} trackArr 轨迹集合 [{}]
 * @param {Object} UnvMapObj 地图对象
*/
function addTrack(trackArr, UnvMapObj, trackLayer, isLine) {
    // 1、画线
    trackArr.forEach((lineObj) => {
        let partLineArr = [];   //路网请求的坐标参数
        let pointArr = [];   //点位坐标
        partLineArr = lineObj.lineArrPoint.map((item) => {
            let _coord = UnvMapObj.getWGS2Mars(item.coord[0], item.coord[1])
            pointArr.push({
                coord: UnvMapObj.getMapPoint(_coord[0], _coord[1]),
                pointStyle: item.pointStyle,
                popupContent: item.popupContent,
                trigger: item.trigger,
                popupVisible: item.popupVisible,
                id: item.id
            });
            return { Position: { Lng: item.coord[0], Lat: item.coord[1] }, ConnectTime: item.ConnectTime };
        });
        getRoadNetData(UnvMapObj, partLineArr, lineObj.lineStyle, lineObj.lineAttr, trackLayer, () => addPointOnLine(UnvMapObj, pointArr, trackLayer), isLine);
    });
}

export default addTrack;