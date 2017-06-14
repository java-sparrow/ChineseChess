// 样式类名
const CHESSBOARD_CONTAINER_CLASSNAME = "chessboard-container";
const CHESSBOARD_ROW_CLASSNAME = "chessboard-row";
const CHESSPIECE_LOCATION_CLASSNAME = "chess-pieces-location";
const CHESSPIECE_LOCATION_LASTROW_CLASSNAME = "chess-pieces-location--row-last";
const CHESSPIECE_CLASSNAME = "chess-pieces";

// 对弈方属性
const PLAY_SIDE_FIRST = {
    sideFlag: "红",
    className: "chess-pieces--red",
    toString: function () {
        return this.sideFlag;
    }
};
const PLAY_SIDE_SECOND = {
    sideFlag: "黑",
    className: "chess-pieces--black",
    toString: function () {
        return this.sideFlag;
    }
};

// 棋子类定义
class ChessPiece {
    /**
     * 构造器
     * @param {Object} options 配置对象
     * @param {String} options.character 棋子名称，如 “兵”
     * @param {String | Object} options.playSide 棋子阵营，默认值为 PLAY_SIDE_SECOND，有效值为 "红"、"黑" 或 PLAY_SIDE_FIRST、PLAY_SIDE_SECOND
     * @param {Object} options.location 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     * @param {boolean} options.isPutInChessboard 初始化后是否将棋子放置到棋盘上，默认为 true
     * @param {Chessboard} options.chessboard 棋盘对象，标识棋子所属的棋盘
     */
    constructor({character, playSide, location: [x, y], isPutInChessboard, chessboard}) {
        this.character = (character = character.charAt(0));
        this.chessboard = chessboard;

        playSide = (playSide == PLAY_SIDE_FIRST) ? PLAY_SIDE_FIRST : PLAY_SIDE_SECOND;
        this.playSide = playSide;

        this.chessPieceElement = $(`
            <div class="chess-pieces ${playSide.className}">
                <div class="chess-pieces-border">
                    <div class="chess-pieces-character">${character}</div>
                </div>
            </div>
        `);

        // 初始化后 默认会将棋子放在棋盘上
        if (isPutInChessboard !== false) {
            if (!this.putInChessboard([x, y])) {
                console.warn("[%s]方棋子[%s] 放置在 (%s, %s) 位置失败", this.playSide.toString() , this.character, x, y);
            }
        }

        // 棋子当前位置（未放入棋盘时，值为-1）
        this.currentLocationX = -1;
        this.currentLocationY = -1;
    }

    /**
     * 放置棋子到棋盘
     * @param {Array} locationArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     * @return {boolean} 若成功将棋子放入棋盘内，则返回 true，否则返回 false
     */
    putInChessboard([x, y]) {
        x = parseInt(x, 10);
        y = parseInt(y, 10);

        if (!this.checkLocationRange([x, y])) {
            return false;
        }

        if (this.hasChessPiece([x, y])) {
            console.warn("该位置(%s, %s)有棋子，请重新选择其它落子位置", x, y);

            return false;
        }
        
        // 将棋子放入指定位置的容器中
        this.chessPieceElement.appendTo(this.chessboard.locationArray[y][x]);
        console.info("[%s]方棋子[%s] 成功放置至 (%s, %s) 位置", this.playSide.toString() , this.character, x, y);

        // 保存棋子在棋盘的当前位置
        this.currentLocationX = x;
        this.currentLocationY = y;

        return true;
    }

    /**
     * 校验位置范围
     * @param {Array} locationArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     * @return {boolean} 位置范围在棋盘坐标内，则返回 true，否则返回 false
     */
    checkLocationRange([x, y]) {
        // 有校验整数的必要？

        if (x < 0 || x > 8) {
            console.warn("横轴坐标范围为 0 ~ 8 之间的整数");
            
            return false;
        }
        else if (y < 0 ||y > 9) {
            console.warn("纵轴坐标范围为 0 ~ 9 之间的整数");
            
            return false;
        }

        return true;
    }

