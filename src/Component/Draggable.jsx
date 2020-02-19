import React, { useState, Fragment } from 'react';
import './Draggable.less';
import { Icon } from 'antd';

const MyIcon = Icon.createFromIconfontCN({
    scriptUrl: '//at.alicdn.com/t/font_1610606_snr33964drg.js', // 在 iconfont.cn 上生成
})
export default function Draggable(props) {
    const { id, type, info, x, y, condition, treeUpdate, deleteSource, style, onClick } = props
    const rule = new RegExp('small')
    

    /**
     * 设置拖动数据 setData()
     */
    function dragStart(ee) {
        ee.dataTransfer.setData('info', 'big'+info.replace('small',''))
        ee.dataTransfer.setData('type', type)
    }

    //切换选中状态
    const [active, setActive] = useState(false)
    function handleClick(e) {
        if(e.target.nodeName !== 'I'){
            setActive(!active)
        }
        if (onClick && typeof onClick === 'function') {
            onClick();
        }
    }

    //鼠标悬停删除节点
    const [shadow, setShadow] = useState(false)
    function deletePoint(){
        setShadow(true)
    } 

    /**
     * 鼠标点击圆点传输组件信息
     */
    function postPoint(e){
        let ev= e || window.event
        typeof (treeUpdate) === 'function' && treeUpdate({x:ev.clientX-350, y:ev.clientY-120, id: id})
    }

    /**
     * 鼠标跟随画箭头（待实现）
     */
    function draw(e){
        let svg = document.getElementById('mvsvg')
    }

    return (
        <div
            className={rule.test(info) ? 'drag_content' : 'draggabled'}
            draggable={rule.test(info) && true}
            onDragStart={dragStart}
            style={{ background: shadow &&  /big/.test(info) ? 'rgba(255, 153, 0, 0.0980392156862745)':'',
                border: active ? (/big/.test(info)? '1px solid rgba(255, 153, 0, 1)': 'black'):'',
                position: /big/.test(info) ? 'fixed':'',left:x,top:y
            }}
            onClick={handleClick}
            onMouseOver={deletePoint}
            onMouseOut={() => {setShadow(false)}}
        >
           <div style={{position:'relative', width:60,margin:'0 auto'}}>
           <MyIcon className='drag_icon' type='icon-circle'
                style={{
                    color: /source/.test(info) ? '#ff9900' : '#3399cc' 
                }}
            ></MyIcon>
           <div className='draggabled_circle' style={{display: shadow && /big/.test(info) ? 'block':'none'}}>
                    <i style={{left:25, top:0}} onClick={postPoint} onMouseDown={draw}></i>
                    <i style={{left:25,top:50}} onClick={postPoint} onMouseDown={draw}></i>
                    <i style={{left:0, top:25}} onClick={postPoint} onMouseDown={draw}></i>
                    <i style={{right:0, top:25}} onClick={postPoint} onMouseDown={draw}></i>
            </div>
           </div>
            <Icon type='close' className='drag_i'
                style={{ fontSize: 'xx-small', display: active &&  /big/.test(info) ? 'block' : 'none' }}
                onClick={() => { typeof (deleteSource) === 'function' && deleteSource(id) }}
            ></Icon>
            <p>{type}</p>
        </div>
    )
}
