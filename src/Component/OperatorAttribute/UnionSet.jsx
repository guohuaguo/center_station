import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { getOrderChar } from './Common';
import './UnionSet.less';

/**
 * 交集
 */
export default class UnionSet extends Component {
    static propTypes = {
        children: PropTypes.array,   //指向该算子的数据源

    }
    static defaultProps = {
        children: []
    }
    constructor(props) {
        super(props);
        this.state = {

        };
    }


    render() {
        const { children } = this.props;
        return (
            <div className='Union_main'>
                <table border={1} className='Union_main_table' >
                    <tbody>
                        {children.map((item, index) => {
                            return (
                                <tr key={`tr_${index}`} >
                                    <td className='Union_main_table_td1'>{`输入数据源${getOrderChar(index)}`} </td>
                                    <td>{item.type}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table >
            </div >
        )
    }
}

