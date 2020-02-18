import React, { Component } from 'react';
import UnvMap from '../../Map/UnvMapWithoutVM';
import ol from 'openlayers';
class Location extends Component {
    constructor(props) {
        super(props);
        this.state = {
            map: '',
            layer: ''
        };
    }
    componentWillUnmount() {
        const { map, layer } = this.state;
        !!map && map.removeLayer(layer);
    }
    onMapLoaded = () => {
        const { coords, icon, center, callBack } = this.props.options;

        // 点位坐标
        let lon = coords && coords[0];
        let lat = coords && coords[1];
        let that = this;
        let map = that.map.getBaseMap();
        let source = new ol.source.Vector();
        let getMapPoint = that.map.getMapPoint;
        let getMapLngLat = that.map.getMapLngLat;
        this.setState({ map });
        let feature = 0;
        // 新建图层
        let layer = new ol.layer.Vector({
            source: source,
            zIndex: 6
        });
        map.addLayer(layer);
        this.setState({ layer });
        if (lon && lat) {
            feature = new ol.Feature({
                geometry: new ol.geom.Point(getMapPoint(lon, lat))
            });
            // 要素样式设置
            feature.setStyle(
                new ol.style.Style({
                    image: new ol.style.Icon({
                        anchor: [0.5, 1],
                        anchorXUnits: 'fraction',
                        anchorYUnits: 'pixels',
                        src: `${icon}`,
                        crossOrigin: 'anonymous',
                        scale: 1 //标注图标大小
                    })
                })
            );

            source.addFeatures([feature]);
        }
        if (center && center.length !== 0) {
            map.getView().setCenter(getMapPoint(center[0], center[1]));
        }
        // 监听singleclick事件
        map.on('singleclick', function (e) {
            if (!!feature) {
                source.removeFeature(feature);
            }
            let coord = e.coordinate;
            //将坐标存储
            feature = new ol.Feature({
                geometry: new ol.geom.Point(coord)
            });
            feature.setStyle(
                new ol.style.Style({
                    image: new ol.style.Icon({
                        anchor: [0.5, 1],
                        anchorXUnits: 'fraction',
                        anchorYUnits: 'pixels',
                        src: `${icon}`,
                        crossOrigin: 'anonymous',
                        scale: 1 //标注图标大小
                    })
                })
            );
            // 添加要素
            source.addFeatures([feature]);
            if (callBack) {
                callBack(getMapLngLat(coord));
            }
        });
    }
    render() {
        return (
            <UnvMap
                onMapLoaded={this.onMapLoaded}
                ref={(self) => { this.map = self; }}
            />
        );
    }
}
export default Location;
