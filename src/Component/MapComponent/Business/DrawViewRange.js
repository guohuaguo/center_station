import React, { Component } from 'react';
import { notification } from 'antd';
let cvs, ctx, point1, point2, CVS_HEIGHT, CVS_WIDTH;
class DrawViewRange extends Component{
    constructor(props){
        super(props);
    }
    componentDidMount(){
        let { getDrawInfo, ponitInfo } = this.props;
        let that = this;
        let _info = {};
        //获取feature的信息组装
        if(ponitInfo){
            _info = {
                viewSheds:ponitInfo.get('ViewSheds'),
                viewAngle:ponitInfo.get('ViewAngle'),
                markerAngle:ponitInfo.get('MarkerAngle')
            };
        }
        cvs = document.getElementById('cvs');
        let CVS_X = cvs.getBoundingClientRect().x;
        let CVS_Y = cvs.getBoundingClientRect().y;
        CVS_WIDTH = 400;
        CVS_HEIGHT = 400;
        let _angle, _viewAngle, _distance1, _distance2;
        ctx = cvs.getContext('2d');
        //画xy轴
        that.drawXY();
        //第一次有可视域
        if(_info.viewAngle){
            that.drawArc(_info.markerAngle, _info.markerAngle + _info.viewAngle, _info.viewSheds);
            point1 = true;
            point2 = true;
        }
        cvs.onclick = function(e){
            let _x = e.clientX - CVS_X;
            let _y = e.clientY - CVS_Y;

            if(!point1){
                //绘制第一条线
                ctx.moveTo(CVS_WIDTH / 2, CVS_HEIGHT / 2);
                ctx.lineTo(_x, _y);
                ctx.strokeStyle = '#f00';
                ctx.stroke();
                //扇形半径
                let _Rx = _x - CVS_WIDTH / 2;
                let _Ry = _y - CVS_HEIGHT / 2;
                _distance1 = Math.sqrt(_Rx * _Rx + _Ry * _Ry);
                //第一条线的角度
                _angle = Math.acos(_Rx / _distance1) * 360 / (2 * Math.PI);
                if (e.clientY - CVS_Y < CVS_HEIGHT / 2){
                    _angle = 360 - _angle;
                }
                //重置第一条线的状态
                point1 = true;

                cvs.onmousemove = function(evt){
                    if(!point2 && point1){
                        //console.log(evt)
                        let _moveX = evt.clientX - (CVS_X + CVS_WIDTH / 2);
                        let _moveY = evt.clientY - (CVS_Y + CVS_HEIGHT / 2);
                        let distance = Math.sqrt(_moveX * _moveX + _moveY * _moveY);
                        let _movePointX = (_distance1 * _moveX / distance) + CVS_WIDTH / 2;
                        let _movePointY = (_distance1 * _moveY / distance) + CVS_HEIGHT / 2;
                        //画xy轴
                        that.drawXY();
                        //重新绘制第一条线
                        ctx.moveTo(CVS_WIDTH / 2, CVS_HEIGHT / 2);
                        ctx.lineTo(_x, _y);
                        //绘制动态线
                        ctx.moveTo(CVS_WIDTH / 2, CVS_HEIGHT / 2);
                        ctx.lineTo(_movePointX, _movePointY);
                        ctx.strokeStyle = '#f00';
                        ctx.stroke();
                    }
                };

            }else if(!point2){
                _x = _x - CVS_WIDTH / 2;
                _y = _y - CVS_HEIGHT / 2;
                _distance2 = Math.sqrt(_x * _x + _y * _y);
                _viewAngle = Math.acos(_x / _distance2) * 360 / (2 * Math.PI);
                //清除画布画xy轴
                that.drawXY();
                if (e.clientY - CVS_Y < CVS_HEIGHT / 2) {
                    _viewAngle = 360 - _viewAngle;
                }
                //画弧
                that.drawArc(_angle, _viewAngle, _distance1);
                //end   x轴正半轴为0度 逆时针 startAngle：起始角度  endAngle:结束角度  _distance1:半径
                let _startAngle = 360 - _angle;
                let _endAngle = 360 - _viewAngle;
                let _rangeAngle = Math.abs(_endAngle - _startAngle);  //弧度范围
                if(_rangeAngle > 180){//弧度范围小于等于180
                    _rangeAngle = 360 - _rangeAngle;
                    _startAngle = _startAngle >= _endAngle ? _startAngle : _endAngle;
                }
                let _drawInfo = {
                    MarkerAngle:_startAngle,
                    ViewAngle:_rangeAngle,
                    ViewSheds:_distance1
                };
                //执行回调，返回绘制的参数
                if(getDrawInfo){
                    getDrawInfo(_drawInfo);
                }
                point2 = true;
            }else{
                notification.config({
                    placement: 'bottomRight'
                });
                notification['info']({
                    message: '提示',
                    description: '请清除已有可视域',
                    duration: 2
                });
            }
        };

    }
    drawXY=() => {
        //清除画板
        cvs.height = CVS_HEIGHT;
        //画x轴
        ctx.moveTo(0, CVS_HEIGHT / 2);
        ctx.lineTo(CVS_WIDTH, CVS_HEIGHT / 2);
        //画y轴
        ctx.moveTo(CVS_WIDTH / 2, 0);
        ctx.lineTo(CVS_WIDTH / 2, CVS_HEIGHT);
        ctx.strokeStyle = '#f00';
        ctx.stroke();
    }
    //绘制扇形
   drawArc = (_angle, _viewAngle, distance) => {
       let that = this;
       //扇形的绘制，保留不大于180的夹角
       //ctx.arc( 圆心x轴坐标，圆心y轴坐标，半径, 起点弧度，结束点弧度，是否逆时针画(可选) )
       ctx.beginPath();
       ctx.moveTo(CVS_WIDTH / 2, CVS_HEIGHT / 2);
       if(_angle < _viewAngle){
           if( (_viewAngle - _angle) > 180){
               ctx.arc(CVS_WIDTH / 2, CVS_HEIGHT / 2, distance, that.angleToRadian(_angle), that.angleToRadian(_viewAngle), true);
           }else{
               ctx.arc(CVS_WIDTH / 2, CVS_HEIGHT / 2, distance, that.angleToRadian(_angle), that.angleToRadian(_viewAngle), false);
           }
       }else{
           if((_angle - _viewAngle) > 180){
               ctx.arc(CVS_WIDTH / 2, CVS_HEIGHT / 2, distance, that.angleToRadian(_angle), that.angleToRadian(_viewAngle), false);
           }else{
               ctx.arc(CVS_WIDTH / 2, CVS_HEIGHT / 2, distance, that.angleToRadian(_angle), that.angleToRadian(_viewAngle), true);
           }
       }
       ctx.strokeStyle = '#f00';
       ctx.closePath();
       ctx.stroke();
   }
   clearHandle=() => {
       this.drawXY();
       point1 = false;
       point2 = false;
   }
    //   角度需要转化成弧度公式
   angleToRadian(angle) {
       return Math.PI / 180 * angle;
   }

   render(){
       const{ imageUrl } = this.props;
       return(
           <div className="drawViewRange">
               <p>
                   <span>可视域：</span>
                   <button onClick={this.clearHandle}>清除</button>
               </p>
               <canvas id="cvs" width="400" height="400" style={{ background:`url(${imageUrl})`, border:'1px solid #f00' }}></canvas>
           </div>
       );
   }
}
export default DrawViewRange;