    /**
     * 判断指定位置是否有棋子存在
     * @param {Array} locationArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     * @return {boolean} 若指定位置有棋子，则返回 true，否则返回 false
     */
    hasChessPiece([x, y]) {
        var targetLocation = this.chessboard.locationArray[y][x];

        return (targetLocation.find("." + CHESSPIECE_CLASSNAME).length > 0);
    }
}

// 棋盘类定义
class Chessboard {
    /**
     * 构造器
     * @param {Object} options 配置对象
     * @param {String|jQueryObject} options.container 棋盘容器
     */
    constructor({container}) {
        // 棋盘容器
        this.container = $(container);
        // 棋点格子容器二维数组
        this.locationArray = this.createLocationArray();
        // 初始化棋点格子的座标信息
        this.initLocationInfo();
    }

    /**
     * 创建 包含所有棋点格子容器的二维数组
     * @return {Array<Array<jQueryObject>>} 包含所有棋点格子容器的二维数组
     */
    createLocationArray() {
        var locationArray = [];

        this.container.find("." + CHESSBOARD_ROW_CLASSNAME).each(function (rowIndex, row) {
            var locationRowArray = [];

            $(this).find("." + CHESSPIECE_LOCATION_CLASSNAME).each(function (colIndex, col) {
                var $_location = $(this);

                // 最后一行每个格子 有两个棋子位置容器，所以这里需要提排除补充的棋子位置容器
                if (!$_location.hasClass(CHESSPIECE_LOCATION_LASTROW_CLASSNAME)) {
                    locationRowArray.push($_location);
                }
            });

            locationArray.push(locationRowArray);
        });

        // 补充最后一行的棋子位置容器
        var locationLastRowArray = [];
        this.container.find("." + CHESSPIECE_LOCATION_LASTROW_CLASSNAME).each(function (colIndex, col) {
            locationLastRowArray.push($(this));
        });
        locationArray.push(locationLastRowArray);

        return locationArray;
    }

    /**
     * 初始化棋点格子的座标信息
     */
    initLocationInfo() {
        // 遍历二维数组，并为每个棋点格子添加座标信息
        this.locationArray.forEach((locationRowArray, rowIndex) => {
            locationRowArray.forEach((locationElement, colIndex) => {
                locationElement.attr(Chessboard.LOCATION_X_ATTRNAME, colIndex)
                    .attr(Chessboard.LOCATION_Y_ATTRNAME, rowIndex);
            });
        });
    }

    /**
     * 创建棋子对象，并把棋盘自身引用 作为 参数对象的chessboard属性值
     * @param {Object} options 配置对象，详情请参见 ChessPiece 类构造器参数说明
     * @return {ChessPiece} 新创建的棋子类对象
     */
    addChessPiece(options) {
        options.chessboard = this;

        return new ChessPiece(options);
    }
}
/*
 * 静态属性
 */
Chessboard.LOCATION_X_ATTRNAME = "location-x";
Chessboard.LOCATION_Y_ATTRNAME = "location-y";


$(function () {
    var chessboard = new Chessboard({container: "." + CHESSBOARD_CONTAINER_CLASSNAME});

    // 绑定 显示坐标 事件
    var $_locationX = $("#locationX");
    var $_locationY = $("#locationY");
    chessboard.container.on("mouseover", "." + CHESSPIECE_LOCATION_CLASSNAME, function () {
        var $_location = $(this);

        $_locationX.text($_location.attr(Chessboard.LOCATION_X_ATTRNAME));
        $_locationY.text($_location.attr(Chessboard.LOCATION_Y_ATTRNAME));
    });

    // 进入开发模式
    $("body").addClass("debug-mode");


    /* ----- 测试代码 -----*/
    // 双方各放一个马
    chessboard.addChessPiece({character: "马", playSide: PLAY_SIDE_SECOND, location:[2, 2]});
    chessboard.addChessPiece({character: "马", playSide: PLAY_SIDE_FIRST, location:[6, 7]});
    // 放置错误的棋子
    chessboard.addChessPiece({character: "哪", location:[4, 18]});
    chessboard.addChessPiece({character: "有", location:[2, 2]});
});
