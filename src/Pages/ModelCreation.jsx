import React, { useState } from 'react';
import { PageHeader, Icon, Input, Collapse, Radio } from 'antd';
import './ModelCreation.less';
import $ from 'jquery';
import { AllowSlide, Draggable, Arrow } from '../Component';
import { SourceValue } from './Config.js';
import moment from 'moment';
import OperatorAttribute from '../Component/OperatorAttribute/OperatorAttribute';
import { connect } from 'react-redux';
import lodash from 'lodash';
import { setDataArray } from '../Redux/actions';
import { PERSON, CAR, PERSON_GROUP, CAR_GROUP } from '../Component/OperatorAttribute/Common'
import ProcessTree from '../CommonComponent/ProcessTree';

const { Search } = Input;
const { Panel } = Collapse;
const MyIcon = Icon.createFromIconfontCN({
    scriptUrl: '//at.alicdn.com/t/font_1610606_hqgkmant07u.js', // 在 iconfont.cn 上生成
})

function ModelCreation(props) {


    //常亮
    const dataSource = ['抓拍', '温州市户籍信息', '高位人员', '涉逃人员', '前科劣迹', '旅馆入口人脸抓拍', '沿海地区卡口抓拍'];
    const atomicEng = ['交集', '并集', '差集', '积分', '条件过滤', '频次分析', '速度计算', '时差计算', '数据去重'];  //原子引擎
    const modelCom = ['密集预警', '涉稳失控预警', '遮挡预警']; //模型组件

    //state

    const [modelName, setModelName] = useState('未命名模型')  //模型名称
    const [showModal, setShowModal] = useState('none')        //
    const [source, setSource] = useState(SourceValue[0])
    const [activeId, setActiveId] = useState('') //激活选中的数据源或者算子 未选中为''

    /**
     * 返回事件
     */
    function handelBack() {
        props.history.push('/station')
    }
    function mouseFous() {
        $('#modelname').focus()
        document.getElementById('modelname').readOnly = false
    }
    function editName(e) {
        setModelName(e.target.value)
    }
    function sourceChange(e) {
        setSource(SourceValue[e.target.value])
    }


    //拖动后鼠标进入另一个可接受区域
    function dragEnter(ee) {
        if (ee.target.className.indexOf) {
            if (ee.target.className.indexOf('content') !== -1) {
                ee.target.className = 'dragging'
            }
        }

    }

    /**
     * a拖到b,离开b触发
     */
    function dragLeave(ee) {
    }

    /**
     * 放下节点时触发，允许放置
     */
    function dragOver(ee) {
        ee.preventDefault()
    }

    /**
     * 获取当前时间戳
     */
    function _getTimeStamp() {
        return new Date().getTime();
    }

    /**
     * 进行放置
     */
    // const [treeArray, setTreeArray] = useState([])//树形结构数据存储
    const [time, setTime] = useState(moment())
    function drop(ee) {
        const { dataArray, dispatch } = props;
        let tree = lodash.cloneDeep(dataArray);
        let id = _getTimeStamp();
        tree.push({
            id: id,
            x: ee.clientX,
            y: ee.clientY,
            type: ee.dataTransfer.getData('type'),
            info: ee.dataTransfer.getData('info'),
            condition: getDefaultCondition(ee.dataTransfer.getData('type'))  //不同算子或者数据源携带了不同的属性，统一存放于此
        })
        dispatch(setDataArray(tree))  //注入redux
        setActiveId(id); //放下直接激活
        setTime(moment())
    }

    /**
     * 根据不同的类型赋值默认的初始值
     * @param {*} type 
     */
    function getDefaultCondition(type) {
        let condition = {}; //默认就是一个空对象
        switch (type) {
            case '抓拍':
                condition = {
                    startTime: '', //开始时间
                    endTime: '',   //结束时间
                    selectCam: []   //选择的相机
                }
                break;
            case '交集':
                condition = {
                    output: '',   //输出成什么格式
                    commonField: [PERSON[0]],  //公共字段，这边没根据人或者车分，直接先写死人的试试
                    place: 0,  //0是按照名称 1是按照误差
                    placeDiff: {
                        compare: '<=',
                        value: '50'
                    },   //地点误差范围默认<=50，必须commonField中有olcae且place=0才有效
                    timeDiff: {
                        compare: '<=',
                        value: '3'
                    }   //时间误差范围默认<=3，必须commonField中有time才有效
                }
                break;
            case '并集':
                //不需要啥默认值
                break;
            case '差集':
                condition = {
                    inputA: '',   //数据源A
                    inputB: '', //数据源B
                    output: '', //输出数据源
                    commonField: [PERSON[0]],  //公共字段，这边没根据人或者车分，直接先写死人的试试
                    place: 0,  //0是按照名称 1是按照误差
                    placeDiff: {
                        compare: '<=',
                        value: '50'
                    },   //地点误差范围默认<=50，必须commonField中有olcae且place=0才有效
                    timeDiff: {
                        compare: '<=',
                        value: '3'
                    }   //时间误差范围默认<=3，必须commonField中有time才有效
                }
                break;
            case '积分':
                //积分默认写在孩子里面weight
                break;
            case '条件过滤':
                //条件过滤都是数据库遍历出来的不太好写
                break;
            case '频次分析':
                condition = {
                    groupField: [PERSON_GROUP[0]],  //分组字段，暂不区分人还是车
                    compareChar: '>=',
                    value: '0'
                }
                break;
            case '速度计算':
                condition = {
                    groupField: [PERSON_GROUP[0]],  //分组字段，暂不区分人还是车
                    compareChar: '>=',
                    value: '0'
                }
                break;
            case '时差计算':
                condition = {
                    groupField: [PERSON_GROUP[0]],  //分组字段，暂不区分人还是车
                    compareChar: '<=',
                    value: '3'
                }
                break;
            case '数据去重':
                condition = {
                    groupField: [PERSON_GROUP[0]]  //数据去重的字段，暂不区分人还是车
                }
                break;
            default:
                break;
        }
        return condition;
    }

    /**
     * 删除算子或数据源
     */
    function deleteSource(propsId) {
        const { dataArray, dispatch } = props;
        let tree = lodash.cloneDeep(dataArray);
        tree.forEach((item, index) => {
            if (item.id === propsId) {
                tree.splice(index, 1)
            }
            if (item.parentId === propsId) {
                delete item.arrowId
                delete item.arrow
                delete item.parentId
            }
        })
        dispatch(setDataArray(tree))  //注入redux
        setSvgRefresh(moment())
        console.log(tree)
    }


    const [points, setPoints] = useState([])//存点的id
    /**
     * 更新treeArray，添加parentId，arrow对应箭头坐标，arrowId箭头id（供箭头删除使用）
     */
    function treeUpdate(point) {
        if (points.length === 1) {
            let list = points.concat(point)
            const { dataArray, dispatch } = props;
            let tree = lodash.cloneDeep(dataArray);
            setPoints(list)
            tree.forEach(item => {
                if (item.id === list[0].id) {
                    let distanceX = list[1].x - list[0].x, distanceY = list[1].y - list[0].y, x2 = 0, y2 = 0;
                    if (distanceX >= 0) {
                        x2 = list[1].x - 10
                    } else {
                        x2 = list[1].x + 10
                    }
                    if (distanceY >= 0) {
                        y2 = list[1].y - 10
                    } else {
                        y2 = list[1].y + 10
                    }
                    if (item.parentId) {
                        tree.push({
                            ...item, parentId: list[1].id,
                            arrow: { x1: list[0].x, y1: list[0].y, x2, y2 },
                            arrowId: moment().valueOf()
                        })
                    } else {
                        item.parentId = list[1].id
                        item.arrow = { x1: list[0].x, y1: list[0].y, x2, y2 }
                        item.arrowId = moment().valueOf()
                    }
                }
            })
            dispatch(setDataArray(tree))  //注入redux
        } else {
            setPoints([point])
        }
    }
    /**
     * 删除箭头同时更新treeArray
     * @param {String} id 箭头id
     */
    const [svgRefresh, setSvgRefresh] = useState(moment())//箭头删除刷新页面
    function deleteArrow(id) {
        const { dataArray, dispatch } = props;
        let tree = lodash.cloneDeep(dataArray);
        tree.forEach(item => {
            if (item.arrowId === id) {
                delete item.arrowId
                delete item.arrow
                delete item.parentId
            }
        })
        dispatch(setDataArray(tree))  //注入redux
        setSvgRefresh(moment())
        console.log(tree)
    }

    /**
     * 鼠标跟随创建箭头标签（待实现）
     */
    function createTag(tagName, tagAttr) {
        let tag = document.createElementNS('http://www.w3.org/2000/svg', tagName);
        for (var attr in tagAttr) {
            tag.setAttribute(attr, tagAttr[attr]);
        }
        return tag;
    }

    /**
     * 每个算子或者数据源被点击时
     * @param {*} id 时间戳格式 
     */
    function clickItem(id = '') {
        setActiveId(id);
    }

    /**
     * 保存或者发布模型
     */
    function saveModel() {
        const { dataArray } = props;
        //处理逻辑不是很严谨，后期还需要再改(没有parentID，但是有人指向他 说明就是根节点)
        let treeArray = lodash.cloneDeep(dataArray);
        let noParent = []; //没有parentId属性的家伙
        for (let i = 0; i < treeArray.length; i++) {
            if (!treeArray[i].parentId) {
                noParent.push(treeArray[i]);
            }
        }
        let rootId = '';
        for (let i = noParent.length - 1; i > -1; i--) {
            treeArray.map((item) => {
                if (item.parentId === noParent[i].id) {
                    rootId = noParent[i].id;
                }
            })
        }
        if (rootId === '') {
            return;
        }
        treeArray.map((item) => {
            if (item.id === rootId) {
                item.parentId = 'root';
            }
        })
        ProcessTree.saveModel(modelName, treeArray);
    }

    return (
        < div className='mcreation' >
            <div className='mcreation_header'>
                <PageHeader
                    title='返回'
                    onBack={handelBack}>
                </PageHeader>
                <div className='model_name' style={{ margin: '0px auto' }}>
                    <Input id='modelname' type='text' onChange={editName} value={modelName} readOnly></Input>
                    <Icon type='edit' onClick={mouseFous}></Icon>
                </div>
                <div style={{ lineHeight: 0, marginRight: 10 }} onClick={saveModel}>
                    <Icon type='save' style={{ fontSize: 30, margin: '10px 0px' }}></Icon>
                    <p >保存</p>
                </div>
            </div>
            <div style={{ display: 'flex' }}>
                <div className='mcreation_left'>
                    <AllowSlide
                        itemName='数据源'
                    >
                        <div
                            style={{ margin: 10 }}
                        >
                            <Search
                                placeholder='请输入'
                            ></Search>
                            <Collapse
                                bordered={false}
                                expandIcon={({ isActive }) => <Icon type="caret-right" rotate={isActive ? 90 : 0} />}
                            >
                                <Panel
                                    header='人员数据源'
                                    key='1'
                                >
                                    <div className='general_style'>
                                        {
                                            dataSource.map((item, index) => {
                                                return <Draggable key={index} index={index} type={item} info='small_source' ></Draggable>
                                            })
                                        }
                                        <MyIcon type='icon-add' style={{ fontSize: 60 }} onClick={() => { setShowModal('block') }}></MyIcon>
                                    </div>
                                </Panel>
                                <Panel
                                    header='车辆'
                                    key='2'
                                ></Panel>
                            </Collapse>
                        </div>
                    </AllowSlide>
                    <AllowSlide
                        itemName='原子引擎'
                    >
                        <div
                            style={{ margin: 10 }}
                        >
                            <div className='general_style'>
                                {
                                    atomicEng.map((item, index) => {
                                        return <Draggable key={index} index={index} type={item} info='small' ></Draggable>
                                    })
                                }
                            </div>
                        </div>
                    </AllowSlide>
                    <AllowSlide
                        itemName='模型组件'
                    >
                        <div
                            style={{ margin: 10 }}
                        >
                            <Search
                                placeholder='请输入'
                            ></Search>
                            <Collapse
                                bordered={false}
                                expandIcon={({ isActive }) => <Icon type="caret-right" rotate={isActive ? 90 : 0} />}
                            >
                                <Panel
                                    header='人员'
                                    key='1'
                                >
                                    <div className='general_style'>
                                        {
                                            modelCom.map((item, index) => {
                                                return <Draggable key={item.id} index={index} type={item} info='small' ></Draggable>
                                            })
                                        }
                                    </div>
                                </Panel>
                                <Panel
                                    header='车辆'
                                    key='2'
                                ></Panel>
                            </Collapse>
                        </div>
                    </AllowSlide>
                </div>
                <div className='mcreation_right'
                    onDragEnter={dragEnter}
                    onDragLeave={dragLeave}
                    onDragOver={dragOver}
                    onDrop={drop}
                    key={time}
                >
                    <svg id='mySvg' key={svgRefresh} style={{
                        width: 'calc(100vw - 350px)', height: ' calc(100vh - 150px)'

                    }}
                        onClick={() => { clickItem() }}
                    >
                        {
                            props.dataArray.map((item, index) => {
                                if (item.arrow) {
                                    return <Arrow key={index} arrow={item.arrow} arrowId={item.arrowId} deleteArrow={deleteArrow}></Arrow>
                                }
                            })
                        }
                    </svg>
                    {activeId !== '' && <OperatorAttribute key={activeId} id={activeId} />}
                    {
                        props.dataArray.map((item, index) => {
                            return <Draggable key={index} id={item.id} type={item.type} x={item.x} y={item.y} info={item.info}
                                deleteSource={deleteSource} treeUpdate={treeUpdate}
                                onClick={() => { clickItem(item.id) }}
                            ></Draggable>
                        })
                    }
                </div>

            </div>
            <div className='source_add' style={{ display: showModal }}>
                <div className='header'>
                    <span>添加数据源</span>
                    <i onClick={() => setShowModal('none')}>+</i>
                </div>
                <div className='source_add_content'>
                    <div style={{ display: 'flex' }}>
                        <span style={{ margin: 'auto 0px' }}>数据源名称：</span>
                        <Input placeholder='请输入' style={{ width: 240 }}></Input>
                    </div>
                    <div style={{ display: 'flex', margin: '10px 0px' }}>
                        <span>来源：</span>
                        <Radio.Group onChange={sourceChange} defaultValue={0} style={{ marginLeft: 40 }}>
                            <Radio value={0}>摄像机</Radio>
                            <Radio value={1}>名单库</Radio>
                        </Radio.Group>
                    </div>
                    <div style={{ display: 'flex' }}>
                        <span>{`请选择${source.name === 'camera' ? '摄像机' : '名单库'}：`}</span>
                    </div>
                </div>
                <div className='footer'></div>
            </div>
        </div >
    )
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

export default connect(getState)(ModelCreation);