import { message } from 'antd';
import { axios } from 'axios';
/**
 * 获取地图可视域坐标
 * @param {Object} mapDom map组件ref
 */
export function getVisualArea(mapDom) {
    // 获取地图的可视范围
    let arr = mapDom.getBaseMap().getView().calculateExtent(mapDom.getBaseMap().getSize());
    let lb = mapDom.getMapLngLat([arr[0], arr[1]]);//左下
    let rt = mapDom.getMapLngLat([arr[2], arr[3]]);//右上
    return {
        slat: lb[1], //起点_纬度
        slng: lb[0], //起点_经度
        elat: rt[1], //终点_纬度
        elng: rt[0] //终点_经度
    };
}
/**
 * 获取MAP服务类型
 */
export function queryMapType() {
    return new Promise(function (resolve, reject) {
        let queryParams = {
            url: '/api/maptype',
            method: 'GET'
        };
        axios(queryParams).then((res) => {
            let data = res.data;
            if (data && 0 === data.ErrCode) {
                //0  8500    1  9500
                resolve(1 === data.MapType ? '9500' : '8500');
                return;
            }
            resolve('');
        }).catch((err) => {
            reject('');
            console.error(err);
        });
    });
}
/**
 * 9500 GIS服务查询聚合点位
 * @param {Object} params 入参
 * @param {Function} callback 回调
 */
export function getGisCluster(params, pointType, callback) {
    let queryParams = {
        url: '/gis/cluster',
        method: 'GET',
        params
    };
    axios(queryParams).then((res) => {
        let data = res.data;
        if (data && 0 === data.ErrCode) {
            if (callback && typeof callback === 'function') {
                callback(data[pointType] || []);
            }
        }
    }).catch((err) => {
        console.error(err);
    });
}
/**
 * 9500 GIS服务查询具体点位
 * @param {Object} params 入参
 * @param {Function} callback 回调
 */
export function getGisPoint(params, callback, result = [], offset = 0, limit = 1000) {
    let queryParams = {
        url: '/gis/point',
        method: 'get',
        params: Object.assign({}, params, { offset, limit })
    };
    axios(queryParams).then((res) => {
        let data = res.data;
        if (data && 0 === data.ErrCode) {
            if (data.Markers instanceof Array) {
                result = [...result, ...data.Markers || []];
            }
            if (data.Total > offset + limit) {
                getGisPoint(params, callback, result, offset + limit, limit);
            } else {
                if (callback && typeof callback === 'function') {
                    callback(result);
                }
            }
        }
    }).catch((err) => {
        console.error(err);
    });
}
/**
 * 实况
 * @param {String} CamCode 相机编码
 * @param {String} CamName 相机名称
 */
