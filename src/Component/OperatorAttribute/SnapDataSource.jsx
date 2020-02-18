import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Button, Table, DatePicker } from 'antd';
import './SnapDataSource.less';

const { RangePicker } = DatePicker;

const columns = [
    {
        title: '摄像机名称',
        dataIndex: 'cameraName',
        key: 'cameraName'
    }
];

/**
 * 数据源-抓拍的属性  抓拍数据源数据量肯定不小 严格分页执行
 */
export default class SnapDataSource extends Component {
    static propTypes = {
        selectedNum: PropTypes.number,  //选中的数据量
        snapData: PropTypes.array     //单页十条抓拍数据
    }
    static defaultProps = {
        selectedNum: 100000,   //肯定非常巨大
        snapData: [{ cameraCode: 'a', cameraName: '白永杰抓拍相机' }, { cameraCode: 'b', cameraName: '二号相机' }]  //抓拍数据
    }
    constructor(props) {
        super(props);
        this.state = {
            currentPage: 1,  //当前页的页码
            startTime: '',   //开始时间
            endTime: ''      //结束时间
        };
    }

    /**
     * 切换页面的事件
     * @param {Number} page 页面
     * @param {Number} pageSize 每页的条数 这边应该固定都是10
     */
    _pageChange = (page, pageSize) => {
        console.log(page)
        //这里还需要做改变数据源的事情
        this.setState({
            currentPage: page
        });
    }

    /**
     * 点击选择器点击确认后的回调
     * @param {moment} dates 时间 
     */
    _rangePickerChange = (dates, dateStrings) => {
        console.log(dates);
        console.log(dateStrings);
        //时间变化了也要改变数据源

    }

    render() {
        const { snapData, selectedNum } = this.props;
        const { currentPage } = this.state;
        return (
            <div className='OperatorAttribute_SnapDataSource_main'>
                <span>
                    <span>
                        地点选择：
                </span>
                    <Button>树选择</Button>
                    <Button>地图选择</Button>
                </span>
                <div className='OperatorAttribute_SnapDataSource_main_table'>
                    <span>
                        摄像机列表：
                    </span>
                    <span style={{ float: 'right' }}>
                        {`已选${selectedNum}个`}
                    </span>
                    <Table rowKey={record => record.cameraCode} columns={columns} dataSource={snapData} bordered pagination={{
                        // size: "small",
                        simple: true,
                        total: selectedNum,  //总数
                        pageSize: 10, //默认每页就十条
                        current: currentPage,  //当前页
                        onChange: this._pageChange,
                        // showQuickJumper: true,
                        style: { textAlign: 'center', float: 'none' }
                    }} />
                </div>
                <span>查询时间：</span>
                <RangePicker showTime={{ format: 'HH:mm:ss' }} style={{ marginTop: '10px', width: '100%' }} onChange={this._rangePickerChange} />
            </div>
        )
    }
}