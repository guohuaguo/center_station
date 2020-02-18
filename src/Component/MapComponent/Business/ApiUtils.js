//defence  api
import { notification } from 'antd';
import camera_sprite24x from '../Image/camera_sprite24x.png';
import tollgate_sprite24x from '../Image/tollgate_sprite24x.png';
import moment from 'moment';
import axios from 'axios';
import { message } from 'antd';
import { type } from 'os';
/**
 * 获取所有防区
 *
 *  */
export function getDefenceApi(offset, limit, getResult) {
    let queryParams = {
        url: '/api/defence',
        method: 'GET',
        params: {
            offset: offset,
            limit: limit
        }
    };
    axios(queryParams)
        .then((res) => {
            let _result = res.data;
            if (getResult) {
                getResult(_result);
            }
        })
        .catch((err) => {
            if (getResult) {
                getResult(err);
            }
        });
}
/**
 * 删除防区
 *
 *  */
export function delDefenceApi(code) {
    // 获取图层
    let queryParams = {
        url: '/api/defence',
        method: 'DELETE',
        params: {
            code: code
        }
    };
    axios(queryParams)
        .then((res) => {
            let _result = res.data;
            if (_result.ErrCode === 0) {
                notification.config({
                    placement: 'bottomRight'
                });
                notification['success']({
                    message: '提示',
                    description: '删除成功',
                    duration: 2
                });
            }

        })
        .catch((err) => { });
}
/**
 * 添加防区
 *
 *  */
export function addDefenceApi(isModify, options) {
    let requestType = 'POST';
    let msg = '防区添加成功';
    if (isModify) {
        requestType = 'PUT';
        msg = '防区修改成功';
    }
    let queryParams = {
        url: '/api/defence',
        method: requestType,
        data: {
            'Code': options.Code,
            'Name': options.Name,
            'BorderColor': options.BorderColor,
            'FontColor': options.FontColor,
            'FillColor': options.FillColor,
            'BoundaryWidth': options.BoundaryWidth,
            'Layer': options.Layer,
            'IsDottedLine': options.IsDottedLine,
            'Points': options.Points
        }
    };
    axios(queryParams)
        .then((res) => {
            let _result = res.data;
            // 新增成功or修改成功
            if (_result.ErrCode === 0) {
                notification.config({
                    placement: 'bottomRight'
                });
                notification['success']({
                    message: '提示',
                    description: msg,
                    duration: 2
                });
            }
        })
        .catch((err) => {
            notification.config({
                placement: 'bottomRight'
            });
            notification['info']({
                message: '提示',
                description: '防区操作失败',
                duration: 2
            });
        });
}

/**
 * 获取vm的mark   加载摄像机  卡口
 *
 *  */
export function getMarkerInfo(mapStatus, layersInfo, callBack) {
    console.log('layersInfo', layersInfo);
    //获取点位
    let queryParams = {
        url: '/api/marker/webclient',
        method: 'GET',
        params: {
            offset: 0,
            limit: 1000,
            maptype: -1      //0： 有8500地图服务  1：有9500服务 -1：没有地图服务
        }
    };
    axios(queryParams).then((res) => {

        if (res.data.ErrCode === 0) {

            let _result = res.data.Result;
            console.log('_result', _result);
            let _length = _result.length;
            // 根据layerType和layerCode找到图标的前缀
            _result.map((item) => {
                // 图片名称拼接规则 getImageInfo.LayerImageInfo.IconName-item.MarkerType-item.DeviceStatus===0?2:1.png
                let getImageInfo = layersInfo.find((itm) => itm.LayerType === item.LayerType && itm.LayerCode === item.LayerCode);
                console.log('getImageInfo', getImageInfo);
                // 1.判断是相机还是卡口还是其他
                // 图片类型
                let markTypePic = getImageInfo && getImageInfo.LayerImageInfo.IconName;
                if (parseInt(markTypePic) < 30000 && parseInt(markTypePic) >= 20000) {//摄像机
                    // 2.如果是相机加载相机精灵图
                    item.image = camera_sprite24x;    //使用摄像机精灵图
                    let startY = (markTypePic % 20000) * 4 * 24;
                    let startX = item.DeviceStatus === 0 ? 24 : 0;
                    if (item.MarkerType <= 2) {
                        startY = startY + (item.MarkerType - 1) * 24;
                    } else if (item.MarkerType === 7) {
                        startY = startY + 2 * 24;
                    } else if (item.MarkerType === 8) {
                        startY = startY + 3 * 24;
                    }
                    item.offset = [startX, startY];
                    // 计算对应的坐标
                } else if (parseInt(markTypePic) > 30000) {//卡口
                    // 3.如果是卡口加载卡口精灵图
                    item.image = tollgate_sprite24x;    //使用卡口精灵图
                    let startY = (markTypePic % 30000) * 24;
                    let startX = item.DeviceStatus === 0 ? 24 : 0;
                    item.offset = [startX, startY];
                } else {
                    // 4.其他 加载其他的图标  目前除了卡口和相机外 其他没有精灵图
                    // item.image = tip;
                }
            });
            if (callBack && typeof callBack === 'function') {
                callBack(_result);
            }
        }
    }).catch(() => { });
}
/**
 * 获取vm的layer
 *
 *  */
export function getLayersInfo(userCode, callBack) {
    // 获取图层
    let queryParams = {
        url: '/api/layer',
        method: 'GET',
        params: {
            usrcode: userCode
        }
    };
    axios(queryParams)
        .then((res) => {
            if (callBack && typeof callBack === 'function') {
                callBack(res.data);
            }
        })
        .catch((err) => { });
}
/**
 * vm删除mark
 *
 *  */
