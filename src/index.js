import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { LocaleProvider } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import 'moment/locale/zh-cn';
import moment from 'moment'
import App from './App';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from './Redux/reducers';
import * as serviceWorker from './serviceWorker';

moment.locale('zh-cn');

const store = createStore(rootReducer);

ReactDOM.render(
    <LocaleProvider locale={zh_CN}>
        <Provider store={store}>
            <App />
        </Provider>
    </LocaleProvider >, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
