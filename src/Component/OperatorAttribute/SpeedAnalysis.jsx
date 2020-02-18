import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Icon, Steps, Row, Col, InputNumber, Select } from 'antd';
import './SpeedAnalysis.less';

const { Step } = Steps;
const { Option } = Select;

/**
 * 速度分析
 */
export default class SpeedAnalysis extends Component {
    static propTypes = {


    }
    static defaultProps = {

    }
    constructor(props) {
        super(props);
        this.state = {

        };
        this.compareChar = '>=';//比较符
        this.speed = 60;  //速度
    }


    /**
     * 比较符号改变>=
     * @param {*} value 选择符号
     */
    _compareCharChange = (value) => {
        this.compareChar = value;
    }

    /**
     * 速度值改变的回调
     * @param {Number} value 速度值 
     */
    _speedChange = (value) => {
        this.speed = value;
    }

    /**
     * 获取描述的节点
     * @param {*} index 索引第一步0 第二步1
     */
    _getDescription = (index) => {
        if (index === 0) {
            return (<span style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
                将数据按照某一维度进行分组，并统计每个分组数量：
                <br />
                （车辆维度：车牌号码；车辆颜色
                <br />
                人的维度：证件号码）
            </span>)
        } else {
            return (
                <div className='SpeedAnalysis_main_step2' >
                    <span >
                        请设置速度筛选条件
                    </span>
                    <Row style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                        <Col span={4}>
                            速度：
                        </Col>
                        <Col span={6}>
                            <Select defaultValue='>=' onChange={this._compareCharChange}>
                                <Option value='<'>{`<`}</Option>
                                <Option value='<='>{`<=`}</Option>
                                <Option value='='>=</Option>
                                <Option value='>'>></Option>
                                <Option value='>='>>=</Option>
                            </Select>
                        </Col>
                        <Col span={6}>
                            <InputNumber min={0} max={290} defaultValue={60} style={{ width: '100%' }} onChange={this._speedChange} />
                        </Col>
                        <Col offset={1}>
                            km/h
                        </Col>
                    </Row>
                </div>
            )
        }
    }

    render() {
        return (
            <div className='SpeedAnalysis_main'>
                <div className='SpeedAnalysis_main_tips' >
                    <Icon type="exclamation-circle" style={{ marginLeft: '10px', marginRight: '10px' }} />
                    <span>主要分析数据源中同一个人或车相邻点位的速度！</span>
                </div>
                <Steps direction='vertical' size='small' >
                    <Step style={{ height: '128px' }} status='wait' description={this._getDescription(0)} />
                    <Step description={this._getDescription(1)} />
                </Steps>
            </div >
        )
    }
}

