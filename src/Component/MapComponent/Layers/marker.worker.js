import cameraImg from '../Image/camera_sprite24x.png';
import tollgateImg from '../Image/tollgate_sprite24x.png';
import axios from 'axios';
let token = ''; //VIID token
let organization = '';  //本域组织编码
let mapType = ''; //map地图类型
let layerType = []; //用户需要的图层分类编码
let layersIconName = {}; //接口获取的图层的IconName信息
let userCamera = {}; //用户拥有权限的摄像机  /VIID/query/list/for/map接口获取
let userTollgate = {}; //用户拥有权限的相机  /VIID/query接口获取
let markers = {};  //点位信息(除卡口外)  /api/marker/client接口获取
let tollgate = {}; //卡口信息  /VIID/query/tollgate接口获取
let otherMarkers = {   //用于日志记录定位（未加载的点）
    noNeedLayer: [],
    errorCoordinate: [],
    noIconName: [],
    noRightmarkTypePic: []
};
/**
 * 接口获取的点位数据筛选、组装
 * @param {Array} result 点位数据
 */
function dealMacker(result) {
    result.forEach((item) => {
        // 图片名称拼接规则 markTypePic-item.MarkerType-item.DeviceStatus===0 ? 2 : 1 .png
        //如果点位不是所需图层分类的点位，则去除
        if (!layerType.includes(item.LayerType)) {
            otherMarkers.noNeedLayer.push(item);
            return;
        }
        //如果点位坐标有误，则去除（防止openlayer加载卡死）
        if (typeof item.Lng !== 'number' || typeof item.Lat !== 'number') {
            otherMarkers.errorCoordinate.push(item);
            return;
        }
        //如果图层信息的IconName不存在，则去除
        if (!layersIconName[item.LayerType] || !layersIconName[item.LayerType][item.LayerCode]) {
            otherMarkers.noIconName.push(item);
            return;
        }
        // 图片类型
        let markTypePic = parseInt(layersIconName[item.LayerType][item.LayerCode]);
        let image = null;
        let startX = null;
        let startY = null;
        //如果设备编码为空的话可能是拟建点位，需添加到地图上
        //用户有权限的摄像机、卡口需要添加到地图上
        if (!item.DeviceCode || userCamera[item.DeviceCode] || userTollgate[item.TollgateCode]) {
            // 1.判断是相机还是卡口还是其他
            if (markTypePic < 30000 && markTypePic >= 20000) {//摄像机
                //如果是相机加载相机精灵图
                image = cameraImg;
                //获取精灵图中对应小图标的位置
                startY = (markTypePic % 20000) * 4 * 24;
                //isOnline   1在线   2离线
                let isOnline = item.DeviceStatus;
                if (userCamera[item.DeviceCode]) {
                    isOnline = userCamera[item.DeviceCode].ResStatus;
                }
                startX = (1 === isOnline || 4 === isOnline) ? 0 : ((2 === isOnline || 0 === isOnline) ? 24 : 48);
                if (item.MarkerType <= 2) {
                    startY = startY + (item.MarkerType - 1) * 24;
                } else if (item.MarkerType === 7) {
                    startY = startY + 2 * 24;
                } else if (item.MarkerType === 8) {
                    startY = startY + 3 * 24;
                }
            } else if (markTypePic >= 30000) {
                //如果是卡口加载卡口精灵图
                image = tollgateImg;
                //获取精灵图中对应小图标的位置
                startY = (markTypePic % 30000) * 24;
                //isOnline   1在线   2离线
                //卡口状态全默认显示在线，不做以下判断：
                //let isOnline = item.DeviceStatus;
                //if(userTollgate[item.DeviceCode]){
                //    isOnline = userTollgate[item.DeviceCode].ResStatus;
                //}
                //startX = 1 === isOnline ? 0 : (2 === isOnline ? 24 : 48);
                startX = 0;
            }
        }
        //如果图片、图片位置不存在，则去除
        if (null === image || null === startX || null === startY) {
            otherMarkers.noRightmarkTypePic.push(Object.assign({}, item, {
                markTypePic: markTypePic
            }));
            return;
        }
        let newItem = Object.assign({}, item, {
            image,
            offset: [startX, startY]
        });
        //卡口点位加载到tollgate中
        if (1 === item.LayerType) {
            //卡口点位要求以tbl_tollgate为主，以tbl_mapmarker_cs为辅
            if (!tollgate[item.DeviceCode]) {
                tollgate[item.DeviceCode] = newItem;
            }
        } else {
            //其他点位加载到markers
            markers[item.LayerType].push(newItem);
        }
    });
}
/**
 * Map服务为8500时，从VM中读取所有摄像机、卡口点位
 * @param {Number} offset 初始查询数
 * @param {Number} limit 查询数目
 */
