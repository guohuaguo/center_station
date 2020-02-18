/**
 * 插件上传
 */
import React, { Component } from 'react';
import { message, Button } from 'antd';
import WebUploader from 'webuploader';
class UpLoadFile extends Component{
    constructor(props) {
        super(props);
        this.state = {
            fileName:''
        };
	  }
    componentDidMount(){
        this.onloadWebUploader();
    }
	//webuploader上传
	onloadWebUploader = () => {
	    const me = this;
	    // 实例化
	    const uploader = WebUploader.create({
	        auto: true,
	        pick:'#picker',
	        //是否允许在文件传输时提前把下一个文件准备好
	        prepareNextFile: true,
	        //允许同时最大上传进程数
	        threads: 5,
	        swf: './Uploader.swf',
	        //是否要分片处理大文件上传
	        chunked: true,
	        //分片大小
	        chunkSize: 100 * 1024 * 1024,
	        // 文件接收服务端
	        server:  '/api/mapCfg',
	        // 是否禁掉整个页面的拖拽功能
	        disableGlobalDnd: true,
	        //通过粘贴来添加截屏的图片
	        paste: document.body,
	        // 是否可重复上传
	        duplicate :false,
	        //文件总数量
	        fileNumLimit: 100,
	        //文件总大小
	        //fileSizeLimit: 600 * 1024 * 1024,    // 100 M
	        //单个文件大小
	        fileSingleSizeLimit: 100 * 1024 * 1024   // 30 M
	    });
	    //添加资源进队列中
	    uploader.on( 'fileQueued', function( file ) {
	        me.setState({
	            fileName:file.name
	        });
	    });
	    //成功事件,  针对一个文件
	    uploader.on( 'uploadSuccess', function( file, response ) {
  			if ( response.ErrCode === 0 ) {
	            message.success('已上传');
	        } else {
	            message.error('上传失败');
	        }
	    });
	    //失败事件
	    uploader.on( 'uploadError', function( file ) {
	        message.info('上传出错');
	    });
	    //完成事件
	    uploader.on( 'uploadComplete', function( file ) {
	        // $( '#'+file.id ).find('.progress').fadeOut();
	    });
	}
	render() {
 		const { fileName } = this.state;
	    return(
	        <div id="uploader" className="wu-example">
 				<div className="btns">
	                <Button id="picker" type="primary" className="upLoad-picker">上传</Button>
	                <div id="thelist" className="uploader-list">{fileName}</div>
	            </div>
	        </div>
	    );
	}
}
export default UpLoadFile;

