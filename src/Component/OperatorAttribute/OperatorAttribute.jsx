import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import SnapDataSource from './SnapDataSource';
import './OperatorAttribute.less'

/**
 * 算子属性主界面
 */
export default class OperatorAttribute extends Component {
    static propTypes = {
        type: PropTypes.string,  //类型后期应该是number类型
    }
    static defaultProps = {
        type: '抓拍'  //默认属性
    }
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    /**
     * 渲染主要区域 
     */
    _renderMainContent = () => {
        const { type } = this.props;
        switch (type) {
            case '抓拍':
                return (<SnapDataSource />)
            default:
                return (<Fragment />)
        }
    }

    render() {
        const { type } = this.props;
        return (< div className='OperatorAttribute_main'>
            <div className='OperatorAttribute_main_header'>算子属性</div>
            <div className='OperatorAttribute_main_typeName'>{type}</div>
            <div className='OperatorAttribute_main_content'>
                {this._renderMainContent()}
            </div>
        </div >)
    }
}