export function livePlayVideo(CamCode, CamName) {
    let params = {
        data: {
            CamCode, //相机编码
            CamName
        },
        url: '/MapPlayVideo',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    axios(params).then((data) => {
        console.info(data, 'MapPlayVideo');
    }).catch((error) => {
        console.error(error, 'MapPlayVideo');
    });
}
/**
 * 回放
 * @param {String} CamCode 相机编码
 * @param {String} CamName 相机名称
 */
export function playBackVideo(CamCode, CamName) {
    let params = {
        data: {
            CamCode, //相机编码
            CamName
        },
        url: '/MapVideoPlayBack',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    axios(params).then((data) => {
        console.info(data, 'MapVideoPlayBack');
    }).catch((error) => {
        console.error(error, 'MapVideoPlayBack');
    });
}
/**
 * 快捷回放
 * @param {String} camCode 相机编码
 * @param {String} camName 相机名称
 * @param {Number} inteval 播放时长（分钟）
 */
export function quickPlayCamera(camCode, camName, inteval) {
    let params = {
        data: {
            camCode, //相机编码
            camName,
            inteval
        },
        url: '/MapSpeedVideo',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    axios(params).then((data) => {
        console.info(data, 'MapSpeedVideo');
    }).catch((error) => {
        console.error(error, 'MapSpeedVideo');
    });
}
/**
 * 录像下载
 * @param {String} camCode 相机编码
 * @param {String} camName 相机名称
 */
export function downloadVideo(camCode, camName) {
    let params = {
        data: {
            camCode, //相机编码
            camName
        },
        url: '/MapVideoDown',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    axios(params).then((data) => {
        console.info(data, 'MapVideoDown');
    }).catch((error) => {
        console.error(error, 'MapVideoDown');
    });
}
/**
 * 详细属性
 * @param {String} camCode 相机编码
 * @param {String} camName 相机名称
 * @param {Number} camType 相机类型
 */
function queryCameraDetail(camCode, camName, camType) {
    let params = {
        data: {
            camCode, //相机编码
            camName,
            camType
        },
        url: '/MapCameraInfo',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    axios(params).then((data) => {
        console.info(data, 'MapCameraInfo');
    }).catch((error) => {
        console.error(error, 'MapCameraInfo');
    });
}
/**
 * 查询摄像机信息
 * @param {String} cameraCode 相机编码
 */
export function getCameraType(cameraCode) {
    let params = {
        url: `/VIID/dev/ec/query/camera/${cameraCode}`,
        method: 'GET'
    };
    axios(params).then((res) => {
        let data = res.data;
        if (data && 0 === data.ErrCode) {
            const { CameraCode, CameraName, CameraType } = data.Result;
            queryCameraDetail(CameraCode, CameraName, CameraType);
        }
    }).catch(function (error) {
        console.error(error);
    });
}
/**
 * 实况网格追踪
 * @param {Array} data 视频播放数组
 */
export function livePlayGridTrace(data) {
    let params = {
        data,
        url: '/MapTsmiStartGridTrace',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    axios(params).then((data) => {
        console.info(data, 'MapTsmiStartGridTrace');
        if (data && 0 !== data.ErrCode) {
            message.info(data.ErrMsg, 2);
        }
    }).catch((error) => {
        console.error(error, 'MapTsmiStartGridTrace');
    });
}
/**
 * 回放网格追踪
 * @param {Array} data 视频播放数组
 */
export function playBackGridTrace(data, playBack) {
    let params = {
        data: { ...data, ...{ playBack } },
        url: '/MapTsmiStartVodGridTrace',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    axios(params).then((data) => {
        console.info(data, 'MapTsmiStartVodGridTrace');
        if (data && 0 !== data.ErrCode) {
            message.info(data.ErrMsg, 2);
        }
    }).catch((error) => {
        console.error(error, 'MapTsmiStartVodGridTrace');
    });
}
/**
 * 一机一档信息
 * @param {String} code 视频播放数组
 * @param {Function} callback 回调函数
 */
export function camerasDocument(code, callback) {
    let queryParams = {
        url: '/VMIMP/Cameras',
        method: 'GET',
        params: {
            'vm_dev_code': code,
            offset: 0,
            limit: 1
        }
    };
    // IMPFomVMRestful.fetch(queryParams).then((res) => {
    //     if (res && res.response && (502 === res.response.status || 404 === res.response.status)) {
    //         message.info('未获取到IMP信息，请检查IMP服务器配置是否正确', 2);
    //         return;
    //     }
    //     let data = res.data;
    //     if (data && 0 === data.ErrCode && data.Result && data.Result.CameraList instanceof Array) {
    //         if (callback && typeof callback === 'function') {
    //             callback(data.Result.CameraList[0] || []);
    //         }
    //     } else {
    //         message.info(data.ErrMsg);
    //     }
    // }).catch(function (error) {
    //     message.info('未获取到IMP信息，请检查IMP服务器配置是否正确', 2);
    //     console.error(error);
    // });
}
/**
 * GPS轨迹记录查询
 * @param {String} devcode GPS编码
 * @param {String} begintime 开始时间
 * @param {String} endtime 结束时间
 * @param {Function} callback 回调
 */
export function getGpsRecord(devcode, begintime, endtime, callback) {
    let queryParams = {
        url: '/map/api/gps/record',
        method: 'get',
        params: {
            devcode,
            begintime,
            endtime
        }
    };
    axios(queryParams).then((res) => {
        let data = res.data;
        if (data && data.Records instanceof Array) {
            let record = data.Records.map((item) => {
                return {
                    Position: {
                        Lng: item.X84 - 0,
                        Lat: item.Y84 - 0
                    },
                    ConnectTime: item.Time
                };
            });
            if (record.length < 2) {
                message.info('小于两个有效数据点，无法绘制轨迹');
                return;
            }
            if (callback && typeof callback === 'function') {
                callback(record);
            }
        }
    }).catch((err) => {
        console.error(err);
    });
}
/**
 * 查询卡口摄像机
 * @param {String} tollgateCode 卡口编码
 * @param {Function} callback 回调
 */
export function getTollgateVideo(tollgateCode, callback) {
    let queryParams = {
        url: '/VIID/video/query/list',
        method: 'GET',
        params: {
            code: tollgateCode
        }
    };
    return axios(queryParams).then((res) => {
        let data = res.data;
        if (data && 0 === data.ErrCode && data.Result && data.Result.InfoList instanceof Array) {
            if (callback && typeof callback === 'function') {
                let result = data.Result.InfoList.map((item) => {
                    return {
                        CameraCode: item.CameraCode,
                        CameraName: item.CameraName
                    };
                });
                callback(result);
            }
        }
    }).catch((err) => {
        console.error(err);
    });
}
/**
 * 查询卡口相机
 * @param {String} tollgateCode 卡口编码
 * @param {Function} callback 回调
 */
export function getTollgateCamera(tollgateCode, callback) {
    let queryParams = {
        url: '/VIID/camera/query/list',
        method: 'GET',
        params: {
            code: tollgateCode
        }
    };
    return axios(queryParams).then((res) => {
        let data = res.data;
        if (data && 0 === data.ErrCode && data.Result && data.Result.InfoList instanceof Array) {
            if (callback && typeof callback === 'function') {
                let result = data.Result.InfoList.map((item) => {
                    return {
                        CameraCode: item.CameraCode,
                        CameraName: item.CameraName
                    };
                });
                callback(result);
            }
        }
    }).catch((err) => {
        console.error(err);
    });
}
/**
 * 卡口启动
 * @param {String} tollgateCode 卡口编码
 * @param {String} tollgateName 卡口名称
 * @param {Array} cameraMarker 卡口摄像机
 * @param {Array} tollgateCameraMarker 卡口相机
 */
export function startTollgateVideo(tollgateCode, tollgateName, tollgateCameraMarker, cameraMarker) {
    if (0 === cameraMarker.length && 0 === tollgateCameraMarker.length) {
        message.info('该卡口未绑定任何摄像机或相机');
        return;
    }
    let params = {
        url: '/MapTollgateStartVideo',
        data: {
            tollgateCode,
            tollgateName,
            count: cameraMarker.length + tollgateCameraMarker.length,
            tollgateCameraMarker,
            cameraMarker
        },
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    axios(params).then((data) => {
        console.info(data, 'MapTollgateStartVideo');
    }).catch((error) => {
        console.error(error, 'MapTollgateStartVideo');
    });
}