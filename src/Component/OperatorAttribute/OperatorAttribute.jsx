import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import SnapDataSource from './SnapDataSource';
import NormalDataSource from './NormalDataSource';
import IntersectionSet from './IntersectionSet';
import UnionSet from './UnionSet';
import DifferentSet from './DifferentSet';
import Calculus from './Calculus';
import ConditionFilter from './ConditionFilter';
import SpeedAnalysis from './SpeedAnalysis';
import FrequencyAnalysis from './FrequencyAnalysis';
import TimeCalculation from './TimeCalculation';
import DuplicateRemoval from './DuplicateRemoval';
import './OperatorAttribute.less';
import { connect } from 'react-redux';
import lodash from 'lodash';
import { setDataArray } from '../../Redux/actions';


/**
 * 算子属性主界面
 */
class OperatorAttribute extends Component {
    static propTypes = {
        dataArray: PropTypes.array,  //redux中取得
        id: PropTypes.number  //选中的那个对象的id
    }
    static defaultProps = {
        dataArray: []  //默认属性
    }
    constructor(props) {
        super(props);
        this.state = {
            type: ''  //类型 
        };
        this.condition = {};  //子元素需要的条件
        this.child = ''; //子元素的ref属性，统一可调用getCondition()方法获取子元素的值
    }

    componentDidMount() {
        this._initById(this.props.id)
    }

    componentWillReceiveProps(nextProps) {
        //专门监听属性变化
        if (nextProps.id !== this.props.id) {

        }
    }

    /**
     * 组件卸载
     */
    componentWillUnmount() {
        const { id } = this.props;
        if (this.child) {
            //这边处理成不同的属性传入到对应组件即可
            switch (this.state.type) {
                case '抓拍': {
                    let childData = this.child.getCondition(); //从子界面获取数据
                    this._modifyCondition(id, childData);
                    break;
                }
                case '交集': {
                    let childData = this.child.getCondition(); //从子界面获取数据
                    this._modifyCondition(id, childData);
                    break;
                }
                case '并集':
                    //不需要啥默认值，找出所有的孩子传进去即可
                    break;
                case '差集': {
                    let childData = this.child.getCondition(); //从子界面获取数据
                    this._modifyCondition(id, childData);
                    break;
                }
                case '积分': {
                    //遍历元素替换
                    let childData = this.child.getCondition(); //从子界面获取数据
                    //这里也没有dispatch到时候再改吧
                    const { dataArray } = this.props;
                    for (let i = 0; i < dataArray.length; i++) {
                        for (let j = 0; j < childData.length; j++) {
                            if (dataArray[i].id === childData[j].id) {
                                dataArray[i].weight = childData[j].weight;
                                break;
                            }
                        }
                    }
                    break;
                }
                case '条件过滤':
                    break;
                case '频次分析': {
                    let childData = this.child.getCondition(); //从子界面获取数据
                    this._modifyCondition(id, childData);
                    break;
                }
                case '速度计算': {
                    let childData = this.child.getCondition(); //从子界面获取数据
                    this._modifyCondition(id, childData);
                    break;
                }
                case '时差计算': {
                    let childData = this.child.getCondition(); //从子界面获取数据
                    this._modifyCondition(id, childData);
                    break;
                }
                case '数据去重': {
                    let childData = this.child.getCondition(); //从子界面获取数据
                    this._modifyCondition(id, childData);
                    break;
                }
                default:
                    break;
            }
        }
    }



