import React, { Component } from 'react';
import { Modal, Button, Input, Select, Spin } from 'antd';
import moment from 'moment';
import axios from 'axios';
import DrawViewRange from './DrawViewRange';
let itemTitles = ['监控点编号 :', '监控点名称 :', '所属区域 :', '纬度:', '描述 :', '图层类型 :', '设备类型 :', '名称显示 :'];
let layerType = ['视频专网', '公安自建', '社会资源'];
let deviceType = ['标清枪机', '标清球机', '高清枪机', '高清球机'];
let titleDir = ['右上', '正上', '右边', '右下', '正下'];
const Option = Select.Option;
class SetVisibleRange extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            visible: true,
            drawData: {},
            modifyData: {}
        };
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
            map.render();
        }).catch(() => { });
    }

    //确定修改
    handleConfirm = () => {
        const { callBack, ponitInfo } = this.props;
        let that = this;
        that.setState({ loading: true });
        //调用修改接口
        that.setMarkerInfo();
        setTimeout(() => {
            that.setState({ loading: false, visible: false }, () => {
                if (callBack) {
                    callBack();
                }
            });
        }, 3000);

    }
    //取消
    handleCancel = () => {
        const { callBack, ponitInfo } = this.props;
        this.setState({ visible: false });
        if (callBack) {
            callBack();
        }
    }
    //回调函数获取绘制组件的绘制结果
    getDrawInfo = (data) => {
        this.setState({ drawData: data });
    }
    render() {
        const { ponitInfo, imageUrl } = this.props;
        const { visible, loading } = this.state;
        let _info = {};
        if (ponitInfo) {
            _info = {
                id: ponitInfo.get('MarkCode'),
                name: ponitInfo.get('MarkName'),
                lon: ponitInfo.get('Lng'),
                lat: ponitInfo.get('Lat'),
                markerDesc: ponitInfo.get('MarkerDesc')
            };
        }
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
                                <Input className="iptStyle" defaultValue={_info.id} />
                            </li>
                            <li>
                                <Input className="iptStyle" defaultValue={_info.name} />
                            </li>
                            <li>
                                <Input className="iptStyle" />
                            </li>
                            <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Input style={{ width: '150px', height: '25px', boxSizing: 'border-box', fontSize: '12px', padding: '2px 4px' }} defaultValue={_info.lat} />
                                经度：
                                <Input style={{ width: '150px', height: '25px', boxSizing: 'border-box', fontSize: '12px', padding: '2px 4px' }} defaultValue={_info.lon} />
                            </li>
                            <li>
                                <textarea name="message" rows="1" style={{ height: '26px', width: '380px' }} defaultValue={_info.markerDesc}></textarea>
                            </li>
                            <li>
                                <Select style={{ width: '180px', height: '25px', boxSizing: 'border-box' }} >
                                    {layerType.map((item, index) => (<Option value={item} key={index + item}>{item} </Option>))}
                                </Select>
                            </li>
                            <li>
                                <Select style={{ width: '180px', height: '25px', boxSizing: 'border-box' }}  >
                                    {deviceType.map((item, index) => (<Option value={item} key={index + item}>{item} </Option>))}
                                </Select>
                            </li>
                            <li>
                                <Select style={{ width: '180px', height: '25px', boxSizing: 'border-box' }} >
                                    {titleDir.map((item, index) => (<Option value={item} key={index + item}>{item} </Option>))}
                                </Select>
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
                    <Button type="primary" className="confirmBtn" onClick={this.handleConfirm}>
                        确定
                    </Button>
                    <Button className="cancelBtn" onClick={this.handleCancel}>取消</Button>
                </div>
            </Modal>
        );
    }
}
export default SetVisibleRange;