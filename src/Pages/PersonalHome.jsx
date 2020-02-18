import React,{useState, useEffect, useRef} from 'react';
import Axios from 'axios';
import {MapFunc} from '../Component';

const _mapIP = '33.112.24.32'

export default function PersonalHome() {

    //#region 自适应高度
    const [height, setHeight] = useState(window.innerHeight - 50)
    const [width, setWidth] = useState(window.innerWidth)
    function resize() {
        setHeight(window.innerHeight - 50)
        setWidth(window.innerWidth)
    }
    useEffect(() => {
        window.addEventListener('resize', resize)
        return () => {
            window.removeEventListener('resize', resize)
        };
    }, [])
    //#endrigon

    //地图
    const [cameraList, setcameraList] = useState([])
    const [layer, setlayer] = useState([])
    const [areaInfo, setAreaInfo] = useState([])
    const mapRef = useRef(null)

    let mapArea = [],
        zoom = 15;

    useEffect(() => {
        if (mapRef.current != null) {
            mapRef.current.map.getBaseMap().addEventListener('moveend', listen)
            return () => {
                mapRef.current.map.getBaseMap().removeEventListener('moveend', listen)
            }
        }
    }, [layer, areaInfo])

    function listen() {
        let mapDom = mapRef.current.map.getBaseMap(),
            mapExtent = mapDom.getView().calculateExtent(mapDom.getSize());
        mapArea = [...mapDom.getMapLngLat([mapExtent[0], mapExtent[1]]), ...mapDom.getMapLngLat([mapExtent[2], mapExtent[3]])];
        setLayer(layer, areaInfo)
    }

    function getMapArea() {
        let axiosData = {
            url: 'http://33.112.24.32:7022/VIAP/api/map/maparea',
            method: 'GET',
        };
        Axios(axiosData).then((res) => {
            let areaInfo = []
            if (res.status === 200 && res.data.rtn === 0) {
                let data = res.data.MapAreaInfoList;
                for (let i = 0; i < data.length; i++) {
                    const element = data[i];
                    areaInfo.push({
                        code: element.code,
                        name: element.name,
                        pcode: element.pcode,
                        count: element.count,
                        areaShow: 1
                    })
                }
                setAreaInfo(areaInfo)
            }
        }).catch((err) => {
            console.error(err)
        })
    }

    //#region 图层
    function getMapLayer(layer = {}) {
        const {
            LayerCode = "",
            LayerName = "",
            LayerImage = "",
            LayerType = "",
            LayerState = "",
            LayerCreateTime = "",
            LayerSource = "",
        } = layer

        let axiosData = {
            url: 'http://33.112.24.32:7022/VIAP/api/map/maplayer',
            method: 'GET',
            data: {
                LayerCode,
                LayerName,
                LayerImage,
                LayerType,
                LayerState,
                LayerCreateTime,
                LayerSource
            }
        };
        Axios(axiosData).then((res) => {
            let layerInfo = []
            if (res.status === 200 && res.data.rtn === 0) {
                let data = res.data.MapLayerInfoList;
                for (let i = 0; i < data.length; i++) {
                    const element = data[i];
                    layerInfo.push({
                        createTime: element.create_time,
                        layerCode: element.layer_code,
                        layerImage: element.layer_image,
                        layerName: element.layer_name,
                        layerSource: element.layer_source,
                        layerState: element.layer_state,
                        layerType: element.layer_type,
                        count: element.count,
                        layerShow: 1
                    })
                }
                setlayer(layerInfo)
            }
        }).catch((err) => {
            console.error(err)
        })
    }

    function setLayer(layers, areaInfoList) {
        if (layer.length === 0) {
            getMapLayer()
        }
        if (areaInfoList.length === 0) {
            getMapArea()
        }
        let mapDom = mapRef.current.map.getBaseMap(),
            mapExtent = mapDom.getView().calculateExtent(mapDom.getSize());
        //结果是火星坐标
        mapArea = [...mapDom.getMapLngLat([mapExtent[0], mapExtent[1]]), ...mapDom.getMapLngLat([mapExtent[2], mapExtent[3]])];
        //转换为wgs84坐标
        mapArea = [...mapDom.getMars2WGS(mapArea[0], mapArea[1]), ...mapDom.getMars2WGS(mapArea[2], mapArea[3])]
        zoom = mapDom.getView().getZoom();
        let codeArray = [];
        layers.forEach((item) => {
            if (!!item.layerShow) {
                codeArray.push(item.layerCode)
            }
        })
        if (codeArray.length === 0 && layer.length !== 0) {
            codeArray = ["-1"]
        }
        let areaCodeList = [];
        areaInfoList.forEach((item) => {
            if (!!item.areaShow) {
                areaCodeList.push(item.code)
            }
        })
        if (areaCodeList.length === 0 && areaInfoList.length !== 0) {
            areaCodeList = ["-1"]
        }
        if (zoom <= 15) {
            mapClusterInfo(...mapArea, zoom, codeArray, areaCodeList)
        } else {
            searchAreaCamera(...mapArea, 0, codeArray, areaCodeList)
        }
        setlayer(layers)
    }
    //#endregion 

    //#region 聚合
    function mapClusterInfo(slng, slat, elng, elat, zoom, layercodelist = [], areacodelist = []) {
        let axiosData = {
            url: 'http://33.112.24.32:7022/VIAP/api/map/clusterinfo',
            method: 'POST',
            data: {
                limit: 1000,
                offset: 0,
                layercodelist,
                areacodelist,
                slat,
                slng,
                elat,
                elng,
                zoom
            }
        };
        Axios(axiosData).then((res) => {
            let cameraInfoList = []
            if (res.status === 200 && res.data.rtn === 0) {
                let data = res.data.clusterInfoList;
                if (Array.isArray(data)) {
                    for (let i = 0; i < data.length; i++) {
                        const element = data[i];
                        if (~~element.lng === 0 || ~~element.lat === 0) {
                            continue
                        }
                        cameraInfoList.push({
                            longitude: element.lng,
                            latitude: element.lat,
                            name: element.number,
                            tollgateID: i
                        })
                    }
                    setcameraList(cameraInfoList)
                } else {
                    setcameraList([])
                }
            }
        }).catch((err) => {
            console.error(err)
        })
    }
    //#endregion 

    //#region 请求相机
    function searchAreaCamera(slng, slat, elng, elat, offset = 0, layercodelist = [], areacodelist = []) {
        let axiosData = {
            url: 'http://33.112.24.32:7022/VIAP/api/map/rangecamerainfo',
            method: 'POST',
            data: {
                limit: 2000,
                offset,
                layercodelist,
                areacodelist,
                slat,
                slng,
                elat,
                elng
            }
        };
        Axios(axiosData).then((res) => {
            let cameraInfoList = []
            if (res.status === 200 && res.data.rtn === 0) {
                let data = res.data.CamInfoList;
                if (Array.isArray(data)) {
                    for (let i = 0; i < data.length; i++) {
                        const element = data[i];
                        if (~~element.jd === 0 || ~~element.wd === 0) {
                            continue
                        }
                        cameraInfoList.push({
                            longitude: element.jd,
                            latitude: element.wd,
                            name: element.azdz,
                            tollgateID: element.sbbm
                        })
                    }
                    setcameraList(cameraInfoList)
                    if (data.length === 2000) {
                        searchAreaCamera(slng, slat, elng, elat, offset += 2000, layercodelist, areacodelist)
                    }
                } else {
                    setcameraList([])
                }
            }
        }).catch((err) => {
            console.error(err)
        })
    }
    //#endregion 
    const [cameraIdList, setcameraIdList] = useState([])
    function getCameraId(cameraIdList) {
        setcameraIdList(cameraIdList)
    }
    return (
        <div>
            {/* 地图 */
                    <div style={{ width, position: 'absolute', height}}>
                    {
                        <MapFunc
                            getDataList={cameraList}
                            getLayer={layer}
                            setLayer={setLayer}
                            ref={mapRef}
                            isRegion={true}
                            mapServerIp={_mapIP}
                            getCameraId={getCameraId}
                        />
                    }
                </div>
            }
        </div>
    )
}
