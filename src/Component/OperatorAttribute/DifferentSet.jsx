import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Icon, Checkbox, Row, Col, Dropdown, Menu, Radio, InputNumber, Select, Tooltip } from 'antd';
import { PERSON, CAR, getOrderChar } from './Common'
import './DifferentSet.less';

const { Option } = Select;
/**
 * 差集
 */
export default class DifferentSet extends Component {
    static propTypes = {
        children: PropTypes.array,   //指向该算子的数据源
        commonField: PropTypes.array,  //公共字段，选中的字段
        output: PropTypes.string, //输出的数据源，应该就是type
        status: PropTypes.number    //是人:0还是车:1 暂时无用
    }
    static defaultProps = {
        children: [],
        status: 0  //人还是车
    }
    constructor(props) {
        super(props);
        this.state = {
            inputA: this.props.inputA, //输入数据源A的值
            inputB: this.props.inputB,  //输入数据源B的值
            output: this.props.output,   //输出数据源的值
            checkValue: this.props.commonField,  //勾选值
            place: this.props.place//地点选择 0是名称 1是地点差
        };
        this.placeCompare = this.props.placeDiff.compare;  //地点比较符 
        this.placeValue = this.props.placeDiff.value;  //地点值
        this.timeCompare = this.props.timeDiff.compare;  //时间比较符
        this.timeValue = this.props.timeDiff.value;//时间值
    }

    /**
     * 获取下拉浮窗
     * @param {Number} index 获取哪个的下拉输入框
     */
    _getOverLay = (index) => {
        const { children } = this.props;
        return (
            <Menu onClick={(item) => this._outputMenuClick(item, index)}>
                {children.map((item) => {
                    return (<Menu.Item key={item.id}>
                        {item.type}
                    </Menu.Item>)
                })}
            </Menu>
        )

    }


    /**
     * 输入下拉框的选择
     * @param {Number} index 索引
     */
    _inputMenuClick = (index) => {
        const { children } = this.props;
    }

    /**
     * 输出下拉菜单选中
     * @param {String} item 
     */
    _outputMenuClick = (item, index) => {
        switch (index) {
            case 0:
                this.setState({
                    inputA: this._findObjbyId(item.key),
                    inputB: this._findAnotherObjbyId(item.key),
                })
                break;
            case 1:
                this.setState({
                    inputB: this._findObjbyId(item.key),
                    inputA: this._findAnotherObjbyId(item.key),
                })
                break;
            default:
                this.setState({
                    output: {
                        id: item.key,
                        type: item.item.props.children
                    }
                })
                break;
        }
    }

    /**
     * 根据id返回对象
     * @param {string} id 
     */
    _findObjbyId = (id) => {
        const { children } = this.props;
        for (let i = 0; i < children.length; i++) {
            if (children[i].id.toString() === id) {
                return children[i];
            }
        }
    }

    /**
     * 根据id返回另一个对象，所以要求这边只能有2个
     * @param {string} id 
     */
    _findAnotherObjbyId = (id) => {
        const { children } = this.props;
        for (let i = 0; i < children.length; i++) {
            if (children[i].id.toString() != id) {
                return children[i];
            }
        }
    }

    /**
     * 勾选项变更
     * @param {Array} checkValue 勾选项
     */
    _checkChanged = (checkValue) => {
        //这边记录一下checkValue然后向上传
        this.setState({
            checkValue: checkValue
        })
    }


    /**
        * 时间比较符改变
        */
    _timeCompareCharChange = (value) => {
        this.timeCompare = value;
    }

    /**
     * 时间值改变
     */
    _timeValueChange = (value) => {
        this.timeValue = value;
    }

    /**
     * 地点比较符改变
     */
    _placeCompareCharChange = (value) => {
        this.placeCompare = value;
    }

    /**
     * 时间值改变
     */
    _placeValueChange = (value) => {
        this.placeValue = value;
    }

    /**
     * 单选框变化
     */
    _radioChange = (e) => {
        this.setState({
            place: e.target.value
        })
    }

    /**
     * 获取保存在本界面的属性，供父组件调用
     */
    getCondition = () => {
        let ret = {
            inputA: this.state.inputA,
            inputB: this.state.inputB,
            output: this.state.output,
            commonField: this.state.checkValue,
            place: this.state.place,
            placeDiff: {
                compare: this.placeCompare,
                value: this.placeValue
            },   //地点误差范围默认<=50，必须commonField中有olcae且place=0才有效
            timeDiff: {
                compare: this.timeCompare,
                value: this.timeValue
            }   //时间误差范围默认<=3，必须commonField中有time才有效
        }
        return ret;
    }