export function delMark(markerid, callBack) {
    // 获取图层
    let queryParams = {
        url: '/api/marker',
        method: 'Delete',
        params: {
            markerid: markerid
        }
    };
    axios(queryParams)
        .then((res) => {
            let _result = res.data;
            if (callBack) {
                callBack();
            }
            // '删除成功
            if (_result.ErrCode === 0) {
                notification.config({
                    placement: 'bottomRight'
                });
                notification['success']({
                    message: '提示',
                    description: '删除成功',
                    duration: 2
                });
            }
        })
        .catch((err) => { });
}
/**
 * 获取相机的角度
 *
 *  */
export function getCarmalAngle(code, callBack) {
    let queryParams = {
        url: '/VIID/query/devInst',
        method: 'GET',
        params: {
            code: code,
            data: {
                'InstType': 21,
                'Para1': '',
                'Para2': '',
                'Para3': '',
                'Reserve': ''
            }
        }
    };
    axios(queryParams)
        .then((res) => {
            if (res.data.Result) {
                if (callBack && typeof callBack === 'function') {
                    callBack(res.data.Result);
                }
            }
        })
        .catch((err) => { });
}

/**
 * 控制相机旋转
 *
 *  */
export function controlCarmal(PTZCmdPara1, PTZCmdPara2, PTZCmdPara3, code, callBack) {
    let queryParams = {
        url: `/VIID/ptz/ctrl/${code}`,
        method: 'POST',
        data: {
            PTZCmdID: 2306,
            PTZCmdPara1: PTZCmdPara1,
            PTZCmdPara2: PTZCmdPara2,
            PTZCmdPara3: PTZCmdPara3
        }
    };
    axios(queryParams)
        .then((res) => {
            if (callBack) {
                callBack();
            }
        })
        .catch((err) => { });
}

/**
 * 查询聚合
 *
 *  */
export function getZoomLayer(params, callback) {
    let queryParams = {
        url: '/gis/cluster',
        method: 'GET',
        params: params
    };
    axios(queryParams)
        .then((res) => {
            if (callback && typeof callback === 'function') {
                callback(res.data);
            }
        })
        .catch((err) => { });
}
/**
 * 查询所有卡口和摄像机聚合
 *
 *  */
export function loadDataFuc(condition, callback) {
    let queryParams = {
        url: '/gis/point',
        method: 'get',
        params: condition
    };
    axios(queryParams).then((res) => {
        if (res.data.ErrCode === 0) {
            if (callback && typeof callback === 'function') {
                callback(res.data);
            }
        }

    }).catch((err) => { });
}
/**
 * 新增设备接口
 *
 *  */
export function addDeviceData(data, callback) {
    let queryParams = {
        url: '/gis/point',
        method: 'post',
        data: data
    };
    axios(queryParams).then((res) => {
        if (res.data.ErrCode === 0) {
            if (callback && typeof callback === 'function') {
                callback(res.data);
            }
        }
    }).catch((err) => { });
}
/**
 *  map的修改接口
 *
 *  */
export function modifyMapDeviceData(data, callback) {
    let num = 0;
    if (data.LayerType === 30001) {
        num = 1;
    }
    let condtion = {
        t: num
    };
    let queryParams = {
        url: '/gis/point',
        method: 'put',
        data: { 'Markers': [data] },
        params: condtion
    };
    axios(queryParams).then((res) => {
        if (res.data.ErrCode === 0) {
            message.info('修改成功');
            if (callback && typeof callback === 'function') {
                callback();
            }
        } else {
            message.info('修改失败');
        }
    }).catch((err) => { });
}

/**
 * 新增设备接口
 *
 *  */
export function modifyDeviceData(data, callback) {
    //1.先调vm修改接口
    let queryParams = {
        url: '/api/marker',
        method: 'put',
        data: data
    };
    axios(queryParams).then((res) => {
        //1成功，调map修改接口
        if (res.data.ErrCode === 0) {
            modifyMapDeviceData(data);
        } else {
            //1.失败
            //2.调map新增接口
            //需要创建时间的字段
            let result = Object.assign({}, data);
            result.CreateTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            //2.调map新增接口
            let queryParams = {
                url: '/api/marker',
                method: 'post',
                data: result
            };
            axios(queryParams).then((res) => {
                //2.成功，调map修改接口
                if (res.data.ErrCode === 0) {
                    modifyMapDeviceData(result);
                    //2.失败，修改失败
                } else {
                    message.info('修改失败');
                }
            });
        }
    });
}

/**
 *  查找元素
 */
export function findDeviceData(id, type, callback) {
    let condition = {
        code: id,
        offset: 0,
        limit: 1,
        type: type
    };
    let queryParams = {
        url: '/gis/find',
        method: 'get',
        params: condition
    };
    axios(queryParams).then((res) => {
        if (res.data.ErrCode === 0) {
            if (callback && typeof callback === 'function') {
                callback(res.data);
            }
        }
    }).catch((err) => { });
}
/**
 *  删除数据
 */
export function deletedDeviceData(result, callback) {
    let queryParams = {
        url: '/gis/point',
        method: 'delete',
        data: result
    };
    axios(queryParams).then((res) => {
        if (res.data.ErrCode === 0) {
            if (callback && typeof callback === 'function') {
                callback(res.data);
            }
        }
    }).catch((err) => { });
}