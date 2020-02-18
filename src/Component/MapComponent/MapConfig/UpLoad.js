/**
 * 插件配置上传界面
 */
import React, { Component } from 'react';
import { Input, Button, Select, Message, InputNumber } from 'antd';
import UpLoadFile from './UpLoadFile';
import axios from 'axios';
const Option = Select.Option;
class UpLoad extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data:{},
            mode:'',
            viewLng:'',
            viewLat:'',
            viewZoom:'',
            viewForce:'0',
            plugin:'',
            pluginOption:[]
        };
    }
    componentWillMount() {
    //查询插件选项列表调接口
        axios({
            method:'get',
            url:'/api/mapCfg?isList=true'
        }).then((res) => {
        //取到查询插件选项列表信息
            this.setState({ pluginOption:res.data.List });
        }).catch((err) => {});
        //查询配置信息调接口
        axios({
            method:'get',
            url:'/api/mapCfg'
        }).then((res) => {
            const data = res.data;
            //取到配置列表信息
            this.setState({
                mode:data.Mode,
                viewLng:data.ViewLng,
                viewLat:data.ViewLat,
                viewZoom:data.ViewZoom,
                viewForce:data.ViewForce === true ? '1' : '0',
                plugin:data.Plugin
            });
        }).catch((err) => {});

    }
  //调接口修改配置项
  modificate = () => {
      const { mode, viewLng, viewLat, viewZoom, viewForce, plugin } = this.state;
      //取到修改后的配置项
      const result = {
          'Mode': mode,
          'ViewLng': viewLng,
          'ViewLat': viewLat,
          'ViewZoom': viewZoom,
          'ViewForce': viewForce === '1' ? true : false,
          'Plugin': plugin
      };
      axios({
          method: 'put',
          data: JSON.stringify(result),
          url: '/api/mapCfg'
      }).then((res) => {
          if(Object.is(res.data.ErrCode, 0)){
              Message.success('修改成功');
          }
      }).catch((err) => {
          Message.error('修改失败');
      });
  }
  render() {
      const { viewLng, viewLat, viewZoom, viewForce, plugin, pluginOption } = this.state;
      console.log('pluginOption', typeof(pluginOption));
      return (
          <div className="upLoad">
              <div className="upLoad-title">地图管理</div>
              <div className="upLoad-titleLine"></div>
              <div className="upLoad-nameLine"></div>
              <div className="upLoad-name">修改配置</div>
              <div className="upLoad-content">
                  <div>
                      <span className="upLoad-mapName">经度：</span>
                      <InputNumber min={-180} max={180} style={{ width: 160 }} value={viewLng} onChange={(e) => this.setState({ viewLng:e })} />
                  </div>
                  <div>
                      <span className="upLoad-mapName">纬度：</span>
                      <InputNumber min={-85} max={85} style={{ width: 160 }} value={viewLat} onChange={(e) => this.setState({ viewLat:e })} />
                  </div>
                  <div>
                      <span className="upLoad-mapName">级别：</span>
                      <InputNumber min={1} max={30} style={{ width: 160 }} value={viewZoom} onChange={(e) => this.setState({ viewZoom:e })} />
                  </div>
                  <div><span className="upLoad-selectName">地图插件：</span>
                      <Select value={plugin} style={{ width:160 }} onChange={(value) => this.setState({ plugin:value })}>
                          {pluginOption.map((item, index) => {
                              return  <Option value={item} key={index}>{item.slice(0, -3)}</Option>;
                          })}
                      </Select>
                  </div>
                  <Button type="primary" className="upLoad-button" onClick={this.modificate}>确定</Button>
              </div>
              <div className="upLoad-nameLine"></div>
              <div className="upLoad-name">上传插件</div>
              <UpLoadFile />
          </div>
      );
  }
}
export default UpLoad;



