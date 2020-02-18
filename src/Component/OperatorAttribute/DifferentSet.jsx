import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Icon, Checkbox, Row, Col, Dropdown, Menu } from 'antd';
import { PERSON, CAR, getOrderChar } from './Common'
import './DifferentSet.less';

/**
 * 差集
 */
export default class DifferentSet extends Component {
    static propTypes = {
        children: PropTypes.array,   //指向该算子的数据源
        commonField: PropTypes.array,  //公共字段，选中的字段
        status: PropTypes.number                      //是人:0还是车:1
    }
    static defaultProps = {
        children: [{ id: '000001', type: '抓拍数据源' }, { id: '000002', type: '过滤' }],
        status: 0  //人还是车
    }
    constructor(props) {
        super(props);
        this.state = {
            inputA: this.props.inputA, //输入数据源A的值
            inputB: this.props.inputB,  //输入数据源B的值
            output: this.props.output   //输出数据源的值
        };
        this.checkValue = this.props.commonField; //公共字段
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
                    output: item.item.props.children
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
        this.checkValue = checkValue;
    }

    /**
     * 获取保存在本界面的属性，供父组件调用
     */
    getCondition = () => {
        let ret = {
            inputA: this.state.inputA,
            inputB: this.state.inputB,
            output: this.state.output,
            commonField: this.checkValue
        }
        return ret;
    }


    render() {
        const { children, status, commonField } = this.props;
        const { output, inputA, inputB } = this.state;
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
                            <td className='DifferentSet_main_table_td1'>输出数据源</td>
                            <td  >
                                <Dropdown overlay={() => this._getOverLay()}>
                                    {<span style={{ cursor: 'pointer', color: output === '' ? '#bfbfbf' : '' }}>{output === '' ? '请选择' : output}</span>}
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
                </Checkbox.Group>
            </div >
        )
    }
}

