import React, { useState } from 'react';
import { Menu, Layout } from 'antd';
import { HashRouter as Router, Route, Redirect, NavLink } from "react-router-dom";
import './App.less';
import PersonalHome from './Pages/PersonalHome';
import ApplicationCenter from './Pages/ApplicationCenter';
import ApplicationStation from './Pages/ApplicationStation';
import Other from './Pages/Other';
import ModelCreation from './Pages/ModelCreation';
import { Page } from './Config.js';

const { Header, Content, Footer } = Layout

function App() {

  const [selectedKeys, setSelect] = useState(['应用中台'])
  function handleClick(e) {
    setSelect([e.key])
  }

  function judgeRoute(it) {
    switch (it.route.pathname) {
      case '/home':
        return <Route key={it.route.pathname} path='/home' component={PersonalHome} />
      case '/center':
        return <Route key={it.route.pathname} path='/center' component={ApplicationCenter} />
      case '/station':
        return <Route key={it.route.pathname} path='/station' component={ApplicationStation} />
      default:
        return <Route key={it.route.pathname} path={it.pathname} component={Other} />
    }
  }
  return (
    <div className='App'>
      <Router>
        <Layout>
          <Header
          >
            <span>公安视频图像综合应用平台</span>
            <Menu
              mode='horizontal'
              selectedKeys={selectedKeys}
              onClick={handleClick}
            >
              {
                Page.map((item) => {
                  return <Menu.Item
                    key={item.title}
                  >
                    <NavLink to={item.route}>{item.title}</NavLink>
                  </Menu.Item>
                })
              }
            </Menu>
          </Header>
          <Content style={{ width: '100%', height: 'calc(100vh - 80px)' }}>
            <Route path='/' exact render={() => (
              <Redirect to='/station' />
            )} />
            {
              Page.map((item) => {
                return judgeRoute(item)
              })
            }
            <Route key='/model' path='/model' component={ModelCreation} />
          </Content>
          <Footer style={{ background: 'black' }}></Footer>
        </Layout>
      </Router>
    </div>
  );
}
export default App;
