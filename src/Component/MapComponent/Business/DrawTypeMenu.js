/**框选菜单栏 */
import React, { Component } from 'react';
import '../style/index.less';
class DrawTypeMenu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            boxIsShow: false,
            isSelected:'Circle'
        };
    }
  //框选图形选择事件处理
  selectMenuHandle = (e) => {
      const { isSelected } = this.state;
      const { callBack } = this.props;
      let _type = e.target.dataset.i;
      if(_type === isSelected){
          this.setState({ isSelected:'' });
          _type = 'None';
      }else{
          this.setState({ isSelected:_type });
      }
      if (callBack) {
          callBack(_type);
      }
  };
  //取消选择
  handCancel = () => {
      this.setState({ boxIsShow: false });
  };
  //控制选择框的显示
  handShowMenu=() => {
      this.setState((prevState) => ({ boxIsShow:!prevState.boxIsShow }));
  }
  render() {
      const { boxIsShow, isSelected } = this.state;
      return (
          <div className="drawSelect">
              <div style={{ display:'flex', position:'relateive', height:'32px', width:'72px', marginBottom:'10px', cursor:'pointer', justifyContent:'center' }} onClick={this.handShowMenu}>
                  <div className="menuTitle"><i></i><span style={{ color:'#4381DE' }}>选择</span></div>
              </div>
              <div
                  className="drawTypeMenu"
                  style={{ display: boxIsShow ? 'block' : 'none' }}
              >
                  <div className="title">
                      <span>选择</span>
                      <i className="cancelIcon" onClick={this.handCancel} />
                  </div>
                  <ul onClick={this.selectMenuHandle}>
                      <li className="LineString"  style={{ backgroundColor:isSelected === 'LineString' ? '#c4c4c3' : '#fff' }}  data-i="LineString" />
                      <li className="Rectangle" style={{ backgroundColor:isSelected === 'Rectangle' ? '#c4c4c3' : '#fff' }}  data-i="Rectangle" />
                      <li className="Circle"  style={{ backgroundColor:isSelected === 'Circle' ? '#c4c4c3' : '#fff' }}   data-i="Circle" />
                      <li className="Polygon"  style={{ backgroundColor:isSelected === 'Polygon' ? '#c4c4c3' : '#fff' }}  data-i="Polygon" />
                  </ul>
              </div>
          </div>
      );
  }
}
export default DrawTypeMenu;