function getMarkerInfo(offset = 0, limit = 5000) {
    let queryParams = {
        url: '/api/marker/client',   //webclient
        method: 'GET',
        params: {
            offset: offset,
            limit: limit,
            maptype: '8500' === mapType ? 0 : -1  //0： 有8500地图服务  1：有9500服务 -1：没有地图服务
        }
    };
    axios(queryParams).then((res) => {
        let data = res.data;
        if (data instanceof Array) {
            dealMacker(data);
            if (data.length === limit) {
                getMarkerInfo(offset + limit, limit);
            } else {
                markers[1] = Object.values(tollgate);
                console.info('otherMarkers', otherMarkers);
                console.info('markers', markers);
                postMessage(JSON.stringify(markers));
            }
        }
    }).catch((err) => {
        console.error(err);
    });
}
/**
 * 接口获取的卡口点位数据筛选、组装
 * @param {Array} result 卡口点位数据
 */
function dealTollgate(result) {
    //如果图层信息的IconName不存在，则去除
    if (!layersIconName[1]) {
        return;
    }
    let markTypeAry = Object.values(layersIconName[1]);
    if (0 === markTypeAry.length) {
        return;
    }
    //默认加载到第一个卡口分类图层中
    let LayerCode = Object.keys(layersIconName[1])[0];
    result.forEach((item) => {
        //如果点位坐标有误，则去除（防止openlayer加载卡死）
        if (!item.Longitude || !item.Latitude) {
            otherMarkers.errorCoordinate.push(item);
            return;
        }
        //如果卡口编码为空的话可能是拟建点位，需添加到地图上
        //用户有权限的需要添加到地图上
        if (!item.TollgateCode || userTollgate[item.TollgateCode]) {
            //获取精灵图中对应小图标的位置
            let startX = (markTypeAry[0] % 30000) * 24;
            //isOnline   1在线   2离线
            let isOnline = item.IsOnline;
            if (userTollgate[item.TollgateCode]) {
                isOnline = userTollgate[item.TollgateCode].ResStatus;
            }
            let startY = 1 === isOnline ? 0 : (2 === isOnline ? 24 : 48);
            tollgate[item.TollgateCode] = {
                LayerCode,
                Lng: item.Longitude - 0,
                Lat: item.Latitude - 0,
                MarkerName: item.TollgateName,
                MarkerCode: item.TollgateCode,
                image: tollgateImg,
                offset: [startX, startY]
            };
        }
    });
}
/**
 * 读取所有卡口点位
 * @param {Number} offset 初始查询数
 * @param {Number} limit 查询数目
 */
