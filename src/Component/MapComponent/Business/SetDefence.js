import React, { Component } from 'react';
import { Modal, Button, Input, Select, Spin, Checkbox, notification } from 'antd';
import { ColorPicker } from 'element-react';
import moment from 'moment';
import 'element-theme-default';
const Option = Select.Option;
const lineSize = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
class SetDefence extends Component{
    constructor(props){
        super(props);
        this.state = {
            visible:true,
            loading:false,
            isFill:true,
            'Code': moment().format('YYYYMMDDHHmmss'),
            'Name': '',
            'BorderColor': '#EF585D',
            'FontColor': '#000000',
            'FillColor': '#EF585D',
            'BoundaryWidth': 2,
            'Layer': 10001,
            'IsDottedLine':1,
            'Opacity':50
        };
    }
    componentWillMount(){
        let that = this;
        const { upData, setType } = that.props;
        //防区修改，参数组装
        if(setType === 'edit'){
            that.setState({
                'Code': upData.Code,
                'Name': upData.Name,
                'BorderColor': upData.BorderColor,
                'FontColor': upData.FontColor,
                'BoundaryWidth': upData.BoundaryWidth,
                'Layer': upData.Layer,
                'IsDottedLine':upData.IsDottedLine,
                'FillColor': '#' + parseInt(upData.FillColor.split(',')[0].slice(5)).toString(16) + parseInt(upData.FillColor.split(',')[1]).toString(16) + parseInt(upData.FillColor.split(',')[2]).toString(16),  //'rgba(1,2,3,4)'=>rgba(1, 2 , 3 , 4
                'Opacity': parseInt(parseFloat(upData.FillColor.split(',')[3]) * 100)
            });
        }

    }
     //确定修改
     handleConfirm = () => {
         const that = this;
         const { getSetInfo, setType } = this.props;
         const { Name, Layer, BorderColor, FillColor, Opacity, FontColor, IsDottedLine, BoundaryWidth, Code, isFill } = this.state;
         let _FillColor = '#ffffffff';

         if(Name === ''){
             notification.config({
                 placement: 'bottomRight'
             });
             notification['info']({
                 message: '提示',
                 description: '防区名称不能为空',
                 duration: 2
             });

             return null;
         }
         if(FillColor){
             let _opacity = (parseInt(Opacity * 255 / 100)).toString(16);  //透明度转16进制
             _FillColor = '#' + _opacity + FillColor.split('#').join('');  //转argb格式
         }
         let options = {
             'Code': setType === 'edit' ? Code : moment().format('YYYYMMDDHHmmss'),
             'Name': Name,
             'BorderColor': BorderColor,
             'FontColor': FontColor,
             'BoundaryWidth': BoundaryWidth,
             'Layer': Layer,
             'IsDottedLine':IsDottedLine,
             'FillColor': isFill ? _FillColor : ''
         };
         //调用修改接口
         that.setState({ visible: false }, () => {
             if(getSetInfo){
                 getSetInfo(options);
             }
         });
     }
    //取消
    handleCancel = () => {
        const { callBack } = this.props;
        this.setState({ visible: false });
        if(callBack){
            callBack();
        }
    }

    // 用户输入参数处理
    handleInpt=(value, prop) => {
        this.setState({ [prop]:value });
    }
    render(){
        const { visible, Name, Layer, BorderColor, FillColor, Opacity, FontColor, IsDottedLine, BoundaryWidth, isFill } = this.state;
        return(
            <Modal
                className="defenceModal"
                visible={visible}
                title="增加防区"
                width="500px"
                onOk={this.handleConfirm}
                onCancel={this.handleCancel}
                bodyStyle={{ width: '500px', height:'335px', padding: '0', transformOrigin: '0' }}
                footer={null}
            >
                <div className="defenceContainer">
                    <div className="defenceName">
                        <div style={{ marginBottom:'10px' }}>
                            <span>防区名称：</span>
                            <Input value={Name} onChange={(e) => this.handleInpt(e.target.value, 'Name')}/>
                        </div>
                        <div>
                            <span>所属图层：</span>
                            <Select value={Layer} onChange={(e) => this.handleInpt(e, 'Layer')}>
                                <Option value={10001} key="defence" >防区</Option>
                            </Select>
                        </div>
                    </div>
                    <div className="defenceStyle">
                        <div style={{ marginBottom:'10px' }}><span style={{ fontSize:'14px', fontWeight:'bold', color:'#333' }}>防区样式</span><span style={{ width:'380px', height:'0px', border:'1px solid #eee', display:'inline-block', marginLeft:'5px' }}></span></div>
                        <div className="itemStyle">
                            <div className="leftStyle">
                                <div className="borderColor">
                                    <span>边界颜色 ：</span>
                                    <ColorPicker  value={BorderColor}  style={{ width:'40px' }} onChange={(e) => this.handleInpt(e, 'BorderColor')}/>
                                </div>
                                <div className="defenceColor">
                                    <span style={{ lineHeight: '25px' }}>防区颜色 ：</span>
                                    <ul>
                                        <li style={{ marginTop:0 }}>
                                        是否填充 ： <Checkbox checked={isFill} onChange={(e) => this.handleInpt(e.target.checked, 'isFill')}/>
                                        </li>
                                        <li className="fillColor">
                                        填充颜色 ：<ColorPicker  value={FillColor}  style={{ width:'40px' }} onChange={(e) => this.handleInpt(e, 'FillColor')}  />
                                        </li>
                                        <li>
                                        透明度(%)：<input  style={{ width:'40px', paddingLeft:'5px', height:'25px' }} type="number"  min="0" max="100"  value={String(Opacity)}  onChange={(e) => this.handleInpt(e.target.value, 'Opacity')} disabled={isFill ? '' : 'disabled'} />
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <ul className="rightStyle">
                                <li style={{ marginTop: '0' }}>
                                名称颜色：<ColorPicker  value={FontColor}  style={{ width:'40px' }} onChange={(e) => this.handleInpt(e, 'FontColor')}  />
                                </li>
                                <li>
                                边界样式：
                                    <Select value={IsDottedLine}  onChange={(e) => this.handleInpt(e, 'IsDottedLine')}>
                                        <Option value={1} key="1">实线</Option>
                                        <Option value={0} key="0">虚线</Option>
                                    </Select>
                                </li>
                                <li>
                                边界粗细：
                                    <Select value={BoundaryWidth}  onChange={(e) => this.handleInpt(e, 'BoundaryWidth')}>
                                        {
                                            lineSize.map((item, index) => <Option value={item} key={item + index}>{item}</Option>)
                                        }
                                    </Select>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <Button className="confirmBtn" onClick={this.handleConfirm}  type="primary">
                确定
                    </Button>
                    <Button  className="cancelBtn" onClick={this.handleCancel}>取消</Button>
                </div>
            </Modal>
        );
    }
}
export default SetDefence;