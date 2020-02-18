import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { getOrderChar } from './Common';
import './Calculus.less';
import lodash from 'lodash';

/**
 * 交集
 */
export default class Calculus extends Component {
    static propTypes = {
        children: PropTypes.array,   //指向该算子的数据源

    }
    static defaultProps = {
        children: [],
    }
    constructor(props) {
        super(props);
        this.state = {

        };
        this.children = this.props.children;
    }

    /**
     * 组件卸载时去获取输入值
     */
    componentWillUnmount() {
        // const { children } = this.props;
        // let childs = lodash.cloneDeep(children);
        // for (let i = 0; i < childs.length; i++) {
        //     childs[i].pop = document.getElementById(`input_${i}`).value;
        // }
        // console.log(childs)
    }

    /**
     * 获取保存在本界面的属性，供父组件调用
     */
    getCondition = () => {
        const { children } = this.props;
        let ret = lodash.cloneDeep(children);
        for (let i = 0; i < ret.length; i++) {
            ret[i].weight = document.getElementById(`input_${i}`).value === '' ? undefined : Number(document.getElementById(`input_${i}`).value);
        }
        return ret;
    }

    render() {
        const { children } = this.props;
        return (
            <div className='Calculus_main'>
                <table border={1} className='Calculus_main_table' >
                    <tbody>
                        <tr key={`tr_first`} >
                            <td className='Calculus_main_table_td1'>模型名称</td>
                            <td className='Calculus_main_table_td1'>权重值</td>
                        </tr>
                        {children.map((item, index) => {
                            return (
                                <tr key={`tr_${index}`} >
                                    <td >{`${item.type}`} </td>
                                    <td className='Calculus_main_table_td2'>
                                        <input id={`input_${index}`} type='number' defaultValue={item.weight} placeholder="请输入数字" min={0}  >
                                        </input>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table >
            </div >
        )
    }
}

