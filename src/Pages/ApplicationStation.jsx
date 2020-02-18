import React, { useState } from 'react';
import { NavLink, Route } from 'react-router-dom';
import { Menu, Icon, Button, Input } from 'antd';
import { StationPages } from './Config.js';
import './ApplicationStation.less';

const { Search } = Input;
const MyIcon = Icon.createFromIconfontCN({
    scriptUrl: '//at.alicdn.com/t/font_1610606_ic57134tarh.js', // 在 iconfont.cn 上生成
});
export default function ApplicationStation(props) {
    const [selectedKeys, setSelect] = useState(['我的模型'])
    function handleClick(e) {
        setSelect([e.key])
    }

    function modelCreate() {
        props.history.push('/model')
    }
    return (
        <div className='apstation'>
            <div className='apstation_left'>
                <h1 >应用中台</h1>
                <Menu
                    selectedKeys={selectedKeys}
                    onClick={handleClick}
                >
                    {
                        StationPages.map((item, index) => {
                            return <Menu.Item
                                key={item.title}
                            >
                                <Icon type='appstore' style={{ marginLeft: index === 2 || index === 3 ? 20 : 0 }}></Icon>
                                {item.title}
                                <NavLink to={item.route}>{item.title}</NavLink>
                            </Menu.Item>
                        })
                    }
                </Menu>
            </div>
            <div className='apstation_right'>
                <div className='apstation_right_header'>
                    <Button icon='plus' type='primary' style={{ marginLeft: 20 }} onClick={modelCreate}>新建</Button>
                    <Button icon='sync' style={{ marginLeft: 10 }}>刷新</Button>
                    <div className='right_float'>
                        <Search placeholder='请输入' style={{ width: 200 }}></Search>
                        <MyIcon type='icon-paixu' style={{ fontSize: 30, margin: 10, verticalAlign: '-0.3em' }}></MyIcon>
                        <Icon type='bars' style={{ fontSize: 30, verticalAlign: '-0.3em' }}></Icon>
                    </div>
                </div>
            </div>
        </div>
    )
}
