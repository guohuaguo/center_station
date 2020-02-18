/**
 * 地图框选
 *  */
import React, { Component } from 'react';
import {
    Button,
    Input,
    Modal
} from 'antd';
import ol from 'openlayers';
import UnvMap from '../../Map/UnvMapWithoutVM';
import FilterFeature from '../Base/FilterFeature';
import DrawTypeMenu from './DrawTypeMenu';
import '../style/index.less';
const Search = Input.Search;
let featureLayer;
let getMapPoint;
let _source = new ol.source.Vector();
let _featureLayer = new ol.layer.Vector({
    source: _source,
    zIndex: 500
});

class MapSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: true,
            confirmLoading: false,
            drawType: 'Circle',
            selectedCount: 0
        };
    }

    // 取消
    handleCancel = () => {
        this.setState({
            visible: false
        });
    };
    //确定
    handleConfirm = () => {
        this.setState({
            visible: false
        });
    };
    onChange = (checkedValues) => {
        console.log('checked = ', checkedValues);
    };
    //选中绘制
    selectMenuHandle = (data) => {
        document.getElementById('list_container').innerHTML = '';
        let that = this;
        let map = that.map.getBaseMap();
        that.setState({ drawType: data }, () => {
            let options = {
                map: map,
                featureLayer,
                drawType: data,
                getMapPoint: getMapPoint,
                callBack: that.showSelectedList
            };
            FilterFeature.selectFeatures(options);
        });
    };
    //清除选中
    clearDevice = () => {
        let map = this.map.getBaseMap();
        document.getElementById('list_container').innerHTML = '';
        this.setState({ drawType: 'None' }, () => {
            FilterFeature.handleClean(map);
        });
    };
    //选中列表显示
    showSelectedList = (data) => {
        let that = this;
        let map = that.map.getBaseMap();
        _source.clear();
        let htmlStr = '';
        let features = [];
        data.map((item, index) => {
            htmlStr += `<li class="selectedItem"> <span>${index + 1}</span>${item.get(
                'name'
            )}<i></i></li>`;
        });
        document.getElementById('list_container').innerHTML = htmlStr;
        this.setState({ selectedCount: data.length });
    };
    onMapLoaded = () => {
        const { mapSelectData } = this.props;
        const { drawType } = this.state;
        let that = this;
        let map = that.map.getBaseMap();
        map.addLayer(_featureLayer);
        getMapPoint = that.map.getMapPoint;
        let featureSource = new ol.source.Vector();
        if (mapSelectData.length === 0) {
            return;
        }
        let Features = [];
        mapSelectData.map((item, index) => {
            let feature = new ol.Feature({
                geometry: new ol.geom.Point(
                    getMapPoint(item.coords[0], item.coords[1])
                ),
                labelPoint: new ol.geom.Point([item.coords[0] + 1, item.coords[1] + 1]),
                name: item.name || index
            });
            feature.setStyle(
                new ol.style.Style({
                    image: new ol.style.Icon({
                        anchor: [0.5, 1],
                        anchorXUnits: 'fraction',
                        anchorYUnits: 'pixels',
                        src: `${item.icon}`,
                        crossOrigin: 'anonymous',
                        scale: 1 //标注图标大小
                    }),
                    text: new ol.style.Text({
                        offsetX: 0,
                        offsetY: -5,
                        text: `${item.text}` || '',
                        fill: new ol.style.Fill({ color: '#00f' })
                    })
                })
            );
            Features.push(feature);
        });

        featureSource.addFeatures(Features);
        featureLayer = new ol.layer.Vector({
            source: featureSource
        });
        map.addLayer(featureLayer);
        let options = {
            map: map,
            featureLayer,
            drawType: drawType,
            getMapPoint: getMapPoint,
            callBack: that.showSelectedList
        };
        FilterFeature.selectFeatures(options);
    };
    render() {
        const {
            visible,
            selectedCount
        } = this.state;
        return (
            <Modal
                title="地图选择"
                className="MapSelect"
                width="1000px"
                height="650px"
                mask={false}
                footer={false}
                visible={visible}
                onCancel={this.handleCancel}
            >
                <div className="MapSelect_container">
                    <div className="MapSelect_wrapper">
                        <div className="deviceList_wrapper">
                            <div className="title">
                                <div>
                                    已选择设备:<span style={{ fontWeight: 'bold' }}>
                                        {selectedCount}
                                    </span>个
                              </div>
                                <Button style={{ height: '25px' }} onClick={this.clearDevice}>
                                    清空
                              </Button>
                            </div>

                            <div className="list_container">
                                <ul id="list_container" />
                            </div>
                        </div>
                        <div className="map_box">
                            <div className="">
                                <div className="serch_box">
                                    <Search
                                        placeholder="请输入关键词"
                                        onSearch={(value) => console.log(value)}
                                        style={{ width: 220 }}
                                    />
                                </div>
                                <div className="select_menu">
                                    <DrawTypeMenu callBack={this.selectMenuHandle} />
                                </div>
                            </div>
                            <UnvMap
                                ref={(self) => {
                                    this.map = self;
                                }}
                                onMapLoaded={this.onMapLoaded}
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <Button type="primary"
                            style={{
                                marginRight: '10px',
                                background: '#4A8FF7',
                                color: '#fff',
                                height: '30px',
                                width: '120px'
                            }}
                            onClick={this.handleConfirm}
                        >
                            确定
                      </Button>
                        <Button
                            style={{
                                height: '30px',
                                width: '120px',
                                color: '#333333'
                            }}
                            onClick={this.handleCancel}
                        >
                            取消
                      </Button>
                    </div>
                </div>
            </Modal>
        );
    }
}

export default MapSelect;
