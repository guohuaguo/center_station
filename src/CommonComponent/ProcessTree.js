import lodash from 'lodash';

/**
 * 流程图的树形结构
 */
export default class ProcessTree {


    static saveModel(name, treeArray) {
        console.log('treeArray', treeArray);
        //将树形的数组保存成json格式存到数据库
        if (!Array.isArray(treeArray) || name === '') {
            return;
        }
        let sql = `insert into tbl_model(name,model) values (${name},${JSON.stringify(treeArray)})`;
        //执行sql语句将返回值返回到UI界面告诉保存是否成功,如果成功
        console.log('处理步骤', this._dealStep(this._wideTraversal(this._treeArray2Data(treeArray))));
    }

    /**
     * 将treeArray初始化成treeData(外传的数据转换成树形结构)
     * @param {Array} treeArray 包含所有树节点的数组，格式如下[{id,type,parentId}]
     */
    static _treeArray2Data(treeArray) {
        let result = [];
        if (!Array.isArray(treeArray)) {
            return result;
        }
        for (let i = 0; i < treeArray.length; i++) {
            //这里标记传入的必须属性
            if (!treeArray[i].id) {
                return result;
            }
            if (treeArray[i].parentId && treeArray[i].parentId === 'root') { //首先找到根节点 目前根节点应该暂时只有一个
                //定位到根节点
                let rootNode = lodash.cloneDeep(treeArray[i]); //深拷贝对象
                rootNode.depth = 0; //根节点深度为0，增加深度属性
                rootNode.children = this._getchilds(treeArray[i].id, treeArray, 1); //获取子节点
                result.push(rootNode);
            }
        }
        return result;
    }


    /**
     * 在treeArray中获取某个id下的子节点集合
     * @param {String} id 
     * @param {Array} treeArray 包含所有树节点的数组，格式如下[{id,name,parentId}]
     * @param {Number} depth 深度
     */
    static _getchilds(id, treeArray, depth) {
        let childs = [];
        if (!Array.isArray(treeArray)) {
            return childs;
        }
        for (let i = 0; i < treeArray.length; i++) {
            if (treeArray[i].parentId && treeArray[i].parentId === id) {
                let child = lodash.cloneDeep(treeArray[i]);
                child.depth = depth;
                childs.push(child);
            }
        }
        for (let i = 0; i < childs.length; i++) {
            let childscopy = this._getchilds(childs[i].id, treeArray, depth + i + 1); //如果需要显示深度，这边记得加1
            if (childscopy.length > 0) {
                childs[i].children = childscopy;
            }
        }
        return childs;
    }


    /**
     * 广度优先将树形结构再次转换成有序数组
     * @param {*} treeData 树形结构  
     */
    static _wideTraversal = (treeData) => {
        let nodes = [];
        if (treeData != null) {
            let queue = [];
            queue = [...queue, ...treeData];
            while (queue.length != 0) {
                let item = queue.shift(); //返回第一个元素并删除
                nodes.push(item); //返回值中加入第一个元素
                let children = lodash.cloneDeep(item.children);
                if (children) {
                    for (let i = 0; i < children.length; i++)
                        queue.push(children[i]); //队列中加入子元素
                }
            }
        }
        return nodes;
    }

    /**
     * 删除孙子节点
     * @param {Array} treeArrayNew 经过广度优先生成后的新数组
     */
    static _deleteSon = (treeArrayNew) => {
        let noSonArray = []; //返回值没有孙子节点的数组
        for (let i = 0; i < treeArrayNew.length; i++) {
            let tempdObj = lodash.cloneDeep(treeArrayNew[i]);
            //如果存在children
            if (tempdObj.children) {
                tempdObj.children.map((item) => {
                    //删除son属性
                    if (item.children) {
                        delete item.children;
                    }
                })
            }
            noSonArray.push(tempdObj);
        }
        return noSonArray;
    }

    /**
     * 判断两个对象数组的id是否一致，务必包含id否则直接return false[{id:'1'},{id:'4'}]
     * @param {*} array1 
     * @param {*} array2 
     */
    static _isEqual(array1, array2) {
        if (array1 === array2) {
            return true;
        }
        if (!Array.isArray(array1) || !Array.isArray(array2) || array1.length !== array2.length) {
            return false;
        }
        //将对象数组转换成Number或者String数组，把id单独提出来
        let array1New = [];
        let array2New = [];
        //遍历array1
        for (let i = 0; i < array1.length; i++) {
            //如果id不存在则直接return false
            if (array1[i].id === null || array1[i].id === undefined) {
                return false;
            } else {
                array1New.push(array1[i].id);
            }
        }
        //遍历array2
        for (let i = 0; i < array2.length; i++) {
            //如果id不存在则直接return false
            if (array2[i].id === null || array2[i].id === undefined) {
                return false;
            } else {
                array2New.push(array2[i].id);
            }
        }
        //按照ASCII排序后再进行比较
        array1New.sort();
        array2New.sort();
        return array1New.every((v, i) => {
            return v === array2New[i];
        })
    }

    /**
     * 将有序数组转换成每一步{input:'待处理的数据源，这边写表名吧，中间用，分割',type:'算子类型有枚举值',condition:'算子的处理条件',output:'输出值，也就是处理处理完的临时表名'}
     * @param {Array} orderedArray 经过广度优先处理过的有序数组
     */
    static _dealStep = (orderedArray) => {
        let steps = []; //数据库执行步骤
        if (!Array.isArray(orderedArray)) {
            return steps;
        }
        //删除孙子节点减少内存和计算次数
        orderedArray = this._deleteSon(orderedArray);
        for (let i = orderedArray.length - 1; i > -1; i--) {
            //底层的叶子节点都是数据源，不需要处理
            if (!orderedArray[i].children) {
                orderedArray.splice(i, 1); //删除这个元素
                continue;
            }
            //步骤
            let step = orderedArray[i];
            let needpush = true; //是否需要push进入的标识符，一般都是需要的，但是可能会重复，所以并不需要
            //遍历一下已有步骤中是否有相同的
            for (let j = 0; j < steps.length; j++) {
                if (steps[j].id === orderedArray[i].id && this._isEqual(steps[j].children, orderedArray[i].children)) { //id相同表示算子相同且children一致（其实可以id一致就行），表示统一步骤删除
                    orderedArray.splice(i, 1); //删除这个元素
                    needpush = false;
                    break;
                }
            }
            if (!needpush) {
                continue;
            }
            //遍历children新增input/output属性
            let input = '';
            let output = '';
            for (let j = 0; j < orderedArray[i].children.length; j++) {
                let isExist = false; //拿的是否是之前的结果集
                //遍历已有的步骤中是否有一致的
                for (let k = 0; k < steps.length; k++) {
                    if (steps[k].id === orderedArray[i].children[j].id) { //id相同表示算子相同且children一致（其实可以id一致就行），表示统一步骤删除
                        input = input + steps[k].output + ',';
                        isExist = true;
                        break;
                    }
                }
                if (isExist) {
                    continue;
                }
                input = input + orderedArray[i].children[j].type + ','; //输入为某个类型
            }
            //这边新增一个输出属性
            step.input = input.trimRight(',');
            step.output = `tbl_${'模型表id'}_${steps.length + 1}`;
            steps.push(step);
        }
        return steps;
    }
}