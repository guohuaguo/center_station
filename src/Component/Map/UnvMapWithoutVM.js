import React from 'react';
import ol from 'openlayers';
import axios from 'axios';
import ol_extension from './ol_extension';
import './UnvMap.css';
//只有这样插件内部才能访问到openlayers
window.ol = ol;
//地图插件信息
let _mapPlugin = undefined;
//地图服务器地址
let _mapIP = undefined;
const A = 6378245.0;
const EE = 0.00669342162296594323;
const PI = 3.14159265358979324;
const x_PI = 3.14159265358979324 * 3000.0 / 180.0;

export default class UnvMapWithoutVM extends React.Component {
    constructor(props) {
        super(props);
        let guid = this._guid();
        this.map = undefined;//地图实例
        this.projection = ol.proj.get('EPSG:3857'); //具体坐标系
        this.state = {
            id: guid,   //实例使用的div对象id
            height: 200,
            levelShow: ''
        };
    }
    componentWillMount() {
        const { mapServerIp } = this.props;
        _mapIP = mapServerIp;
    }
    componentDidMount() {
        let that = this;
        this.map = new ol.Map({
            target: that.state.id,
            layers: [],
            view: new ol.View({
                center: [120.14805, 30.26971],
                zoom: 5
            }),
            interactions: new ol.interaction.defaults({
                doubleClickZoom: false   //屏蔽双击放大事件
            }),
            controls: new ol.Collection([
                new ol.control.ScaleLine(),
                new ol.control.MousePosition({
                    className: 'mapMousePosition',
                    coordinateFormat: function (p) {
                        let lng = p[0] + '';
                        let lat = p[1] + '';
                        if (lng.length > 10) {
                            lng = lng.slice(0, 10);
                        } else {
                            lng = that.padLeft(lng, 10, '0');
                        }

                        if (lat.length > 10) {
                            lat = lat.slice(0, 10);
                        } else {
                            lat = that.padLeft(lat, 10, '0');
                        }


                        return '经度:' + lng + '，纬度:' + lat;//这里需要补一下多语言
                    },
                    projection: 'EPSG:4326', //可以是4326 精度应该保留几个小数点
                    undefinedHTML: '&nbsp;'
                })
            ])
        });
        if (!_mapPlugin) {
            //这里去异步请求一下map服务器 确定加载的地图
            //测试 先写死
            let query = {
                url: 'http://' + _mapIP + ':7022/map/api/mapCfg',
                // url: 'http://127.0.0.1:7022/map/api/mapCfg',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: false
            };
            axios(query).then((response) => {
                if (response.data.ErrCode === 0) {
                    _mapPlugin = response.data;
                }
                that._mapPluginLoaded();
            }).catch((response) => {
                let layers = new ol.layer.Tile({ //无地图服务
                });
                let view = new ol.View({
                    center: ol.proj.fromLonLat([108.967213, 34.276221]),
                    zoom: 6,
                    maxZoom: 18,
                    minZoom: 3
                });
                that._setMapCfg([layers], view);
                //这个有点糟糕 无法获取到瓦片服务器
                //合入主线时 弹出标准错误信息
                //地图上直接全部都是暂无图片
                //that._mapPluginLoaded();
            });
        } else {
            that._mapPluginLoaded();
        }
        window.addEventListener('resize', this.resize);
        this.setState({
            height: parseInt(window.getComputedStyle(this.refs.unvMap).height),
            levelShow: this.map.getView().getZoom()
        });

    }
    componentDidUpdate() {
        this.resize();
    }

    componentWillUnmount() {
        if (this.map) {
            this._saveLsatPoint();
        }
        window.removeEventListener('resize', this.resize);
    }
    //地图显示当前级别
    zoomChangeHandle = () => {
        let zoom = this.map.getView().getZoom();
        if (zoom % 1 !== 0) {
            return;
        }
        let timer = setTimeout(() => {
            this.setState({
                levelShow: zoom
            });
            clearTimeout(timer);
        }, 400);
    }

    resize = () => {
        let h = parseInt(window.getComputedStyle(this.refs.unvMap).height);
        if (h !== this.state.height) {
            this.setState({
                height: h
            });
        } else {
            this.map.updateSize();
        }
    }

