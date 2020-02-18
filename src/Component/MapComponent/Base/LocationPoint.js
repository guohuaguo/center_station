import React, { Component } from 'react';
import UnvMap from '../../Map/UnvMapWithoutVM';
//显示当前的位置组件
class LocationPoint extends Component {
    constructor(props) {
        super(props);
    }
    onMapLoaded = () => {
        const { coords, icon } = this.props.options;  //coords=[lon,lat]  lon:经度 lat:纬度
        let that = this;
        let map = that.map.getBaseMap();
        // 添加点位
        that.map.addIcon(coords, icon);
        // 设置地图的view
        map.getView().setCenter(that.map.getMapPoint(coords[0], coords[1]));
        map.getView().setZoom(10);
    }
    render() {
        return (
            <UnvMap onMapLoaded={this.onMapLoaded} ref={(self) => { this.map = self; }} />
        );
    }
}
export default LocationPoint;