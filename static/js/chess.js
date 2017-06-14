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
        this.chessboard = chessboard;

        this.playSide = (playSide == PLAY_SIDE_FIRST) ? PLAY_SIDE_FIRST : PLAY_SIDE_SECOND;

        // 容错：棋子名称只取第一个字，其余忽略
        character = character.charAt(0);
        // 根据棋子阵营 选择 棋子名称
        this.character = (this.playSide == PLAY_SIDE_FIRST ? character : ChessPiece.getSecondCharacter(character));

        this.chessPieceElement = $(`
            <div class="chess-pieces ${this.playSide.className}">
                <div class="chess-pieces-border">
                    <div class="chess-pieces-character">${this.character}</div>
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

/*
 * 静态属性
 */
ChessPiece.CHARACTER_ROOKS = "车";
ChessPiece.CHARACTER_KNIGHTS = "马";
ChessPiece.CHARACTER_ELEPHANTS = "相";
ChessPiece.CHARACTER_GUARDS = "仕";
ChessPiece.CHARACTER_KING = "帅";
ChessPiece.CHARACTER_CANNONS = "炮";
ChessPiece.CHARACTER_SOLDIERS = "兵";

/*
 * 静态方法
 */

/**
 * 根据第一种阵营的棋子名称，获取对应第二种阵营的棋子名称
 * @param {String} character 第一种阵营的棋子名称
 * @return {String} 第二种阵营的棋子名称
 */
ChessPiece.getSecondCharacter = character => ({
    // "车": "车",
    // "马": "马",
    "相": "象",
    "仕": "士",
    "帅": "将",
    "炮": "砲",
    "兵": "卒"
// 从Map对象中 获取对应的字符。若没有对应字符，则使用原字符
}[character] || character);

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
        // 初始化棋子
        this.initChessPiece();
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

    /**
     * 初始化棋子（在棋盘上布置双方各16子）
     */
    initChessPiece() {
        Chessboard.getInitChessPieceOptionsArray()
            .forEach(options => this.addChessPiece(options));
    }
}
/*
 * 静态属性
 */
Chessboard.LOCATION_X_ATTRNAME = "location-x";
Chessboard.LOCATION_Y_ATTRNAME = "location-y";

/*
 * 静态方法
 */

/**
 * 获取 双方棋子初始化配置数组
 * @return {Array<Object>} 双方棋子初始化配置数组
 */
Chessboard.getInitChessPieceOptionsArray = (function () {
    // 根据配置对象和位置转换方法（水平对称或垂直对称），创建另一个配置对象
    var createSymmetricalOptions = (options, convertLocation) => {
        var [x, y] = options.location;

        return Object.assign({}, options, {location: convertLocation([x, y])});
    };
    // 水平位置对称转换方法
    var convertHorizontalLocation = ([x, y]) => [8 - x, y];
    // 垂直位置对称转换方法
    var convertVerticalLocation = ([x, y]) => [x, 9 - y];

    // 存放（单方）棋子初始化配置的数组（长度：2 + 7 * 2 = 16）
    var singleSideChessPieceOptionsArray = [
        // 首先是中线上的棋子
        // 帅
        {
            character: ChessPiece.CHARACTER_KING,
            location:[4, 9]
        },
        // 兵
        {
            character: ChessPiece.CHARACTER_SOLDIERS,
            location:[4, 6]
        }
    ];
    // 然后，遍历其它非中线棋子 并将 其 和 位置信息水平对称之后的配置对象 一起放入棋子初始化配置数组中
    [
        // 车
        {
            character: ChessPiece.CHARACTER_ROOKS,
            location:[0, 9]
        },
        // 马
        {
            character: ChessPiece.CHARACTER_KNIGHTS,
            location:[1, 9]
        },
        // 相
        {
            character: ChessPiece.CHARACTER_ELEPHANTS,
            location:[2, 9]
        },
        // 仕
        {
            character: ChessPiece.CHARACTER_GUARDS,
            location:[3, 9]
        },
        // 炮
        {
            character: ChessPiece.CHARACTER_CANNONS,
            location:[1, 7]
        },
        // 兵
        {
            character: ChessPiece.CHARACTER_SOLDIERS,
            location:[0, 6]
        },
        {
            character: ChessPiece.CHARACTER_SOLDIERS,
            location:[2, 6]
        }
        // 将棋子配置 及 对称的配置 放入存放棋子初始化配置的数组中
    ].forEach(options => singleSideChessPieceOptionsArray.push(options, createSymmetricalOptions(options, convertHorizontalLocation)));

    // 双方棋子初始化配置数组（是 singleSideChessPieceOptionsArray 数组单独 map两次 再 concat 起来的新数组）
    var doubleSideChessPieceOptionsArray = singleSideChessPieceOptionsArray.map(
        // 设置第一种阵营
        options => Object.assign({}, options, {playSide: PLAY_SIDE_FIRST})
    ).concat(singleSideChessPieceOptionsArray.map(
        // 设置第二种阵营（位置信息需要垂直对称）
        options => Object.assign({}, createSymmetricalOptions(options, convertVerticalLocation), {playSide: PLAY_SIDE_SECOND})
    ));

    // 返回 长度为32 包含了 双方棋子初始化配置的数组
    return () => doubleSideChessPieceOptionsArray;
})();


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
});
