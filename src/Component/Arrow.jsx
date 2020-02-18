import React, { Fragment, useState } from 'react'

export default function Arrow(props) {
    const {arrow, arrowId, deleteArrow} = props
    const [show, setShow] = useState(false)
    return (
        <Fragment>
            <g id='myArrow'>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L3,3 z" fill="red" />
                </marker>
                <line x1={ arrow.x1} y1={ arrow.y1} x2={ arrow.x2} y2={ arrow.y2} stroke="red" strokeWidth="5"
                    markerEnd="url(#arrow)" onClick={() => { setShow(!show) }}
                    style={{ border: show ? '1px solid black' : '' }}
                />
                <g id='arrowClose' style={{ display: show ? 'block' : 'none', cursor:'pointer' }} onClick={() => { deleteArrow( arrowId) }}>
                    <circle cx={( arrow.x1 +  arrow.x2) / 2} cy={( arrow.y1 +  arrow.y2) / 2} r='10'
                        fill='red'></circle>
                    <text x={( arrow.x1 +  arrow.x2) / 2} y={( arrow.y1 +  arrow.y2) / 2}
                        fontSize='20' fill='white' textAnchor='middle' dy='5'>×</text>
                </g>
            </g>
        </Fragment>
    )
}