    /**
     * 根据id查找treeArray中的项,只找第一个就行
     * @param {Number} id  
     */
    _findFirstItembyId = (id) => {
        const { dataArray } = this.props;
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i].id === id) {
                return dataArray[i];
            }
        }
    }

    /**
     * 根据id查找treeArray中的所有项
     * @param {Number} id  
     */
    _findAllItemById = (id) => {
        let retArray = [];
        const { dataArray } = this.props;
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i].id === id) {
                retArray.push(dataArray[i]);
            }
        }
        return retArray;
    }

    /**
     * 根据id查找到该id下的子元素
     * @param {*} id 
     */
    _findAllChildren = (id) => {
        let retArray = [];
        const { dataArray } = this.props;
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i].parentId === id) {
                retArray.push(dataArray[i]);
            }
        }
        return retArray;
    }

    /**
     * 根据id修改条件
     * @param {*} id 
     * @param {*} condition 
     */
    _modifyCondition = (id, condition) => {
        //引用类型这边直接绕过dispatch去更改可能会有问题
        const { dataArray, dispatch } = this.props;
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i].id === id) {
                dataArray[i].condition = condition;
            }
        }
    }



    /**
     * 根据id修改条件
     * @param {*} id 
     * @param {*} condition 
     */
    _modifyWeight = (id, condition) => {
        //引用类型这边直接绕过dispatch去更改可能会有问题
        const { dataArray } = this.props;
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i].id === id) {
                dataArray[i].weight = condition;
            }
        }
    }

    /**
     * 根据id初始化组件
     * @param {*} id 
     */
    _initById = (id) => {
        //找到第一个项
        let item = this._findFirstItembyId(id);
        if (!item) {
            return;
        }
        this.setState({
            type: item.type
        })
        //这边处理成不同的属性传入到对应组件即可
        switch (item.type) {
            case '抓拍':
                {
                    this.condition = item.condition;
                    break;
                }
            case '交集':
                {
                    let children = this._findAllChildren(id);
                    this.condition = item.condition;
                    this.condition.children = children;//增加children属性
                    break;
                }
            case '并集':
                {  //找到所有孩子传进去接口
                    this.condition = { children: this._findAllChildren(id) };
                    break;
                }
            case '差集':
                {
                    let children = this._findAllChildren(id);
                    this.condition = item.condition;
                    this.condition.children = children;//增加children属性
                    break;
                }
            case '积分':
                {
                    let children = this._findAllChildren(id);
                    this.condition.children = children;//增加children属性
                    break;
                }
            case '条件过滤':
                break;
            case '频次分析':
                {
                    this.condition = item.condition;
                    break;
                }
            case '速度计算':
                {
                    this.condition = item.condition;
                    break;
                }
            case '时差计算':
                {
                    this.condition = item.condition;
                    break;
                }
            case '数据去重': {
                this.condition = item.condition;
                break;
            }
            default:
                break;
        }
    }

    /**
     * 渲染主要区域 记得到时候加属性
     */
    _renderMainContent = () => {
        const { type } = this.state;
        switch (type) {
            case '抓拍':
                return (<SnapDataSource ref={(ref) => { this.child = ref }} {...this.condition} />)
            case '交集':
                return (<IntersectionSet ref={(ref) => { this.child = ref }} {...this.condition} />)
            case '并集':
                return (<UnionSet ref={(ref) => { this.child = ref }}  {...this.condition} />)
            case '差集':
                return (<DifferentSet ref={(ref) => { this.child = ref }}  {...this.condition} />)
            case '积分':
                return (<Calculus ref={(ref) => { this.child = ref }} {...this.condition} />)
            case '条件过滤':
                return (<ConditionFilter ref={(ref) => { this.child = ref }}  {...this.condition} />)
            case '频次分析':
                return (<FrequencyAnalysis ref={(ref) => { this.child = ref }}  {...this.condition} />)
            case '速度计算':
                return (<SpeedAnalysis ref={(ref) => { this.child = ref }}  {...this.condition} />)
            case '时差计算':
                return (<TimeCalculation ref={(ref) => { this.child = ref }}  {...this.condition} />)
            case '数据去重':
                return (<DuplicateRemoval ref={(ref) => { this.child = ref }}  {...this.condition} />)
            default:
                return (<NormalDataSource ref={(ref) => { this.child = ref }}  {...this.condition} />)
        }
    }

    render() {
        const { type } = this.state;
        return (< div className='OperatorAttribute_main'>
            <div className='OperatorAttribute_main_header'>算子属性</div>
            <div className='OperatorAttribute_main_typeName'>{type}</div>
            <div className='OperatorAttribute_main_content'>
                {this._renderMainContent()}
            </div>
        </div >)
    }
}

/**
 * 获取redux里面的state的方法
 * @param {*} state 
 */
function getState(state) {
    const { getDataArray } = state;
    return {
        dataArray: getDataArray
    }
}

export default connect(getState)(OperatorAttribute);