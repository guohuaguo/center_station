import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Icon, Steps, Row, Col, InputNumber, Select, Checkbox } from 'antd';
import { PERSON_GROUP, CAR_GROUP } from './Common';
import './FrequencyAnalysis.less';

const { Step } = Steps;
const { Option } = Select;

/**
 * 频次分析
 */
export default class FrequencyAnalysis extends Component {
    static propTypes = {
        status: PropTypes.number,    //是人:0还是车:1 暂时无用
        groupField: PropTypes.array //默认勾选的字段
    }
    static defaultProps = {
        status: 0,
        groupField: []
    }
    constructor(props) {
        super(props);
        this.state = {
            checkValue: this.props.groupField,  //勾选值
        };
        this.compareChar = this.props.compareChar;//比较符
        this.count = this.props.value;  //频次
        this.option = [];  //checkgroup 
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
     * 比较符号改变>=
     * @param {*} value 选择符号
     */
    _compareCharChange = (value) => {
        this.compareChar = value;
    }

    /**
     * 频数改变的回调
     * @param {Number} value 速度值 
     */
    _countChange = (value) => {
        this.count = value;
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
            compareChar: this.compareChar,
            value: this.count
        }
        return ret;
    }

    /**
     * 获取描述的节点
     * @param {*} index 索引第一步0 第二步1
     */
    _getDescription = (index) => {
        const { groupField } = this.props;
        if (index === 0) {
            return (
                <Fragment>
                    <span style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
                        请选择数据分组条件，并统计每个分组数量：
                     </span>
                    <div>
                        <Checkbox.Group
                            options={this.option}
                            defaultValue={groupField}
                            onChange={this._checkChanged}
                        />
                    </div>
                </Fragment>)
        } else {
            return (
                <div className='FrequencyAnalysis_main_step2' >
                    <span >
                        请设置频次筛选条件
                    </span>
                    <Row style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                        <Col span={4}>
                            次数：
                        </Col>
                        <Col span={6}>
                            <Select defaultValue={this.compareChar} onChange={this._compareCharChange}>
                                <Option value='<'>{`<`}</Option>
                                <Option value='<='>{`<=`}</Option>
                                <Option value='='>=</Option>
                                <Option value='>'>></Option>
                                <Option value='>='>>=</Option>
                            </Select>
                        </Col>
                        <Col span={6}>
                            <InputNumber min={0} defaultValue={this.count} style={{ width: '100%' }} onChange={this._countChange} />
                        </Col>
                    </Row>
                </div>
            )
        }
    }

    render() {
        return (
            <div className='FrequencyAnalysis_main'>
                <div className='FrequencyAnalysis_main_tips' >
                    <Icon type="exclamation-circle" style={{ marginLeft: '10px', marginRight: '10px' }} />
                    <span>主要分析数据源中同一个人或车的次数！</span>
                </div>
                <Steps direction='vertical' size='small' >
                    <Step style={{ height: '128px' }} status='wait' description={this._getDescription(0)} />
                    <Step description={this._getDescription(1)} />
                </Steps>
            </div >
        )
    }
}

