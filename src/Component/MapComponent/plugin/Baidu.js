/* eslint-disable */
let getPlugin = function (ip) {
    let res2 = [
        262144, //0
        131072, //1
        65536,
        32768,
        16384,
        8192,
        4096,
        2048,
        1024,
        512,
        256,
        128,
        64,
        32,
        16,
        8,
        4,
        2,
        1
    ];

    let HALF_SIZE = Math.PI * 6378137;
    let selfEPSGBaidu = {};
    const A = 6378245.0;
    const EE = 0.00669342162296594323;
    const PI = 3.14159265358979324; 
    let that = this;
    selfEPSGBaidu.Projection_ = function (code) {
        ol.proj.Projection.call(this, {
            code: code,
            units: ol.proj.Units.METERS,
            extent: [
                -HALF_SIZE, -HALF_SIZE,
                HALF_SIZE, HALF_SIZE
            ],
            worldExtent: [-180, -90, 180, 90],
            global: true
        });
    }
    ol.inherits(selfEPSGBaidu.Projection_, ol.proj.Projection);

    selfEPSGBaidu.PROJECTIONS = [
        new selfEPSGBaidu.Projection_('EPSG:Baidu')
    ];

    ol.proj.addEquivalentProjections(selfEPSGBaidu.PROJECTIONS);
    let projection = ol.proj.get('EPSG:Baidu');

    let module = function () {
        var define, module, exports; return function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == 'function' && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error('Cannot find module \'' + o + '\''); throw f.code = 'MODULE_NOT_FOUND', f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == 'function' && require; for (var o = 0; o < r.length; o++)s(r[o]); return s }({ 1: [function (require, module, exports) { var forEachPoint = require('../util').forEachPoint; var gcj02 = require('./gcj-02'); var PI = Math.PI; var X_PI = PI * 3e3 / 180; function toGCJ02(input, output, offset) { var x = input[offset] - .0065; var y = input[offset + 1] - .006; var z = Math.sqrt(x * x + y * y) - 2e-5 * Math.sin(y * X_PI); var theta = Math.atan2(y, x) - 3e-6 * Math.cos(x * X_PI); output[offset] = z * Math.cos(theta); output[offset + 1] = z * Math.sin(theta); return output } function fromGCJ02(input, output, offset) { var x = input[offset]; var y = input[offset + 1]; var z = Math.sqrt(x * x + y * y) + 2e-5 * Math.sin(y * X_PI); var theta = Math.atan2(y, x) + 3e-6 * Math.cos(x * X_PI); output[offset] = z * Math.cos(theta) + .0065; output[offset + 1] = z * Math.sin(theta) + .006; return output } exports.toWGS84 = function (input, opt_output, opt_dimension) { var output = forEachPoint(toGCJ02)(input, opt_output, opt_dimension); return gcj02.toWGS84(output, output, opt_dimension) }; exports.fromWGS84 = function (input, opt_output, opt_dimension) { var output = gcj02.fromWGS84(input, opt_output, opt_dimension); return forEachPoint(fromGCJ02)(output, output, opt_dimension) } }, { '../util': 8, './gcj-02': 2 }], 2: [function (require, module, exports) { var forEachPoint = require('../util').forEachPoint; var PI = Math.PI; var AXIS = 6378245; var OFFSET = .006693421622965943; function delta(wgLon, wgLat) { var dLat = transformLat(wgLon - 105, wgLat - 35); var dLon = transformLon(wgLon - 105, wgLat - 35); var radLat = wgLat / 180 * PI; var magic = Math.sin(radLat); magic = 1 - OFFSET * magic * magic; var sqrtMagic = Math.sqrt(magic); dLat = dLat * 180 / (AXIS * (1 - OFFSET) / (magic * sqrtMagic) * PI); dLon = dLon * 180 / (AXIS / sqrtMagic * Math.cos(radLat) * PI); return [dLon, dLat] } function outOfChina(lon, lat) { if (lon < 72.004 || lon > 137.8347) { return true } if (lat < .8293 || lat > 55.8271) { return true } return false } function transformLat(x, y) { var ret = -100 + 2 * x + 3 * y + .2 * y * y + .1 * x * y + .2 * Math.sqrt(Math.abs(x)); ret += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3; ret += (20 * Math.sin(y * PI) + 40 * Math.sin(y / 3 * PI)) * 2 / 3; ret += (160 * Math.sin(y / 12 * PI) + 320 * Math.sin(y * PI / 30)) * 2 / 3; return ret } function transformLon(x, y) { var ret = 300 + x + 2 * y + .1 * x * x + .1 * x * y + .1 * Math.sqrt(Math.abs(x)); ret += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3; ret += (20 * Math.sin(x * PI) + 40 * Math.sin(x / 3 * PI)) * 2 / 3; ret += (150 * Math.sin(x / 12 * PI) + 300 * Math.sin(x / 30 * PI)) * 2 / 3; return ret } exports.toWGS84 = forEachPoint(function (input, output, offset) { var lng = input[offset]; var lat = input[offset + 1]; if (!outOfChina(lng, lat)) { var deltaD = delta(lng, lat); lng = lng - deltaD[0]; lat = lat - deltaD[1] } output[offset] = lng; output[offset + 1] = lat }); exports.fromWGS84 = forEachPoint(function (input, output, offset) { var lng = input[offset]; var lat = input[offset + 1]; if (!outOfChina(lng, lat)) { var deltaD = delta(lng, lat); lng = lng + deltaD[0]; lat = lat + deltaD[1] } output[offset] = lng; output[offset + 1] = lat }) }, { '../util': 8 }], 3: [function (require, module, exports) { exports.bd09 = require('./bd-09'); exports.gcj02 = require('./gcj-02') }, { './bd-09': 1, './gcj-02': 2 }], 4: [function (require, module, exports) { var projection = require('./projection/index'); var datum = require('./datum/index'); exports.smerc2bmerc = function (input, opt_output, opt_dimension) { var output = projection.sphericalMercator.inverse(input, opt_output, opt_dimension); output = datum.bd09.fromWGS84(output, output, opt_dimension); return projection.baiduMercator.forward(output, output, opt_dimension) }; exports.bmerc2smerc = function (input, opt_output, opt_dimension) { var output = projection.baiduMercator.inverse(input, opt_output, opt_dimension); output = datum.bd09.toWGS84(output, output, opt_dimension); return projection.sphericalMercator.forward(output, output, opt_dimension) }; exports.bmerc2ll = function (input, opt_output, opt_dimension) { var output = projection.baiduMercator.inverse(input, opt_output, opt_dimension); return datum.bd09.toWGS84(output, output, opt_dimension) }; exports.ll2bmerc = function (input, opt_output, opt_dimension) { var output = datum.bd09.fromWGS84(input, opt_output, opt_dimension); return projection.baiduMercator.forward(output, output, opt_dimension) }; exports.ll2smerc = projection.sphericalMercator.forward; exports.smerc2ll = projection.sphericalMercator.inverse; exports.datum = datum; exports.projection = projection }, { './datum/index': 3, './projection/index': 6 }], 5: [function (require, module, exports) { var forEachPoint = require('../util').forEachPoint; var MCBAND = [12890594.86, 8362377.87, 5591021, 3481989.83, 1678043.12, 0]; var LLBAND = [75, 60, 45, 30, 15, 0]; var MC2LL = [[1.410526172116255e-8, 898305509648872e-20, -1.9939833816331, 200.9824383106796, -187.2403703815547, 91.6087516669843, -23.38765649603339, 2.57121317296198, -.03801003308653, 17337981.2], [-7.435856389565537e-9, 8983055097726239e-21, -.78625201886289, 96.32687599759846, -1.85204757529826, -59.36935905485877, 47.40033549296737, -16.50741931063887, 2.28786674699375, 10260144.86], [-3.030883460898826e-8, 898305509983578e-20, .30071316287616, 59.74293618442277, 7.357984074871, -25.38371002664745, 13.45380521110908, -3.29883767235584, .32710905363475, 6856817.37], [-1.981981304930552e-8, 8983055099779535e-21, .03278182852591, 40.31678527705744, .65659298677277, -4.44255534477492, .85341911805263, .12923347998204, -.04625736007561, 4482777.06], [3.09191371068437e-9, 8983055096812155e-21, 6995724062e-14, 23.10934304144901, -.00023663490511, -.6321817810242, -.00663494467273, .03430082397953, -.00466043876332, 2555164.4], [2.890871144776878e-9, 8983055095805407e-21, -3.068298e-8, 7.47137025468032, -353937994e-14, -.02145144861037, -1234426596e-14, .00010322952773, -323890364e-14, 826088.5]]; var LL2MC = [[-.0015702102444, 111320.7020616939, 0x60e374c3105a3, -0x24bb4115e2e164, 0x5cc55543bb0ae8, -0x7ce070193f3784, 0x5e7ca61ddf8150, -0x261a578d8b24d0, 0x665d60f3742ca, 82.5], [.0008277824516172526, 111320.7020463578, 647795574.6671607, -4082003173.641316, 10774905663.51142, -15171875531.51559, 12053065338.62167, -5124939663.577472, 913311935.9512032, 67.5], [.00337398766765, 111320.7020202162, 4481351.045890365, -23393751.19931662, 79682215.47186455, -115964993.2797253, 97236711.15602145, -43661946.33752821, 8477230.501135234, 52.5], [.00220636496208, 111320.7020209128, 51751.86112841131, 3796837.749470245, 992013.7397791013, -1221952.21711287, 1340652.697009075, -620943.6990984312, 144416.9293806241, 37.5], [-.0003441963504368392, 111320.7020576856, 278.2353980772752, 2485758.690035394, 6070.750963243378, 54821.18345352118, 9540.606633304236, -2710.55326746645, 1405.483844121726, 22.5], [-.0003218135878613132, 111320.7020701615, .00369383431289, 823725.6402795718, .46104986909093, 2351.343141331292, 1.58060784298199, 8.77738589078284, .37238884252424, 7.45]]; function getRange(v, min, max) { v = Math.max(v, min); v = Math.min(v, max); return v } function getLoop(v, min, max) { var d = max - min; while (v > max) { v -= d } while (v < min) { v += d } return v } function convertor(input, output, offset, table) { var px = input[offset]; var py = input[offset + 1]; var x = table[0] + table[1] * Math.abs(px); var d = Math.abs(py) / table[9]; var y = table[2] + table[3] * d + table[4] * d * d + table[5] * d * d * d + table[6] * d * d * d * d + table[7] * d * d * d * d * d + table[8] * d * d * d * d * d * d; output[offset] = x * (px < 0 ? -1 : 1); output[offset + 1] = y * (py < 0 ? -1 : 1) } exports.forward = forEachPoint(function (input, output, offset) { var lng = getLoop(input[offset], -180, 180); var lat = getRange(input[offset + 1], -74, 74); var table = null; var j; for (j = 0; j < LLBAND.length; ++j) { if (lat >= LLBAND[j]) { table = LL2MC[j]; break } } if (table === null) { for (j = LLBAND.length - 1; j >= 0; --j) { if (lat <= -LLBAND[j]) { table = LL2MC[j]; break } } } output[offset] = lng; output[offset + 1] = lat; convertor(output, output, offset, table) }); exports.inverse = forEachPoint(function (input, output, offset) { var y_abs = Math.abs(input[offset + 1]); var table = null; for (var j = 0; j < MCBAND.length; j++) { if (y_abs >= MCBAND[j]) { table = MC2LL[j]; break } } convertor(input, output, offset, table) }) }, { '../util': 8 }], 6: [function (require, module, exports) { exports.baiduMercator = require('./baidu-mercator'); exports.sphericalMercator = require('./spherical-mercator') }, { './baidu-mercator': 5, './spherical-mercator': 7 }], 7: [function (require, module, exports) { var forEachPoint = require('../util').forEachPoint; var RADIUS = 6378137; var MAX_LATITUDE = 85.0511287798; var RAD_PER_DEG = Math.PI / 180; exports.forward = forEachPoint(function (input, output, offset) { var lat = Math.max(Math.min(MAX_LATITUDE, input[offset + 1]), -MAX_LATITUDE); var sin = Math.sin(lat * RAD_PER_DEG); output[offset] = RADIUS * input[offset] * RAD_PER_DEG; output[offset + 1] = RADIUS * Math.log((1 + sin) / (1 - sin)) / 2 }); exports.inverse = forEachPoint(function (input, output, offset) { output[offset] = input[offset] / RADIUS / RAD_PER_DEG; output[offset + 1] = (2 * Math.atan(Math.exp(input[offset + 1] / RADIUS)) - Math.PI / 2) / RAD_PER_DEG }) }, { '../util': 8 }], 8: [function (require, module, exports) { exports.forEachPoint = function (func) { return function (input, opt_output, opt_dimension) { var len = input.length; var dimension = opt_dimension ? opt_dimension : 2; var output; if (opt_output) { output = opt_output } else { if (dimension !== 2) { output = input.slice() } else { output = new Array(len) } } for (var offset = 0; offset < len; offset += dimension) { func(input, output, offset) } return output } } }, {}] }, {}, [4])(4);
    }()

    ol.proj.addCoordinateTransforms('EPSG:4326', 'EPSG:Baidu', module.ll2bmerc, module.bmerc2ll);
    ol.proj.addCoordinateTransforms('EPSG:3857', 'EPSG:Baidu', module.smerc2bmerc, module.bmerc2smerc);

    let tilegrid = new ol.tilegrid.TileGrid({
        origin: [0, 0],
        resolutions: res2,
        tileSize: [256, 256]
    });

    let padLeft = function(str, totalWidth, paddingChar) {
        if (str.length > totalWidth || paddingChar.length != 1) {
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

    let r0 = new Promise(function (resolve, reject) {
        //这里返回底图信息
        resolve([
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    projection: projection,
                    tileGrid: tilegrid,
                    tileUrlFunction: function (tileCoord, pixelRatio, proj) {
                        if (!tileCoord) return '';

                        var z = tileCoord[0];
                        var x = tileCoord[1];
                        var y = tileCoord[2];

                        //之前我们的原点是倒叙且偏移的 这里直接进行修复 不再进行坐标系偏移
                        switch (z) {
                            case 1:
                                x = x;
                                y = -y - 1;
                                break;
                            case 2:
                                x = x + 2;
                                y = -y + 1;
                                break;
                            case 3:
                                x = x + 4;
                                y = -y + 3;
                                break;
                            case 4:
                                x = x + 8;
                                y = -y + 7;
                                break;
                            case 5:
                                x = x + 16;
                                y = -y + 15;
                                break;
                            case 6:
                                x = x + 32;
                                y = -y + 31;
                                break;
                            case 7:
                                x = x + 64;
                                y = -y + 63;
                                break;
                            case 8:
                                x = x + 128;
                                y = -y + 127;
                                break;
                            case 9:
                                x = x + 256;
                                y = -y + 255;
                                break;
                            case 10:
                                x = x + 512;
                                y = -y + 511;
                                break;
                            case 11:
                                x = x + 1024;
                                y = -y + 1023;
                                break;
                            case 12:
                                x = x + 2048;
                                y = -y + 2047;
                                break;
                            case 13:
                                x = x + 4096;
                                y = -y + 4095;
                                break;
                            case 14:
                                x = x + 8192;
                                y = -y + 8191;
                                break;
                            case 15:
                                x = x + 16384;
                                y = -y + 16383;
                                break;
                            case 16:
                                x = x + 32768;
                                y = -y + 32767;
                                break;
                            case 17:
                                x = x + 65536;
                                y = -y + 65535;
                                break;
                            case 18:
                                x = x + 131072;
                                y = -y + 131071;
                                break;
                            case 19:
                                x = x + 262144;
                                y = -y + 262143;
                                break;
                            default:
                                break;
                        }
                        z = z.toString();
                        x = x.toString(16);
                        y = y.toString(16);
                        let url = 'http://'+ip+'/maptiles/baidu2d/L' + padLeft(z, 2, '0') + '/R' + padLeft(y, 8, '0') + '/C' + padLeft(x, 8, '0') + '.png';
                        return url;
                    }
                })
            })
        ]);
    });
    function _outofChina(lat, lng) {
        if (lng < 72.004 || lng > 137.8347) {
            return true;
        }

        if (lat < 0.8293 || lat > 55.8271) {
            return true;
        }

        return false;
    }
    function _transformLat(wgsLng, wgsLat) {
        let ret = -100.0 + 2.0 * wgsLng + 3.0 * wgsLat
            + 0.2 * wgsLat * wgsLat + 0.1 * wgsLng * wgsLat
            + 0.2 * Math.sqrt(Math.abs(wgsLng));

        ret += (20.0 * Math.sin(6.0 * wgsLng * PI) + 20.0 * Math.sin(2.0 * wgsLng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(wgsLat * PI) + 40.0 * Math.sin(wgsLat / 3.0 * PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(wgsLat / 12.0 * PI) + 320 * Math.sin(wgsLat * PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    function _transformLng(wgsLng, wgsLat) {
        let ret = 300.0 + wgsLng + 2.0 * wgsLat + 0.1 * wgsLng * wgsLng
            + 0.1 * wgsLng * wgsLat + 0.1 * Math.sqrt(Math.abs(wgsLng));
        ret += (20.0 * Math.sin(6.0 * wgsLng * PI) + 20.0 * Math.sin(2.0 * wgsLng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(wgsLng * PI) + 40.0 * Math.sin(wgsLng / 3.0 * PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(wgsLng / 12.0 * PI) + 300.0 * Math.sin(wgsLng / 30.0 * PI)) * 2.0 / 3.0;
        return ret;
    }
    function transform(wgLat, wgLon) {
        let mglat = 0.0;
        let mglng = 0.0;
        if (_outofChina(wgLat, wgLon)) {
            mglat = wgLat;
            mglng = wgLon;
            return [mglat, mglng];
        }

        let dLat = _transformLat(wgLon - 105.0, wgLat - 35.0);
        let dLon = _transformLng(wgLon - 105.0, wgLat - 35.0);

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
    /**
     * 从84转火星
     * @param {Number} wgsLng 经度
     * @param {Number} wgsLat 纬度
     * @return {[Number,Number]} point
     */
    function getWGS2Mars(wgsLng, wgsLat) {
        if (_outofChina(wgsLat, wgsLng)) {
            return [wgsLng, wgsLat];
        }

        let marLat = 0.0;
        let marLng = 0.0;

        let lat = _transformLat(wgsLng - 105.0, wgsLat - 35.0);
        let lng = _transformLng(wgsLng - 105.0, wgsLat - 35.0);

        let radLat = wgsLat / 180.0 * PI;
        let magic = Math.sin(radLat);
        magic = 1 - EE * magic * magic;
        let sqrtMagic = Math.sqrt(magic);

        lat = (lat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
        lng = (lng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);

        marLat = wgsLat + lat;
        marLng = wgsLng + lng;

        return [parseFloat(marLng.toFixed(12)), parseFloat(marLat.toFixed(12))];
    }
    /**
     * 从火星转84
     * @param {Number} lng
     * @param {Number} lat
     * @return {[Number,Number]} point
     */
    function getMars2WGS(marsLng, marsLat) {
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
                break
            } else {
                curx = (minx + maxx) / 2;
                cury = (miny + maxy) / 2;

                let mid = transform(cury, curx);
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

                        let mid = transform(wgsLat, wgsLng);
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

        return [parseFloat(wgsLng.toFixed(12)), parseFloat(wgsLat.toFixed(12))];
    }
    let r1 = function (lng, lat) {
        let mar2wgs = getMars2WGS(lng,lat);
        return ol.proj.transform(mar2wgs, 'EPSG:4326', 'EPSG:Baidu');
    };

    let r2 = function (point) {
        let wgs =  ol.proj.transform(point, 'EPSG:Baidu', 'EPSG:4326');
        return getWGS2Mars(wgs[0],wgs[1]);
    };

    //0 返回底图用的Promise
    //1 将84的点位转换为地图上应该有的点位
    //2 将地理信息坐标转化为84经纬度
    //3 获取要求的坐标系
    //4 最小层级
    //5 最大层级
    return [r0, r1, r2, 'EPSG:Baidu', 3, 19];
};
getPlugin;