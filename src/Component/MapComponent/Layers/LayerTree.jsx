
import React, { Component } from 'react';
import { Popover, Tree } from 'antd';
import { getUserInfo, addVector } from '../utils';
import { getLayersInfo } from '../Business/ApiUtils';
const { TreeNode } = Tree;
/**
 * 图层筛选Tree组件
 * props {
 *  @param {Object} mapDom map组件ref
 *  @param {Array} onlyShow 限制展示的图层分类名称
 *  @param {Array} defaultCheckedKeys 默认选中复选框的树节点
 *  @param {Function} getLayers 图层创建后的回调
 *  @param {Function} getChoosedCode Tree筛选后回调
 *  @param {Function} getDomainInfo 用户信息读取后回调
 *  @param {String} className 图层气泡卡片样式class
 *  @param {Object} children 组件children
 * }
 */
export default class LayerTree extends Component {
    constructor(props) {
        super(props);
        this.state = {
            layerData: []  //图层筛选Tree数组
        };
        this.mapLayersAry = []; //map图层数据
    }
    componentDidMount = () => {
        const { getDomainInfo } = this.props;
        //获取用户编码
        getUserInfo((userInfo) => {
            if(getDomainInfo){
                getDomainInfo(userInfo);
            }
            //请求用户所能访问的图层
            getLayersInfo(userInfo.UserCode, this.getlayerData);
        });
    }
    /**
     * 获取用户有权限的图层，组装筛选Tree,并创建对应图层
     */
    getlayerData = (data) => {
        const { mapDom, onlyShow, getLayers } = this.props;
        if(!data || !(data.LayerInfos instanceof Array)){
            return;
        }
        //图层Tree组件的初始结构
        let layers = {
            0 : {
                title: '摄像机',
                key: '摄像机',
                children: []
            },
            1: {
                title: '卡口',
                key: '卡口',
                children: []
            },
            2: {
                title: '防区',
                key: '防区',
                children: []
            },
            3: {
                title: '全景',
                key: '全景',
                children: []
            },
            4: {
                title: '移动警务',
                key: '移动警务',
                children: []
            },
            5: {
                title: '',
                key: '',
                children: []
            },
            6: {
                title: '自定义',
                key: '自定义',
                children: []
            },
            7: {
                title: '其他',
                key: '其他',
                children: []
            }
        };
        //组装图层筛选Tree数组
        data.LayerInfos.forEach((item) => {
            if(layers[item.LayerType]){
                layers[item.LayerType].children.push({
                    title: item.LayerName,
                    key: item.LayerCode,
                    type: item.LayerType
                });
                if(onlyShow instanceof Array && onlyShow.includes(layers[item.LayerType].title) || !onlyShow){
                    //创建图层
                    this.mapLayersAry.push({
                        name: item.LayerName,
                        code: item.LayerCode,
                        type: item.LayerType,
                        layer: addVector(mapDom.getBaseMap())
                    });
                }
            }
        });
        //若指定了只展示的类，则只筛选出此类下所有有权限的图层
        //若没有特意指定展示的类，则展示所有有权限的图层
        let layersAry = Object.values(layers).filter((item) => {
            return onlyShow instanceof Array && onlyShow.includes(item.title) && item.children.length > 0  ||
            !(onlyShow instanceof Array) && item.children.length > 0;
        });
        this.setState({
            layerData: [{
                title: '全选',
                key: '全选',
                children: layersAry
            }]
        }, () => {
            //图层加载完毕后，将加载的图层返回
            if(getLayers){
                this.props.getLayers(this.mapLayersAry, data.LayerInfos);
            }
        });
    }
    /**
     * 图层Tree筛选组件点击复选框触发
     *  @param {Array} checkedKeys 选择的Tree组件key
     */
    onCheck = (checkedKeys) => {
        const { getChoosedCode } = this.props;
        //获取所有选中的图层
        let checkedLayers = checkedKeys.filter((item) => !/^[\u2E80-\u9FFF]+$/.test(item));
        //根据图层是否选中状态，去显示隐藏对应图层
        this.mapLayersAry.forEach((item) => {
            item.layer.setVisible(checkedLayers.includes(item.code + ''));
        });
        //选择之后，将选中的图层编码返回
        if(getChoosedCode){
            this.props.getChoosedCode(checkedLayers);
        }
    }
    /**
     * 加载图层筛选树组件
     */
    loadTree = () => {
        const { layerData } = this.state;
        const { defaultCheckedKeys } = this.props;
        return <Tree
            checkable
            defaultExpandAll
            defaultCheckedKeys={defaultCheckedKeys || []}
            onCheck={this.onCheck}
        >
            {this.renderTreeNodes(layerData)}
        </Tree>;
    }
    /**
     * 组装Tree树节点
     *  @param {Array} data Tree数据
     */
    renderTreeNodes = (data) => {
        return data.map((item) => {
            if (item.children) {
                return (
                    <TreeNode title={item.title} key={item.key} dataRef={item}>
                        {this.renderTreeNodes(item.children)}
                    </TreeNode>
                );
            }
            return <TreeNode key={item.key} {...item} />;
        });
    }
    render() {
        const { className } = this.props;
        return (
            <Popover overlayClassName={className || ''} content={this.loadTree()} trigger="click">
                {this.props.children}
            </Popover>
        );
    }
}