    /**
     * @private
     * @method 左对齐字符串
     * @param {string} str
     * @param {Number} totalWidth
     * @param {string} paddingChar
     * @returns {string} 对齐后的字符串
     */
    padLeft = (str, totalWidth, paddingChar) => {
        if (str.length > totalWidth || paddingChar.length !== 1) {
            return str;
        }

        let ns = new Array(totalWidth);

        for (let index = totalWidth - 1; index >= 0; index--) {
            if ((totalWidth - index) <= str.length) {
                ns[index] = str[str.length - (totalWidth - index)];
            } else {
                ns[index] = paddingChar[0];
            }
        }
        return ns.join('');
    }

    /**
     * @public
     * @method 返回当前使用的坐标系
     * @returns {string} 当前使用的坐标系
     */
    getProjection = () => {
        return this.projection;
    }

    /**
     * @public
     * @method 返回内部地图实例
     * @returns {ol.Map} 内部地图实例
     */
    getBaseMap = () => {
        this.map.getView().on('change:resolution', this.zoomChangeHandle);
        Object.assign(this.map, this, ol_extension);
        return this.map;
    }

    /**
     * 从84坐标制作经纬度
     * @param {Number} lng 经度
     * @param {Number} lat 纬度
     */
    getMapPoint = (lng, lat) => {  //没有地图服务时,有服务时该转换来自地图插件
        let m_center = [lng, lat];
        m_center = ol.proj.transform(m_center, 'EPSG:4326', 'EPSG:3857');
        return m_center;
    }

    /**
     * 从地理坐标获取经纬度   没有地图服务时，有服务时该转换来自地图插件
     * @param {*} point
     */
    getMapLngLat = (point) => {
        let m_center = ol.proj.transform(point, 'EPSG:3857', 'EPSG:4326');
        return m_center;
    }

