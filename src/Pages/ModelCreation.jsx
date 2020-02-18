import React, { useState } from 'react';
import { PageHeader, Icon, Input, Collapse, Radio } from 'antd';
import './ModelCreation.less';
import $ from 'jquery';
import { AllowSlide, Draggable, Arrow } from '../Component';
import { SourceValue } from './Config.js';
import moment from 'moment';
import OperatorAttribute from '../Component/OperatorAttribute/OperatorAttribute';

const { Search } = Input;
const { Panel } = Collapse;
const MyIcon = Icon.createFromIconfontCN({
    scriptUrl: '//at.alicdn.com/t/font_1610606_hqgkmant07u.js', // 在 iconfont.cn 上生成
})

export default function ModelCreation(props) {


    //常亮
    const dataSource = ['温州市户籍信息', '高位人员', '涉逃人员', '前科劣迹', '旅馆入口人脸抓拍', '沿海地区卡口抓拍'];
    const atomicEng = ['交集', '并集', '补集', '差集'];  //原子引擎
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
     * 进行放置
     */
    const [treeArray, setTreeArray] = useState([])//树形结构数据存储
    const [time, setTime] = useState(moment())
    function drop(ee) {
        let tree = treeArray
        tree.push({
            id: moment().valueOf() + '',
            x: ee.clientX,
            y: ee.clientY,
            type: ee.dataTransfer.getData('type'),
            info: ee.dataTransfer.getData('info')
        })
        setTreeArray(tree)
        setTime(moment())

    }

    /**
     * 删除算子或数据源
     */
    function deleteSource(propsId) {
        let tree = treeArray
        tree.forEach((item,index) =>{
            if(item.id === propsId){
                tree.splice(index, 1)
            }
            if(item.parentId === propsId){
                delete item.arrowId
                delete item.arrow
                delete item.parentId
            }
        })
        setTreeArray(tree)
        setSvgRefresh(moment())
        console.log(tree)
    }


    const [points, setPoints] = useState([])//存点的id
    /**
     * 更新treeArray，添加parentId，arrow对应箭头坐标，arrowId箭头id（供箭头删除使用）
     */
    function treeUpdate(point) {
        if (points.length === 1) {
            let list = points.concat(point), tree = treeArray
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
            setTreeArray(tree)
        } else {
            setPoints([point])
        }
    }
    /**
     * 删除箭头同时更新treeArray
     * @param {String} id 箭头id
     */
    const [svgRefresh,setSvgRefresh] = useState(moment())//箭头删除刷新页面
    function deleteArrow(id) {
        let tree = treeArray
        tree.forEach(item => {
            if (item.arrowId === id) {
                delete item.arrowId
                delete item.arrow
                delete item.parentId
            }
        })
        setTreeArray(tree)
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

    return (
        <div className='mcreation'>
            <div className='mcreation_header'>
                <PageHeader
                    title='返回'
                    onBack={handelBack}>
                </PageHeader>
                <div className='model_name' style={{ margin: '0px auto' }}>
                    <Input id='modelname' type='text' onChange={editName} value={modelName} readOnly></Input>
                    <Icon type='edit' onClick={mouseFous}></Icon>
                </div>
                <div style={{ lineHeight: 0, marginRight: 10 }}>
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
                                                return <Draggable key={index} index={index} type={item} info='small' ></Draggable>
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
                    }} >
                        {
                            treeArray.map((item, index) => {
                                if (item.arrow) {
                                    return <Arrow key={index} arrow={item.arrow} arrowId={item.arrowId} deleteArrow={deleteArrow}></Arrow>
                                }
                            })
                        }
                    </svg>
                    {
                        treeArray.map((item, index) => {
                            return <Draggable key={index} id={item.id} type={item.type} x={item.x} y={item.y} info={item.info}
                                deleteSource={deleteSource} treeUpdate={treeUpdate}></Draggable>
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
        </div>
    )
}
