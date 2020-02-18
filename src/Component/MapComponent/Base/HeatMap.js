import React, { Component } from 'react';
import UnvMap from '../../Map/UnvMapWithoutVM';

class HeatMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            heatMapLayer: ''
        };
    }
    componentWillReceiveProps(nextProps) {
        const { heatMapLayer } = this.state;
        const { coordsArrayObj, center } = nextProps.options;
        let that = this;
        // 获取地图对象
        let map = that.map.getBaseMap();
        map.removeLayer(heatMapLayer);
        // 新建热力图层
        let _heatMapLayer = that.map.addHeatMap(coordsArrayObj);
        // 设置地图中心位置
        if (center) {
            map.getView().setCenter(that.map.getMapPoint(center[0], center[1]));
            map.getView().setZoom(6);
        }
        that.setState({ heatMapLayer: _heatMapLayer });
    }
    // 地图加载后执行
    onMapLoaded = () => {
        const { coordsArrayObj, center } = this.props.options;
        let that = this;
        // 获取地图对象
        let map = that.map.getBaseMap();
        let heatMapLayer = that.map.addHeatMap(coordsArrayObj);
        if (center) {
            map.getView().setCenter(that.map.getMapPoint(center[0], center[1]));
            map.getView().setZoom(6);
        }
        that.setState({ heatMapLayer });
    }
    render() {
        return (
            <UnvMap
                onMapLoaded={this.onMapLoaded}
                ref={(self) => {
                    this.map = self;
                }}
            />
        );
    }
}
export default HeatMap;
