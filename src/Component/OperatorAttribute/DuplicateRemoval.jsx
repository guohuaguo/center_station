import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Icon, Steps, Row, Col, InputNumber, Select, Checkbox } from 'antd';
import { PERSON_GROUP, CAR_GROUP } from './Common';
import './DuplicateRemoval.less';

const { Step } = Steps;
const { Option } = Select;

/**
 * 数据去重
 */
export default class DuplicateRemoval extends Component {
    static propTypes = {
        status: PropTypes.number,    //是人:0还是车:1 暂时无用
        groupField: PropTypes.array //默认勾选的字段
    }
    static defaultProps = {
        status: 0,
    }
    constructor(props) {
        super(props);
        this.state = {
            checkValue: this.props.groupField,  //勾选值
        };
    }

    componentWillMount() {
        let option = [];
        (this.props.status === 0 ? PERSON_GROUP : CAR_GROUP).forEach((item) => {
            option.push({
                label: item,
                value: item
            })
        })
        this.option = option;
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
     * 获取保存在本界面的属性，供父组件调用
     */
    getCondition = () => {
        //不管怎么勾选 简单点 直接全部透传出去
        let ret = {
            groupField: this.state.checkValue,
        }
        return ret;
    }


    render() {
        const { groupField } = this.props;
        return (
            <div className='TimeCalculation_main'>
                <div className='TimeCalculation_main_tips' >
                    <Icon type="exclamation-circle" style={{ marginLeft: '10px', marginRight: '10px' }} />
                    <span>通过选择的条件来筛减重复的数据！</span>
                </div>
                <div style={{ marginBottom: '10px' }}>请选择数据去重的条件：</div>
                <Checkbox.Group
                    options={this.option}
                    defaultValue={groupField}
                    onChange={this._checkChanged}
                />
            </div >
        )
    }
}

