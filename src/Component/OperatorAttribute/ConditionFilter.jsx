import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Row, Col, DatePicker, Select, Button } from 'antd';
import './ConditionFilter.less';
import { Input } from 'element-react';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OPTIONS = [
    {
        label: '时间：',
        value: 'time',
    }, {
        label: '性别：',
        value: 'sex',
    }, {
        label: '国籍：',
        value: 'nationality',
    }, {
        label: '省份：',
        value: 'province',
    }, {
        label: '城市：',
        value: 'city',
    }, {
        label: '民族：',
        value: 'nation',
    }, {
        label: '证件号：',
        value: 'idcard',
    }, {
        label: '地点：',
        value: 'place',
    }
]
/**
 * 条件过滤
 */
export default class ConditionFilter extends Component {
    static propTypes = {
        children: PropTypes.array,   //指向该算子的数据源只能一个

    }
    static defaultProps = {
        children: [{ id: '00001', type: '抓拍数据源' }],
    }
    constructor(props) {
        super(props);
        this.state = {

        };
    }


    /**
     * 渲染右侧的输入框  （其实也应该是遍历出来的）
     * @param {*} key 
     */
    _renderRightItem = (key) => {
        switch (key) {
            case OPTIONS[0].value:
                return <RangePicker style={{ width: '100%' }} showTime={{ format: 'HH:mm:ss' }} />
            case OPTIONS[1].value:
                return <Select style={{ width: '100%' }} >
                    <Option value='male'>男</Option>
                    <Option value='formal'>女</Option>
                </Select>
            case OPTIONS[2].value:
                return <Select style={{ width: '100%' }} >
                    <Option value='male'>中国</Option>
                    <Option value='formal'>美国</Option>
                </Select>
            case OPTIONS[3].value:
                return <Select style={{ width: '100%' }} >
                    <Option value='male'>浙江省</Option>
                    <Option value='formal'>江苏省</Option>
                </Select>
            case OPTIONS[4].value:
                return <Select style={{ width: '100%' }} >
                    <Option value='male'>杭州</Option>
                    <Option value='formal'>南京</Option>
                </Select>
            case OPTIONS[5].value:
                return <Select style={{ width: '100%' }} >
                    <Option value='male'>汉族</Option>
                    <Option value='formal'>白族</Option>
                </Select>
            case OPTIONS[6].value:
                return <Input />
            case OPTIONS[7].value:
                return (<Row>
                    <Col span={12}>
                        <Button>树选择</Button>
                    </Col>
                    <Col span={12}>
                        <Button>地图选择</Button>
                    </Col>
                </Row>)
        }
    }

    //先写死了好多 后期应该是遍历出来的
    render() {
        const { children } = this.props;
        return (
            <div className='ConditionFilter_main'>
                <span>请从下面的选项中选择条件进行过滤：</span>
                <Checkbox.Group style={{ width: '100%', marginTop: '10px' }} >
                    {
                        OPTIONS.map((item) => {
                            return (<Row style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                                <Col span={7}>
                                    <Checkbox value={item.value}>{item.label}</Checkbox>
                                </Col>
                                <Col span={17}>
                                    {this._renderRightItem(item.value)}
                                </Col>
                            </Row>)
                        })
                    }
                </Checkbox.Group>
            </div >
        )
    }
}

