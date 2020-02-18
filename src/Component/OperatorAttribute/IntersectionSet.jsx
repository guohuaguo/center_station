import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Icon, Checkbox, Row, Col, Dropdown, Menu, Radio, InputNumber, Select, Tooltip } from 'antd';
import { PERSON, CAR, getOrderChar } from './Common'
import './IntersectionSet.less';

const { Option } = Select;

/**
 * 交集
 */
export default class IntersectionSet extends Component {
    static propTypes = {
        children: PropTypes.array,   //指向该算子的数据源
        commonField: PropTypes.array,  //公共字段，选中的字段
        output: PropTypes.string, //输出的数据源，应该就是type
        status: PropTypes.number,   //是人:0还是车:1 该属性暂时还未用上，等下改
    }
    static defaultProps = {
        children: [],
        status: 0
    }
    constructor(props) {
        super(props);
        this.state = {
            output: this.props.output, //输出数据源
            checkValue: this.props.commonField,  //勾选值
            place: this.props.place//地点选择 0是名称 1是地点差
        };
        this.placeCompare = this.props.placeDiff.compare;  //地点比较符 
        this.placeValue = this.props.placeDiff.value;  //地点值
        this.timeCompare = this.props.timeDiff.compare;  //时间比较符
        this.timeValue = this.props.timeDiff.value;//时间值
    }

    /**
     * 输出数据源下拉选择框变化事件
     * @param {String} value 变化的值
     */
    _selectOnChanged = (value) => {
        this.setState({
            output: value
        })
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
     * 获取下拉菜单
     */
    _getOverLay = () => {
        const { children } = this.props;
        return (
            <Menu onClick={this._menuClick}>
                {children.map((item) => {
                    return (<Menu.Item key={item.id}>
                        {item.type}
                    </Menu.Item>)
                })}
            </Menu>
        )
    }

    /**
     * 下拉菜单选中
     * @param {String} item 
     * @param {String} key 
     */
    _menuClick = (item) => {
        //这边以后可能还会稍微改下
        this._selectOnChanged(item.item.props.children);
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
        //不管怎么勾选 简单点 直接全部透传出去
        let ret = {
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
        const { children, commonField, status } = this.props;
        const { output, checkValue, place } = this.state;
        return (
            <div className='Intersection_main'>
                {output === '' && <div className='Intersection_main_tips' >
                    <Icon type="exclamation-circle" style={{ marginLeft: '10px', marginRight: '10px' }} />
                    <span>请选择输出的数据源！</span>
                </div>}
                <table border={1} className='Intersection_main_table' >
                    <tbody>
                        {children.map((item, index) => {
                            return (
                                <tr key={`tr_${index}`} >
                                    <td className='Intersection_main_table_td1'>{`输入数据源${getOrderChar(index)}`} </td>
                                    <td>{item.type}</td>
                                </tr>
                            )
                        })}
                        < tr key={`tr_${children.length}`} >
                            <td className='Intersection_main_table_td1'>
                                <span>
                                    输出数据源
                                    <Tooltip title='暂时没想好哦 '>
                                        <Icon type="exclamation-circle" />
                                    </Tooltip >
                                </span>
                            </td>
                            <td  >
                                <Dropdown overlay={() => this._getOverLay()}>
                                    {<span style={{ cursor: 'pointer', color: output === '' ? '#bfbfbf' : '' }}>{output === '' ? '请选择' : output}</span>}
                                </Dropdown>
                            </td>
                        </tr>
                    </tbody>
                </table >
                <span>请从下面的选项选择交集的条件：</span>
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

