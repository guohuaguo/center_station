import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Icon, Checkbox, Row, Col, Dropdown, Menu } from 'antd';
import { PERSON, CAR, getOrderChar } from './Common'
import './IntersectionSet.less';


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
            output: this.props.output //输出数据源
        };
        this.checkValue = this.props.commonField
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
        this.checkValue = checkValue;
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
     * 获取保存在本界面的属性，供父组件调用
     */
    getCondition = () => {
        let ret = {
            output: this.state.output,
            commonField: this.checkValue
        }
        return ret;
    }

    render() {
        const { children, commonField, status } = this.props;
        const { output } = this.state;
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
                            <td className='Intersection_main_table_td1'>输出数据源</td>
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
                </Checkbox.Group>
            </div >
        )
    }
}

