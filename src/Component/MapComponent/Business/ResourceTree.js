import React, { Component } from 'react';
// import { Tree } from '../../UnvMap';
import { Tree } from 'antd';
//修改
import '../style/index.less';
class ResourceTree extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showTree: true
        };
    }
    //树组件的拖拽事件
    dragStart = (event, item) => {
        const { getOption } = this.props;
        let targetNode = JSON.parse(event.dataTransfer.getData('targetnode'));
        getOption(targetNode);
    }
    changeShowTree = (e) => {
        this.setState({
            showTree: e
        });
    }

    render() {
        const { showTree } = this.state;
        return (
            <div className="map-resource" style={{ borderLeftColor: '#808080a1', borderLeftStyle: 'solid', borderLeftWidth: '1px', backgroundColor: 'white', height: '100%', width: '270px' }}>
                <div className="map-table" >
                    <span onClick={() => this.changeShowTree(true)}>卡   口</span>
                    <span onClick={() => this.changeShowTree(false)}>摄像机</span>
                    {/* {showTree&&<div className="map-tree-check"></div>}  */}
                </div>
                {!showTree && <Tree
                    needRootNode
                    isNeedSearch
                    dataTypes={['1', '1001']}
                    onClick={this.baynoetchoose}
                    onDragStart={this.dragStart}
                />}
                {showTree && <Tree
                    needRootNode
                    isNeedSearch
                    dataTypes={['1', '2', '31']}
                    onClick={this.baynoetchoose}
                    onDragStart={this.dragStart}
                />}
            </div>
        );
    }
}
export default ResourceTree;
