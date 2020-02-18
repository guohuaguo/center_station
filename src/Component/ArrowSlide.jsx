import React, { useState } from 'react';
import { Icon } from 'antd';

export default function ArrowSlide(props) {
    const [itemLable, setItemLable] = useState(false)
    const { itemName } = props

    function handleToggleCondition() {
        setItemLable(!itemLable)
    }
    return (
        <div >
            <a onClick={handleToggleCondition}
                style={{ display: 'block', fontSize: 15, color: 'black', fontWeight: 600, padding: 10, backgroundColor: '#f8f8f8' }}>
                {itemName}<Icon type={`${itemLable ? 'up' : 'down'}`} style={{ float: 'right', paddingRight: 20, paddingTop: 3, fontSize: 15 }}></Icon>
            </a>
            <div style={{ transition: 'all .1s', maxHeight: itemLable ? '1000px' : '0px', overflow: 'hidden', }}>{props.children}</div>
        </div>
    );
}