import React, { useState, useRef } from 'react';
import { Button, Icon, Input, Modal } from 'antd';
import './ModelCard.less';
import moment from 'moment';

const format = 'YYYY-MM-DD HH:mm:ss';
const MyIcon = Icon.createFromIconfontCN({
    scriptUrl: '//at.alicdn.com/t/font_1610606_vum4lldd4f.js', // 在 iconfont.cn 上生成
})
const {confirm} = Modal
export default function ModelCard(props) {
    const { modelName, state, createperson, createtime } = props;

    const [opacity, setOpacity] = useState(0) //悬停出现按钮
    const [readOnly, setReadOnly] = useState(true)//输入框只读属性
    const [name, setName] = useState('在逃人员模型')//模型名称
    const [deleteShow, setDeleteShow] = useState(false)//删除按钮显示

    const inputRef = useRef(null)


    /**
     * 鼠标移出图片
     */
    function imgMouseOut(){
        setOpacity(0)
    }

    /**
     * 鼠标移入图片
     */
    function imgMouseOver(){
        setOpacity(1)
    }
    /**
     * 编辑按钮点击事件
     */
    function editClick() {
        inputRef.current.focus()
        setReadOnly(false)
    }

    /**
     * 
     * @param {Object} e 
     */
    function nameChange(e) {
        setName(e.target.value)
    }

    /**
     * 模型名称输入框失去焦点
     */
    function inputOnBlur(e) {
        if(e.target.value === ''){
            confirm({
                title:'名称不能为空，请输入正确名称',
                icon: <Icon type="exclamation-circle" />,
                cancelButtonProps:{
                    style:{ display:'none'}
                },
                onOk:() =>{
                    inputRef.current.focus()
                    
                }
            })
        }else{
            setReadOnly(true)
        }
       
    }

    /**
     * 查看预警
     */
    function warningLook(){

    }

    /**
     * 编辑模型
     */
    function modelEdit(){

    }

    /**
     * 模型删除
     */
    function modelDelete(){

    }



    return (
        <div className='modelcard'>
            <div className='modelcard_img' onMouseOver={imgMouseOver} onMouseOut={imgMouseOut} 
                onMouseLeave={() =>{setDeleteShow(false)}}>
                <img alt='暂无图片' src={'slideshow1.jpg'} ></img>
                <div className='modelcard_img_content'
                    style={{ opacity, background: opacity ? 'black' : '' }}>
                    <Icon type='ellipsis' className='modelcard_img_content_ellipsis'
                        onClick={() => { setDeleteShow(!deleteShow) }}
                    ></Icon>
                    <div className='modelcard_img_content_delete' style={{display: deleteShow? 'block' :'none'}}>
                        <Icon type='delete' onClick={modelDelete}></Icon>
                        <span>删除</span>
                    </div>

                    <div className='modelcard_img_content_button'>
                        <Button onClick={warningLook}>查看预警</Button>
                        <Button onClick={modelEdit}>编辑模型</Button>
                    </div>
                </div>
            </div>
            <div className='modelcard_content'>
                <div style={{ display: 'flex', justifyContent: 'space-between', lineHeight: '32px' }}>
                    <div className='modelcard_content_name'>
                        <MyIcon type='icon-moxing' style={{ fontSize: 22, verticalAlign: '-0.3em' }}></MyIcon>
                        <Input id='nameinput' ref={inputRef} value={name} readOnly={readOnly} onBlur={inputOnBlur} onChange={nameChange}></Input>
                        <Icon type='edit' onClick={editClick} ></Icon>
                    </div>
                    <span style={{ background: 'rgba(0, 153, 0, 1)', color: 'white' }}>正在分析</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', lineHeight: '32px' }}>
                    <div className='modelcard_content_person'>
                        <Icon type='user'></Icon>
                        <span>张山</span>
                    </div>
                    <span>{moment().format(format)}</span>
                </div>
            </div>
        </div>
    )
}
