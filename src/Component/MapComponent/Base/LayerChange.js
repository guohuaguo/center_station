import React, { Component } from 'react';
import { Button, Tree } from 'antd';
import '../style/index.less';
//树选择
/* eslint-disable */
const TreeNode = Tree.TreeNode;
let layers; //所有图层
class LayerChange extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLayer: false,
            checkedKeys: ['0'],
            treeData:[]
        };
    }
    componentDidMount() {
        const {layerData} = this.props;
        const that = this;
        that.getTreeData(layerData);
    }
    // 图层数据变化后重新渲染
    componentWillReceiveProps(nextprops) {
        let that = this;
        const {layerData} = nextprops;
        that.getTreeData(layerData);

    }
    //改变图层的显隐
    changeLayer = () => {
        const { checkedKeys } = this.state;
        //全选判断
        if(checkedKeys.find((item)=>item==='0')){
            for (let key in layers) {
                layers[key].setVisible(true);
            }
        }else{
            for (let key in layers) {
                layers[key].setVisible(false);
            }
            checkedKeys.map((item, index) => {
                if (layers[item]) {
                    layers[item].setVisible(true);
                }
            });
        }
    };
    //组装树形数据
    getTreeData = (layerData)=>{
        let that = this;
        let _treeData = [];
        layers={};
        layerData.forEach((item, index)=>{
            _treeData.push({
                title:item.typeName,
                key:`0-${index}`,
                children:item.layerArr.map((subItem, subIndex)=>{layers[`0-${index}-${subIndex}`]=subItem.layer; return {title: subItem.title, key:`0-${index}-${subIndex}`}})
            })
        })
        let treeData = [
            {
                title: '全选',
                key: '0',
                children:_treeData
            }
        ]
        that.setState({treeData});
    }

  //选中的列表
  onCheck = (checkedKeys) => {
      this.setState({ checkedKeys });
  };

  renderTreeNodes = (data) => {
      return data.map((item) => {
          if (item.children) {
              return (
                  <TreeNode title={item.title} key={item.key} dataRef={item}>
                      {this.renderTreeNodes(item.children)}
                  </TreeNode>
              );
          }
          return <TreeNode {...item} />;
      });
  };

  //menu的显示开关
  layerSelect = () => {
      if (this.state.isLayer) {
          this.setState({
              isLayer: false
          });
      } else {
          this.setState({
              isLayer: true
          });
      }
  };
  render() {
      const {treeData} = this.state;
      return (
          <div className="layerChange">
              <div className="toolChildren layerCon" onClick={this.layerSelect}>
                  <span className="layerIcon" />
                    图层
              </div>
              {this.state.isLayer && (
                  <div className="layer-select">
                      <Tree
                          checkable
                          onCheck={this.onCheck}
                          checkedKeys={this.state.checkedKeys}
                          selectedKeys={this.state.checkedKeys}
                          defaultExpandAll
                      >
                          {this.renderTreeNodes(treeData)}
                      </Tree>
                      <div className="footer">
                          <Button className="btn btn-blue" onClick={this.changeLayer}>
                              确定
                          </Button>
                          <Button className="btn" onClick={this.layerSelect}>
                               取消
                          </Button>
                      </div>
                  </div>
              )}
          </div>
      );
  }
}
export default LayerChange;
