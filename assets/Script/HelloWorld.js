const _ = require('lodash');
const tiles = {
    '0':[[1],[1],[1]],
    '1':[[1,1,1]],
    '2':[[1,1],[0,1]],
    '3':[[1,1],[1,1]],
    '4':[[1,1,1],[0,0,1]],
    '5':[[1,1],[0,1],[0,1]],
    '6':[[0,1,0],[1,1,1]],
    '7':[[1,1,1],[1,0,0]],
};
cc.Class({
    extends: cc.Component,
    
    properties: {
        col:14,
        row:14, 
        speed: 800,// 下降速度：800ms

        tile_bg1: cc.SpriteFrame,
        tile_bg2: cc.SpriteFrame,

        tile_1: cc.SpriteFrame,

        currIndex: {// 元件左上角的位置
            set(val){
                this._currIndex = val;
            },
            get(){
             if(!this._currIndex){
                 this._currIndex = [0,7];
                }
                return this._currIndex;
            },
        },
        tiles: {
            set(val){
                this._tiles = val;
            },
            get(){
             if(!this._tiles){
                 this._tiles = [[1],[1]];
                }
                return this._tiles;
            },
        },
       data: {
           set(val){
               this._data = val;
           },
           get(){
            if(!this._data){
                this._data = this.innitArray(this.row,this.col,0);
               }
               return this._data;
           },
       },
       willTouchBottom: false, // 即将触底
    },
    /**
     * 初始化二维数组
     * @param {} a 行
     * @param {} b 列
     * @param {} c 初始值
     */
    innitArray(a, b, c) {
        const arr2 = new Array();
        for (let i = 0; i < a; i++) {
        arr2[i] = new Array();
        for (let j = 0; j < b; j++) {
            arr2[i][j] = c;
        }
        }
        return arr2;
    },

    /**
     * 移动元件
     */
    moveTiles(start, tiles, id){
        return new Promise((res,rej) => {
            const positions = this.getPositions(start,tiles);
            const { data,isExist } = this.merge(this.data,positions,id);
            if(isExist){
                rej();
            }else {
                this.copy_data = data; // 在触底的时候 将this.copy_data赋值给this.data
                this.tiles = tiles; // 成功渲染之后，在赋值给 this.tiles
                this.updateMap(data);
                res(data);
            }
        });
    },

    /**
     * 拿到元件所有 tile 的点坐标
     * @param {array} start 元件左上角点坐标
     * @param {array} tiles 元件的二维数组
     */
    getPositions(start, tiles) {
        const positions = [];
        for (let i1 = 0; i1 < tiles.length; i1++) {
            const v1 = tiles[i1];
            for (let i2 = 0; i2 < v1.length; i2++) {
                const v2 = v1[i2];
                const tile = [start[0] + i1, start[1]];
                tile[1] += i2;
                if (v2) {
                    positions.push(tile);
                }
            }
        }
        return positions;
    },

    /**
     * 返回新的data渲染棋盘
     * @params {} data 棋盘数据
     * @params {} position 元件的坐标集合
     * @params {} id 元件的id
     */
    merge(data, positions, id){
        data = _.cloneDeep(data);
        let isExist = false;
        for (let i = 0; i < positions.length; i++) {
          const tile = positions[i];
            if(data[tile[0]][tile[1]]){
                isExist = true;
            }else {
                data[tile[0]][tile[1]] = id;
            }
        }
        return { data, isExist };
    },

    /**
     * 更新棋盘
     */
    updateMap(data) {
        const $build = cc.find('/content/build', this.node);
        const $tiles = $build.children;
        if (!data || data.length !== this.col) return;
        data.forEach((v1, i1) => {
        v1.forEach((v2, i2) => {
            let $tile = $tiles[i1 * this.col + i2];
            const sprite = $tile.getComponent(cc.Sprite);
            if (v2) {
                sprite.spriteFrame = this[`tile_${v2}`];
            }else {
                sprite.spriteFrame = this.tile_bg1;
                if ((i1 + i2 + 1) % 2 === 0) {
                    sprite.spriteFrame = this.tile_bg2;
                }
            }
        });
        });
    },

    /**
     * 触底
     */
    bottomOut() {
        this.currIndex = null;
        this.data = this.copy_data;
        this.bottomCheck();
        const random = Math.floor(Math.random()*(6+1));
        this.tiles = tiles[random];
    },

    /**
     * 触底检查
     */
    bottomCheck() {
        for(let i1=0; i1<this.data.length; i1++){
            const v1 = this.data[i1];
            let clear = true;
            for(let i2=0; i2<v1.length; i2++){
                if(v1[i2] === 0){
                    clear = false;
                    break;
                }
            }
            if(clear){
                this.data.splice(i1,1);
                this.data.splice(0,0,[0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
                // todo: 加分
            }
        }
    },

    /**
     * 检查游戏是否结束
     */
    failCheck() {

    },

    /**
     * 点击【下】
     */
    onClickDown() {
        const bottom_y = ++this.currIndex[0] + this.tiles.length;
        if(bottom_y > this.row) {
            this.bottomOut();
            console.error('碰到棋盘底部了');
        }else {
            this.moveTiles(this.currIndex,this.tiles, 1)
            .catch(()=>{
                // 触下
                this.currIndex[0]--;
                this.bottomOut();
                console.error('碰到其他元件了');
            });
        }
    },

    /**
     * 点击【左】
     */
    onClickLeft() {
        const left_x = --this.currIndex[1];
        if(left_x < 0) {
            // 触左
            this.currIndex[1]++;
        }else {
            this.moveTiles(this.currIndex,this.tiles, 1)
            .catch(()=>{
                // 触左
                this.currIndex[1]++;
            });
        }
    },

    /**
     * 点击【右】
     */
    onClickRight() {
        const right_x = ++this.currIndex[1] + this.tiles[0].length;
        if(right_x > this.col) {
            // 触右
            this.currIndex[1]--;
        }else {
            this.moveTiles(this.currIndex,this.tiles, 1)
            .catch(()=>{
                // 触右
                this.currIndex[1]--;
            });;
        }
    },
    
    /**
     * 点击【上】
     */
    onClickUp() {
        const tiles = this.rotateTiles(this.tiles);
        this.moveTiles(this.currIndex,tiles, 1);
    },

    /**
     * 旋转元件
     * 实际就是旋转3*3的二维数组
     * @param {array} data
     * @return {array} res
     */
    rotateTiles(data) {
        data = this.make3Matrix(data);
        let res = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        data.forEach((v1, i1) => {
        v1.forEach((v2, i2) => {
            res[i2][2 - i1] = data[i1][i2];
        });
        });
        res = this.reduceMatrix(res);
        return res;
    },

    /**
     * 将普通二维数组转成 3*3 的二维数组
     * [           [
     * [0,1],    [0,1,0],
     * [1,1], => [1,1,0]
     *           [0,0,0]
     * ]           ]
     */
    make3Matrix(data) {
        const res = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        data.forEach((v1, i1) => {
        v1.forEach((v2, i2) => {
            if (v2) {
            res[i1][i2] = v2;
            }
        });
        });
        return res;
    },

    /**
     * 删除二维数组全部为0的行和列
     * [           [
     * [0,0,1],    [0,1],
     * [0,1,1], => [1,1]
     * [0,0,0]
     * ]           ]
     */
    reduceMatrix(data) {
        data = _.cloneDeep(data);
        let del_row = [];
        let del_col = [];
        for (let i1 = 0; i1 < data.length; i1++) {
        let row = 0;
        let col = 0;
        const v1 = data[i1];
        for (let i2 = 0; i2 < v1.length; i2++) {
            row += data[i1][i2];
            col += data[i2][i1];
        }
        if (col === 0) {
            del_col.push(i1);
        }
        if (row === 0) {
            del_row.push(i1);
        }
        }

        // 删列
        for (let i1 = del_col.length - 1; i1 >= 0; i1--) {
        const del_index = del_col[i1];
        for (let i2 = 0; i2 < data.length; i2++) {
            data[i2].splice(del_index, 1);
        }
        }
        // 删行
        for (let i1 = del_row.length - 1; i1 >= 0; i1--) {
        const del_index = del_row[i1];
        data.splice(del_index, 1);
        }

        return data;
    },

    onLoad: function () {
        console.error('=====onLoad=====');
        const $controlUp = cc.find('/btnGroup-1/control-up',this.node);
        const $controlDown = cc.find('/btnGroup-1/control-down',this.node);
        const $controlLeft = cc.find('/btnGroup-2/control-left',this.node);
        const $controlRight = cc.find('/btnGroup-2/control-right',this.node);

        $controlUp.on('click',()=>{
            this.onClickUp();
        });

        $controlDown.on('click',()=>{
            this.onClickDown();
        });

        $controlLeft.on('click',()=>{
            this.onClickLeft();
        });

        $controlRight.on('click',()=>{
            this.onClickRight();
        });
    },

    start: function () {
        this.moveTiles(this.currIndex,this.tiles, 1);
        // setInterval(()=>{
        //     this.onClickDown();
        // },this.speed);
    },

    // update: function (dt) {

    // },
});
