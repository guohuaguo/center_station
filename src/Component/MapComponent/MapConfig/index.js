import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './UpLoad';
import { LocaleProvider } from 'antd';
import registerServiceWorker from './registerServiceWorker';
import zhCN from 'antd/lib/locale-provider/zh_CN.js';



ReactDOM.render(
    <LocaleProvider locale={zhCN}>
        <App />
    </LocaleProvider>,
    document.getElementById('root')
);
registerServiceWorker();