    /**
     * 从百度转火星
     * @param {Number} lng 经度
     * @param {Number} lat 纬度
     * @return {[Number,Number]} point
     */
    getBaidu2Mars = (lng, lat) => {

        let x = lng - 0.0065;
        let y = lat - 0.006;
        let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_PI);
        let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_PI);
        let marslng = z * Math.cos(theta);
        let marslat = z * Math.sin(theta);
        return [marslng, marslat];
    }

    /**
     * 从火星转百度
     * @param {Number} lng 经度
     * @param {Number} lat 纬度
     * @return {[Number,Number]} point
     */
    getMars2Baidu = (lng, lat) => {
        let z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_PI);
        let theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_PI);
        let bd_lng = z * Math.cos(theta) + 0.0065;
        let bd_lat = z * Math.sin(theta) + 0.006;
        return [bd_lng, bd_lat];
    }

    /**
     * 从84转火星
     * @param {Number} wgsLng 经度
     * @param {Number} wgsLat 纬度
     * @return {[Number,Number]} point
     */
    getWGS2Mars = (wgsLng, wgsLat) => {
        if (this._outofChina(wgsLat, wgsLng)) {
            return [wgsLng, wgsLat];
        }
        let marLat = 0.0;
        let marLng = 0.0;

        let lat = this._transformLat(wgsLng - 105.0, wgsLat - 35.0);
        let lng = this._transformLng(wgsLng - 105.0, wgsLat - 35.0);

        let radLat = wgsLat / 180.0 * PI;
        let magic = Math.sin(radLat);
        magic = 1 - EE * magic * magic;
        let sqrtMagic = Math.sqrt(magic);

        lat = (lat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
        lng = (lng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);

        marLat = wgsLat + lat;
        marLng = wgsLng + lng;
        return [marLng, marLat];
    }

    /**
     * 从火星转84
     * @param {Number} lng
     * @param {Number} lat
     * @return {[Number,Number]} point
     */
    getMars2WGS = (marsLng, marsLat) => {
        let prec = 0.000000001;
        let minx = marsLng - 0.5;
        let miny = marsLat - 0.5;
        let maxx = marsLng + 0.5;
        let maxy = marsLat + 0.5;

        let dis = 1.0;
        let curx = marsLng;
        let cury = marsLat;
        let calx = 0.0;
        let caly = 0.0;

        let count = 0;

        let wgsLat = 0.0;
        let wgsLng = 0.0;

        while (true) {
            if (dis <= prec) {
                break;
            } else {
                curx = (minx + maxx) / 2;
                cury = (miny + maxy) / 2;

                let mid = this._transform(cury, curx);
                caly = mid[0];
                calx = mid[1];

                if (caly >= marsLat) {
                    maxy = cury;
                } else {
                    miny = cury;
                }

                if (calx >= marsLng) {
                    maxx = curx;
                } else {
                    minx = curx;
                }

                dis = Math.abs(calx - marsLng) + Math.abs(caly - marsLat);
                count++;
                if (count >= 3) {
                    //fmt.Println("count:", count)
                    if (Math.abs(maxx - minx) < prec / 5 && Math.abs(calx - marsLng) > prec / 2) {
                        if (calx >= marsLng) {
                            minx -= 0.01;
                        } else {
                            maxx += 0.01;
                        }
                    }

                    if (Math.abs(maxy - miny) < prec / 5 && Math.abs(caly - marsLat) > prec / 2) {
                        if (caly >= marsLat) {
                            miny -= 0.01;
                        } else {
                            maxy += 0.01;
                        }
                    }

                    if (minx > maxx || miny > maxy || count > 300) {
                        wgsLng = 1.368660281996339E-7 * marsLng * marsLng * marsLng
                            + -1.180928130750135E-8 * marsLng * marsLng * marsLat
                            + -2.8882557135286497E-8 * marsLng * marsLat * marsLat
                            + -1.9701061211739227E-8 * marsLat * marsLat * marsLat
                            + -4.3871816410430085E-5 * marsLng * marsLng
                            + 2.312263036974062E-6 * marsLng * marsLat
                            + 3.524130062939154E-6 * marsLat * marsLat
                            + 1.0045663287213806 * marsLng
                            + -1.3931706059903598E-4 * marsLat
                            + -0.15629046141059658;

                        wgsLat = 1.9633521507503826E-10 * marsLng * marsLng * marsLng
                            + 5.042926958596946E-12 * marsLng * marsLng * marsLat
                            + 1.4343237310979937E-10 * marsLng * marsLat * marsLat
                            + 1.7413852403156825E-7 * marsLat * marsLat * marsLat
                            + -7.126752970697697E-8 * marsLng * marsLng
                            + -9.092793512456868E-7 * marsLng * marsLat
                            + -1.8936576425611334E-5 * marsLat * marsLat
                            + 2.1967158739942877E-5 * marsLng
                            + 1.0006054151828006 * marsLat
                            + -0.003172773997829536;

                        let mid = this._transform(wgsLat, wgsLng);
                        let calx1 = mid[0];
                        let caly1 = mid[1];

                        let dis1 = Math.abs(calx1 - marsLng) + Math.abs(caly1 - marsLat);
                        if (dis1 < dis) {

                            return [wgsLng, wgsLat];
                        }
                        wgsLat = cury;
                        wgsLng = curx;
                        return [wgsLng, wgsLat];
                    }
                }
            }
        }


        wgsLat = cury;
        wgsLng = curx;

        return [wgsLng, wgsLat];
    }

    /**
     * @private
     * @method 地图外部插件加载完成
     */
    _mapPluginLoaded = () => {
        if (!_mapPlugin) {

            return;
        }
        let that = this;

        let readingPlugin = function (mapIP) {

            //0 底图们
            //1 将84的点位转换为地图上应该有的点位
            //2 将地理信息坐标转化为84经纬度
            //3 获取要求的坐标系
            //4 最小层级
            //5 最大层级
            let plugin = eval(_mapPlugin.PluginContent);
            let info = plugin(mapIP);
            info[0].then((layers) => {
                if (info[1]) {
                    that.getMapPoint = info[1];
                }
                if (info[2]) {
                    that.getMapLngLat = info[2];
                }
                let view = undefined;

                //这里以后是个风险点 屏幕特别大的情况下 还是会出现循环 循环会出现很多问题
                let vl = that.getMapPoint(-90.99176740801454, -85.08450178981496);
                let vr = that.getMapPoint(179.99176740801454, 85.08450178981496);


                let minZoom = info[4];
                let maxZoom = info[5];

                if (!minZoom || isNaN(minZoom) || minZoom < 1) {
                    minZoom = 3;
                }

                if (!maxZoom || isNaN(maxZoom) || maxZoom > 20) {
                    maxZoom = 18;
                }

                if (_mapPlugin.ViewForce) {
                    view = new ol.View({
                        center: that.getMapPoint(_mapPlugin.ViewLng, _mapPlugin.ViewLat),
                        zoom: _mapPlugin.ViewZoom,
                        projection: info[3],
                        maxZoom: maxZoom,
                        minZoom: minZoom,
                        extent: [vl[0], vl[1], vr[0], vr[1]]
                    });
                } else {
                    let last = that._getLastPoint();
                    if (last) {
                        view = new ol.View({
                            center: that.getMapPoint(last[0], last[1]),
                            zoom: last[2],
                            projection: info[3],
                            maxZoom: maxZoom,
                            minZoom: minZoom,
                            extent: [vl[0], vl[1], vr[0], vr[1]]
                        });
                    } else {
                        view = new ol.View({
                            center: that.getMapPoint(_mapPlugin.ViewLng, _mapPlugin.ViewLat),
                            zoom: _mapPlugin.ViewZoom,
                            projection: info[3],
                            maxZoom: maxZoom,
                            minZoom: minZoom,
                            extent: [vl[0], vl[1], vr[0], vr[1]]
                        });
                    }
                }
                that._setMapCfg(layers, view);
            });
        };

        //这里去获取地图服务器IP地址
        //
        if (_mapIP) {
            readingPlugin(_mapIP);
        }
    }

    _setMapCfg = (layers, view) => {
        if (this.map) {
            let map = this.map;
            layers.map(function (value, index) {
                map.addLayer(value);
            });

            this.map.setView(view);
            this.map.updateSize();
            //触发事件通知外部可以进行点位加载了
            if (this.props.onMapLoaded) {
                this.props.onMapLoaded();
                this.setState({
                    levelShow: this.map.getView().getZoom()
                });
            }
        }
    }

    /**
     * @private
     * @method 生成guid唯一编码
     * @returns {string} 唯一编码
     */
    _guid() {
        function S4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
        return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
    }

    /**
     * 获取上次定位的地图点位
     */
    _getLastPoint() {
        if (window.localStorage['lastLng'] && window.localStorage['lastLat'] && window.localStorage['zoom']) {
            return [parseFloat(window.localStorage['lastLng']), parseFloat(window.localStorage['lastLat']), parseInt(window.localStorage['zoom'])];
        }
    }

    _saveLsatPoint() {
        if (this.map) {
            window.localStorage.setItem('mapZoom', this.map.getView().getZoom());
            let center = this.map.getView().getCenter();
            window.localStorage.setItem('mapLng', center[0]);
            window.localStorage.setItem('mapLat', center[1]);
        }
    }

    _outofChina = (lat, lng) => {
        if (lng < 72.004 || lng > 137.8347) {
            return true;
        }

        if (lat < 0.8293 || lat > 55.8271) {
            return true;
        }

        return false;
    }

    _transformLat = (wgsLng, wgsLat) => {
        let ret = -100.0 + 2.0 * wgsLng + 3.0 * wgsLat
            + 0.2 * wgsLat * wgsLat + 0.1 * wgsLng * wgsLat
            + 0.2 * Math.sqrt(Math.abs(wgsLng));

        ret += (20.0 * Math.sin(6.0 * wgsLng * PI) + 20.0 * Math.sin(2.0 * wgsLng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(wgsLat * PI) + 40.0 * Math.sin(wgsLat / 3.0 * PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(wgsLat / 12.0 * PI) + 320 * Math.sin(wgsLat * PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    _transformLng = (wgsLng, wgsLat) => {
        let ret = 300.0 + wgsLng + 2.0 * wgsLat + 0.1 * wgsLng * wgsLng
            + 0.1 * wgsLng * wgsLat + 0.1 * Math.sqrt(Math.abs(wgsLng));
        ret += (20.0 * Math.sin(6.0 * wgsLng * PI) + 20.0 * Math.sin(2.0 * wgsLng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(wgsLng * PI) + 40.0 * Math.sin(wgsLng / 3.0 * PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(wgsLng / 12.0 * PI) + 300.0 * Math.sin(wgsLng / 30.0 * PI)) * 2.0 / 3.0;
        return ret;
    }

    _transform = (wgLat, wgLon) => {
        let mglat = 0.0;
        let mglng = 0.0;
        if (this._outofChina(wgLat, wgLon)) {
            mglat = wgLat;
            mglng = wgLon;
            return [mglat, mglng];
        }

        let dLat = this._transformLat(wgLon - 105.0, wgLat - 35.0);
        let dLon = this._transformLng(wgLon - 105.0, wgLat - 35.0);

        let radLat = wgLat / 180.0 * PI;
        let magic = Math.sin(radLat);
        magic = 1 - EE * magic * magic;
        let sqrtMagic = Math.sqrt(magic);

        dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
        dLon = (dLon * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);

        mglat = wgLat + dLat;
        mglng = wgLon + dLon;
        return [mglat, mglng];
    }
    // 获取mapIP提供给组件外部
    getMapIp = () => {
        return _mapIP;
    }
    //1.添加icon
    addIcon = (coord, icon, layer) => {
        let vector = layer;
        let that = this;
        let map = that.map;
        if (!vector) {
            vector = new ol.layer.Vector({
                source: new ol.source.Vector(),
                id: '7881155'
            });
            map.addLayer(vector);
        }
        let feature = new ol.Feature({
            geometry: new ol.geom.Point(that.getMapPoint(coord[0], coord[1])),
            name: 'icon' + coord,
            id: 'icon' + coord
        });
        feature.setStyle(
            new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 19],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    src: icon,
                    crossOrigin: 'anonymous',
                    offsetOrigin: 'bottom-right',
                    offset: [1, 1],
                    scale: 1 //标注图标大小
                })
            })
        );
        vector.getSource().addFeature(feature);
        return { layer: vector, feature: feature };
    }

    //2.添加heatMap
    addHeatMap = (pointArr) => {
        let that = this;
        let map = that.map;
        let features = [];
        const max_count = Math.max.apply(
            Math,
            pointArr.map(function (item) {
                return item.count;
            })
        );
        pointArr.map((item, index) => {
            item.weight = item.count / max_count;
        });
        const vector = new ol.layer.Heatmap({
            gradient: ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
            blur: 10,
            radius: 10,
            shadow: 250,
            source: new ol.source.Vector({
                wrapX: false
            }),
            layerId: 'heatLayer'
        });
        pointArr.forEach(function (data) {
            let _feature = new ol.Feature({
                geometry: new ol.geom.Point(
                    that.getMapPoint(data.coords[0], data.coords[1])
                ),
                data: data,
                weight: data.weight
            });
            features.push(_feature);
        });

        vector.getSource().addFeatures(features);
        map.addLayer(vector);
        return vector;
    }
    //3.添加line  coordinates=[lon,lat]
    addLine = (coordinates, vectorLayer) => {
        let that = this;
        let map = that.map;

        //实例一个线(标记点)的全局变量
        let geometry = new ol.geom.LineString(); //线,Point 点,Polygon 面

        //添加标记点
        function addPonitToGeometry(arr) {
            for (let i = 0; i < arr.length; i++) {
                geometry.appendCoordinate(that.getMapPoint(arr[i][0], arr[i][1]));
            }
        }
        addPonitToGeometry(coordinates);

        let LineStringFeature = new ol.Feature(geometry); //绘制线的数据

        if (!vectorLayer) {  //是否已经存在图层
            //实例化一个矢量图层Vector作为绘制层
            let source = new ol.source.Vector();
            vectorLayer = new ol.layer.Vector({
                source: source,
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#f00',
                        width: 4
                    }),
                    image: new ol.style.Circle({
                        radius: 2,
                        fill: new ol.style.Fill({
                            color: '#f00'
                        })
                    })
                })
            });
            //将线添加到Vector绘制层上
            source.addFeature(LineStringFeature);
            map.addLayer(vectorLayer); //将绘制层添加到地图容器中
        } else {
            vectorLayer.getSource().addFeature(LineStringFeature);
        }
        return vectorLayer;
    }
    render() {
        const { levelShow } = this.state;
        return (
            <div className="unvMap" ref="unvMap">
                <div id={this.state.id} className="unvSelfMap" style={{ height: this.state.height }}></div>
                <div style={{ height: '30px', position: 'absolute', right: '10px', bottom: '0', color: '#333' }}>级别：{levelShow}</div>
            </div>
        );
    }
}