function getTollgate(offset = 0, limit = 200) {
    //如果卡口不是所需的图层分类，则不加载
    if (!layerType.includes(1)) {
        //直接获取其他点位信息
        getMarkerInfo();
        return;
    }
    new Promise(function (resolve, reject) {
        axios({
            url: '/VIID/query/tollgate',   //webclient
            method: 'GET',
            params: {
                code: organization,
                condition: {
                    ItemNum: 1,
                    Condition: [{
                        QueryType: 257,
                        LogicFlag: 0,
                        QueryData: '1'
                    }],
                    QueryCount: 1,
                    PageFirstRowNumber: offset,
                    PageRowNum: limit
                }
            },
            timeout: 30000,
            headers: {
                Authorization: token,
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            resolve(res);
        }).catch((err) => {
            reject(err);
        });
    }).then((res) => {
        let data = res.data;
        if (data && 0 === data.ErrCode && data.Result) {
            if (data.Result.InfoList instanceof Array) {
                dealTollgate(data.Result.InfoList);
            }
            if (data.Result.TotalRowNum > offset + limit) {
                getTollgate(offset + limit, limit);
            } else {
                getMarkerInfo();
            }
        }
    }).catch((err) => {
        console.error(err);
    });
}
/**
 * 获取用户所有有权限的卡口
 * @param {Number} offset 初始查询数
 * @param {Number} limit 查询数目
 */
function checkUserTollgate(offset = 0, limit = 200) {
    //如果卡口不是所需的图层分类，则不加载
    if (!layerType.includes(1)) {
        getTollgate();
        return;
    }
    new Promise(function (resolve, reject) {
        axios({
            url: '/VIID/query',
            method: 'GET',
            params: {
                code: organization,
                condition: {
                    ItemNum: 2,
                    Condition: [{
                        QueryType: 256,
                        LogicFlag: 0,
                        QueryData: '31'
                    }, {
                        QueryType: 257,
                        LogicFlag: 3,
                        QueryData: '1'
                    }],
                    QueryCount: 1,
                    PageFirstRowNumber: offset,
                    PageRowNum: limit
                }
            },
            timeout: 30000,
            headers: {
                Authorization: token,
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            resolve(res);
        }).catch((err) => {
            reject(err);
        });
    }).then((res) => {
        let data = res.data;
        if (data && 0 === data.ErrCode) {
            if (data.Result && data.Result.InfoList instanceof Array) {
                data.Result.InfoList.forEach((item) => {
                    userTollgate[item.ResItemV1.ResCode] = item.ResItemV1;
                });
                if (data.Result.RspPageInfo.TotalRowNum > offset + limit) {
                    checkUserTollgate(offset + limit, limit);
                } else {
                    getTollgate();
                }
            }
        }
    }).catch((err) => {
        console.error(err);
    });
}
/**
 * 获取用户所有有权限的摄像机
 * @param {Number} offset 初始查询数
 * @param {Number} limit 查询数目
 */
function checkUserCamera(offset = 0, limit = 200) {
    //如果摄像机不是所需的图层分类，则不加载
    if (!layerType.includes(0)) {
        checkUserTollgate();
        return;
    }
    new Promise(function (resolve, reject) {
        axios({
            url: '/VIID/query/list/for/map',
            method: 'GET',
            params: {
                code: organization,
                condition: {
                    ItemNum: 2,
                    Condition: [{
                        QueryType: 256,
                        LogicFlag: 0,
                        QueryData: '1001'
                    }, {
                        QueryType: 257,
                        LogicFlag: 3,
                        QueryData: '1'
                    }],
                    QueryCount: 1,
                    PageFirstRowNumber: offset,
                    PageRowNum: limit
                }
            },
            timeout: 30000,
            headers: {
                Authorization: token,
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            resolve(res);
        }).catch((err) => {
            reject(err);
        });
    }).then((res) => {
        let data = res.data;
        if (data && 0 === data.ErrCode) {
            if (data.Result && data.Result.InfoList instanceof Array) {
                data.Result.InfoList.forEach((item) => {
                    userCamera[item.ResCode] = item;
                });
                if (data.Result.InfoList.length === limit) {
                    checkUserCamera(offset + limit, limit);
                } else {
                    checkUserTollgate();
                }
            }
        }
    }).catch((err) => {
        console.error(err);
    });
}
export default function onmessage(e) {
    let obj = JSON.parse(e.data);
    //获取所需的图层分类信息，初始化markers数据结构 { type: [] }
    if (obj.type instanceof Array) {
        layerType = obj.type;
        layerType.forEach((item) => {
            markers[item] = [];
        });
    }
    //IconName信息 { type: { code: IconName } }
    layersIconName = obj.iconName;
    token = obj.token; //VIID token
    organization = obj.organization;  //本域组织编码
    mapType = obj.mapType;  //map地图类型
    // if (!InUnvSee) {
    //     //api接口登录
    //     GAServerRestful.loginDebug('loadmin', 'MapMap123');
    // }
    checkUserCamera();
};