import React, { Component } from 'react';
import { message, Modal, Button, Input, Select, Spin } from 'antd';
import moment from 'moment';
import axios from 'axios';
import DrawViewRange from './DrawViewRange';
import { addDeviceData, modifyDeviceData } from './ApiUtils';
let itemTitles = ['卡口编号 :', '卡口名称 :', '所属区域 :', '相关描述 :'];
let layerType = [
    {
        name: '视频专网',
        LayerCode: 1
    },
    {
        name: '公安自建',
        LayerCode: 2
    },
    {
        name: '社会资源',
        LayerCode: 3
    }];
let deviceType = [
    {
        name: '标清枪机',
        MarkerType: 1
    },
    {
        name: '标清球机',
        MarkerType: 2
    },
    {
        name: '高清枪机',
        MarkerType: 7
    },
    {
        name: '高清球机',
        MarkerType: 8
    }];
const Option = Select.Option;
class AddBayonet extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            visible: true,
            drawData: {},
            modifyData: {},
            itemAbstract: this.props.addNewData.MarkerDesc,
            itemLocation: this.props.addNewData.MarkerDomain,
            itemName: this.props.addNewData.MarkerName,
            itemNumber: this.props.addNewData.Id,
            itemDevice: this.props.addNewData.Id,
            itemLayer: this.props.addNewData.LayerType,
            itemLat: this.props.addNewData.Lat,
            itemLng: this.props.addNewData.Lng,
            itemShowName: this.props.addNewData.LayerType,
            data: {},
            ViewSheds: this.props.addNewData.ViewSheds,
            ViewAngle: this.props.addNewData.ViewAngle,
            MarkerAngle: this.props.addNewData.MarkerAngle
        };
    }

    componentDidMount() {
        let { itemLayer } = this.state;
        layerType.map((item, index) => {
            if (item === this.props.addNewData.LayerType) {
                this.setState({
                    itemLayer: item.name
                });
            }
        });
    }
    //可视域修改或新增接口调用
    setMarkerInfo = (isCreate) => {
        const { drawData } = this.state;
        const { ponitInfo, map } = this.props;
        let param = {
            'Id': '',
            'MarkerCode': '',
            'MarkerName': '',
            'MarkerStreet': '',
            'MarkerDesc': '',
            'LayerType': '',
            'LayerCode': '',
            'MarkerType': '',
            'DeviceCode': '',
            'DeviceName': '',
            'ViewSheds': '',
            'ViewAngle': '',
            'MarkerAngle': '',
            'CreateTime': '',
            'Lng': '',
            'Lat': '',
            'UserName': ''
        };
        if (ponitInfo) {  //更新
            for (let key in param) {
                param[key] = parseInt(drawData[key]) || ponitInfo.get(key);
            }
        }
        param['ModifyTime'] = moment().format('YYYY-MM-DD HH:mm:ss');
        // param["Buildtype"] = '1';
        let requestType = 'PUT';
        if (isCreate) { //判断是否是新增
            requestType = 'POST';
        }
        //获取点位
        let queryParams = {
            url: '/api/marker/dynamicvisual',
            method: requestType,
            data: param
        };
        axios(queryParams).then((res) => {
            let _result = res.data;
            map.render();
        }).catch(() => { });
    }

    //确定
    handleConfirm = () => {
        const { ViewSheds, ViewAngle, MarkerAngle, itemAbstract, itemLocation, itemName, itemNumber, itemDevice, itemLayer, itemLat, itemLng, itemShowName } = this.state;
        const { addOrModify, addNewData } = this.props;
        let that = this;
        let result = Object.assign({}, addNewData);
        result.MarkerCode = itemNumber;
        result.MarkerName = itemName;
        result.MarkerDomain = itemLocation;
        result.MarkerDesc = itemAbstract;
        result.ModifyTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        result.ViewSheds = parseInt(ViewSheds);
        result.ViewAngle = parseInt(ViewAngle);
        result.MarkerAngle = parseInt(MarkerAngle);
        let resultData = { 'Markers': [result] };
        console.log('handleConfirm', result);
        if (addOrModify === 'add') {
            //调新增接口
            this.addData(resultData);
        } else if (addOrModify === 'modify') {
            //调修改接口
            modifyDeviceData(result, () => {
                this.props.modifyFeature(result);
            });
            this.setState({ visible: false });
            this.props.showVisible(false);
        }
    }



    //新增接口
    addData = (data) => {
        addDeviceData(data, () => {
            this.props.addNewFeature(data);
            this.setState({ visible: false });
        });
    }

    //取消
    handleCancel = () => {
        const { callBack, ponitInfo } = this.props;
        this.setState({ visible: false });
        this.props.showVisible(false);
        if (callBack) {
            callBack();
        }
    }
    //回调函数获取绘制组件的绘制结果
    getDrawInfo = (data) => {
        this.setState({
            ViewSheds: parseInt(data.ViewSheds),
            ViewAngle: parseInt(data.ViewAngle),
            MarkerAngle: parseInt(data.MarkerAngle)
        });
    }
    render() {
        const { itemAbstract, itemLocation, itemName, itemNumber, itemDevice, itemLayer, itemLat, itemLng, itemShowName } = this.state;
        const { ponitInfo, imageUrl, addNewData } = this.props;
        const { visible, loading } = this.state;

        return (
            <Modal
                className="visibleModal"
                visible={visible}
                title="摄像机配置"
                width="1000px"
                onOk={this.handleConfirm}
                onCancel={this.handleCancel}
                bodyStyle={{ width: '1000px', height: '540px', padding: '0', transformOrigin: '0' }}
                footer={false}
            >
                <div className="visibleContainer">
                    <Spin spinning={loading} size="large" style={{ position: 'absolute', top: '50%', left: '50%' }}></Spin>
                    <div style={{ display: 'flex' }}>
                        <ul>
                            {
                                itemTitles.map((item, index) => <li key={item + index}>{item}</li>)
                            }
                        </ul>
                        <ul>
                            <li>
                                <Input className="iptStyle" disabled value={itemNumber} onChange={(e) => this.setState({ itemNumber: e.target.value })} />
                            </li>
                            <li>
                                <Input className="iptStyle" disabled value={itemName} onChange={(e) => this.setState({ itemName: e.target.value })} />
                            </li>
                            <li>
                                <Input className="iptStyle" value={itemLocation} onChange={(e) => this.setState({ itemLocation: e.target.value })} />
                            </li>
                            <li>
                                <textarea name="message" rows="1" style={{ height: '26px', width: '380px' }} value={itemAbstract} onChange={(e) => this.setState({ itemAbstract: e.target.value })} ></textarea>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <DrawViewRange getDrawInfo={this.getDrawInfo} imageUrl={imageUrl} ponitInfo={ponitInfo} />
                    </div>
                    <div></div>
                </div>
                <div
                    className="modal-footer"
                >
                    <Button
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
                    <Button style={{
                        height: '30px',
                        width: '120px'
                    }} onClick={this.handleCancel}
                    >取消</Button>
                </div>
            </Modal>
        );
    }
}
export default AddBayonet;