    render() {
        const { children, status, commonField } = this.props;
        const { output, inputA, inputB, checkValue, place } = this.state;
        return (
            <div className='DifferentSet_main'>
                <div className='DifferentSet_main_tips' >
                    <Icon type="exclamation-circle" style={{ marginLeft: '10px', marginRight: '10px' }} />
                    <span>差集的筛选方式默认为（A-B），请选择数据源A、数据源B！</span>
                </div>
                <table border={1} className='DifferentSet_main_table' >
                    <tbody>
                        {/* 只能被允许两个做差集，就直接写死 */}
                        <tr key='tr_0' >
                            <td className='DifferentSet_main_table_td1'>{`输入数据源${getOrderChar(0)}`} </td>
                            <td>
                                <Dropdown overlay={() => this._getOverLay(0)}>
                                    {<span style={{ cursor: 'pointer', color: inputA === '' ? '#bfbfbf' : '' }}>{inputA === '' ? '请选择' : inputA.type}</span>}
                                </Dropdown>
                            </td>
                        </tr>
                        <tr key='tr_1' >
                            <td className='DifferentSet_main_table_td1'>{`输入数据源${getOrderChar(1)}`} </td>
                            <td>
                                <Dropdown overlay={() => this._getOverLay(1)}>
                                    {<span style={{ cursor: 'pointer', color: inputB === '' ? '#bfbfbf' : '' }}>{inputB === '' ? '请选择' : inputB.type}</span>}
                                </Dropdown>
                            </td>
                        </tr>
                        < tr key={`tr_${children.length}`} >
                            <td className='DifferentSet_main_table_td1'>
                                <span>
                                    输出数据源
                                    <Tooltip title='暂时没想好哦 '>
                                        <Icon type="exclamation-circle" />
                                    </Tooltip >
                                </span>
                            </td>
                            <td  >
                                <Dropdown overlay={() => this._getOverLay()}>
                                    {<span style={{ cursor: 'pointer', color: output === '' ? '#bfbfbf' : '' }}>{output === '' ? '请选择' : output.type}</span>}
                                </Dropdown>
                            </td>
                        </tr>
                    </tbody>
                </table >
                <span>请从下面的选项选择差集的条件：</span>
                <Checkbox.Group style={{ width: '100%' }} onChange={this._checkChanged} defaultValue={commonField} >
                    <Row>
                        {(status === 0 ? PERSON : CAR).map((item) => {
                            return (<Col key={`col_${item}`} span={8}>
                                <Checkbox value={item} style={{ marginTop: '10px' }}>{item}</Checkbox>
                            </Col>)
                        })}
                    </Row>
                    <Row>
                        <Checkbox value='place' style={{ marginTop: '10px' }}>
                            地点
                           {checkValue.indexOf("place") > -1 &&
                                <Fragment>
                                    <span>
                                        (
                            <Radio.Group defaultValue={place} style={{ marginLeft: '10px' }} onChange={this._radioChange}>
                                            <Radio value={0}>名称</Radio>
                                            <Radio value={1}>误差</Radio>
                                        </Radio.Group>
                                        )
                                        </span>
                                    {this.state.place === 1 && <div>
                                        <Row style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                                            <Col span={4}>
                                                误差：
                                         </Col>
                                            <Col span={6}>
                                                <Select defaultValue={this.placeCompare} onChange={this._placeCompareCharChange}>
                                                    <Option value='<'>{`<`}</Option>
                                                    <Option value='<='>{`<=`}</Option>
                                                    <Option value='='>=</Option>
                                                    <Option value='>'>></Option>
                                                    <Option value='>='>>=</Option>
                                                </Select>
                                            </Col>
                                            <Col span={6}>
                                                <InputNumber min={0} max={290} defaultValue={this.placeValue} style={{ width: '100%' }} onChange={this._placeValueChange} />
                                            </Col>
                                            <Col offset={1}>
                                                米
                                        </Col>
                                        </Row>
                                    </div>}
                                </Fragment>
                            }
                        </Checkbox>
                    </Row>
                    <Row>
                        <Checkbox value='time' style={{ marginTop: '10px' }}>
                            时间
                           {checkValue.indexOf("time") > -1 && <div>
                                <Row style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                                    <Col span={4}>
                                        误差：
                                         </Col>
                                    <Col span={6}>
                                        <Select defaultValue={this.timeCompare} onChange={this._timeCompareCharChange}>
                                            <Option value='<'>{`<`}</Option>
                                            <Option value='<='>{`<=`}</Option>
                                            <Option value='='>=</Option>
                                            <Option value='>'>></Option>
                                            <Option value='>='>>=</Option>
                                        </Select>
                                    </Col>
                                    <Col span={6}>
                                        <InputNumber min={0} max={290} defaultValue={this.timeValue} style={{ width: '100%' }} onChange={this._timeValueChange} />
                                    </Col>
                                    <Col offset={1}>
                                        分
                                        </Col>
                                </Row>
                            </div>}
                        </Checkbox>
                    </Row>
                </Checkbox.Group>
            </div >
        )
    }
}

