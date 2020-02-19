import React from 'react';
import './ModelShow.less';
import {Button, Icon, Input} from 'antd';
import {ModelCard} from '../Component';

const {Search} = Input;
const MyIcon = Icon.createFromIconfontCN({
    scriptUrl: '//at.alicdn.com/t/font_1610606_snr33964drg.js', // 在 iconfont.cn 上生成
});
export default function ModelShow(props) {

    /**
     * 新建模型
     */
    function modelCreate(){
        props.history.push('/creation')
    }
    /**
     * 刷新
     */
    function refresh(){

    }

    /**
     * 输入框输入触发事件
     * @param {Object} e 
     */
    function searchChange(e){
        //当前输入的值
        console.log(e.target.value)
    }

    return (
        <div>
             <div className='modelshow'>
                <div className='modelshow_header'>
                <h1 >应用中台</h1>
                    <Button icon='plus' type='primary' style={{ marginLeft: 20 }} onClick={modelCreate}>新建</Button>
                    <Button icon='sync' style={{ marginLeft: 10 }} onClick={refresh}>刷新</Button>
                    <div className='modelshow_header_float'>
                        <Search placeholder='请输入' style={{ width: 200 }} onChange={searchChange}></Search>
                        <MyIcon type='icon-paixu' style={{ fontSize: 30, margin: 10, verticalAlign: '-0.3em' }}></MyIcon>
                        <Icon type='bars' style={{ fontSize: 30, verticalAlign: '-0.3em' }}></Icon>
                    </div>
                </div>
                <div className='modelshow_content'>
                    {/* 测试 */}
                    <ModelCard></ModelCard>
                    <ModelCard></ModelCard>
                    <ModelCard></ModelCard>
                    <ModelCard></ModelCard>
                    <ModelCard></ModelCard>
                    <ModelCard></ModelCard>
                    <ModelCard></ModelCard>
                    <ModelCard></ModelCard>
                    <ModelCard></ModelCard>
                </div>
            </div>
        </div>
    )
}
