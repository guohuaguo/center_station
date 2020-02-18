import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

/**
 * 数据源-抓拍的属性  抓拍数据源数据量肯定不小 严格分页执行
 */
export default class SnapDataSource extends Component {
    static propTypes = {
        desc: PropTypes.string  //描述
    }
    static defaultProps = {
        desc: '2010年涉黄库'
    }
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    render() {
        const { desc } = this.props;
        return (
            <span>{`描述：${desc}`}</span>
        )
    }
}