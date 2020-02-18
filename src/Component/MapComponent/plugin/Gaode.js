/* eslint-disable */
let getPlugin = function (ip) {
    let res2 = [];
    for(let i=0 ;i< 19; i++){
        res2[i] = 20037508.3427892 * 2 / 256 / Math.pow(2, i);
    }
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
                    projection: 'EPSG:3857',
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
                        let url = 'http://'+ip+'/maptiles/gaode2d/L' + padLeft(z, 2, '0') + '/R' + padLeft(y, 8, '0') + '/C' + padLeft(x, 8, '0') + '.png';
                        return url;
                    }
                })
            })
        ]);
    });
    let r1 = function(lng, lat) {
        return ol.proj.transform([lng, lat], 'EPSG:4326', 'EPSG:3857');
    };
    let r2 = function(point) {
        return ol.proj.transform(point, 'EPSG:3857', 'EPSG:4326');
    };
    //0 返回底图用的Promise
    //1 将84的点位转换为地图上应该有的点位
    //2 将地理信息坐标转化为84经纬度
    //3 获取要求的坐标系
    //4 最小层级
    //5 最大层级
    return [r0, r1, r2, 'EPSG:3857', 2, 18];
};
getPlugin;