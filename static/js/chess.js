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
     * @param {Chessboard} options.chessboard 棋盘对象，标识棋子所属的棋盘
     */
    constructor({character, playSide, location: [x, y], chessboard}) {
        this.playSide = (playSide == PLAY_SIDE_FIRST) ? PLAY_SIDE_FIRST : PLAY_SIDE_SECOND;

        // 容错：棋子名称只取第一个字，其余忽略
        character = character.charAt(0);
        // 根据棋子阵营 选择 棋子名称
        this.character = (this.playSide == PLAY_SIDE_FIRST ? character : ChessPiece.getSecondCharacter(character));

        // 棋子元素
        this.chessPieceElement = $(`
            <div class="chess-pieces ${this.playSide.className}">
                <div class="chess-pieces-border">
                    <div class="chess-pieces-character">${this.character}</div>
                </div>
            </div>
        `);

        // 所属棋盘
        this.chessboard = chessboard;

        // 保存棋子初始化位置信息
        this.initLocationX = x;
        this.initLocationY = y;

        // 棋子当前位置（未放入棋盘时，值为-1）
        this.currentLocationX = -1;
        this.currentLocationY = -1;

        // 棋子未移动时，目标位置为-1
        this.targetLocationX = -1;
        this.targetLocationY = -1;
    }

    /**
     * 获取棋子元素
     * @return {jQueryObject} 棋子元素
     */
    getChessPieceElement() {
        return this.chessPieceElement;
    }

    /**
     * 更新棋子的当前位置信息
     * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     */
    updateCurrentLocation([x, y]) {
        this.currentLocationX = x;
        this.currentLocationY = y;
    }

    /**
     * 设置棋子的目标位置信息
     * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     */
    setTargetLocation([x, y]) {
        this.targetLocationX = x;
        this.targetLocationY = y;
    }

    /**
     * 制作棋子信息字符串，用于打印输出棋子信息。
     * 字符串内支持 $side, $name, $x, $y 变量。
     * 其中，位置信息的类型 由第二个参数指定（初始化位置、当前位置、目标位置），默认使用 当前位置类型
     * @param {String} info 信息字符串，可使用 $side, $name, $x, $y 这几个变量
     * @param {String} locationType 位置类型，可枚举值为 ChessPiece.LOCATION_TYPE_INIT, ChessPiece.LOCATION_TYPE_CURRENT, ChessPiece.LOCATION_TYPE_TARGET
     * @return {String} 已替换变量信息的字符串
     */
    makeInfo(info, locationType) {
        var locationTypeName = ({
            [ChessPiece.LOCATION_TYPE_INIT]: ChessPiece.LOCATION_TYPE_INIT,
            [ChessPiece.LOCATION_TYPE_CURRENT]: ChessPiece.LOCATION_TYPE_CURRENT,
            [ChessPiece.LOCATION_TYPE_TARGET]: ChessPiece.LOCATION_TYPE_TARGET
        // 从Map对象中 获取对应位置类型。若没有对应位置类型，则默认使用 当前位置类型
        })[locationType] || ChessPiece.LOCATION_TYPE_CURRENT;

        return info.replace("$side", this.playSide.toString())
            .replace("$name", this.character)
            .replace("$x", this[locationTypeName + "LocationX"])
            .replace("$y", this[locationTypeName + "LocationY"]);
    }
}

/*
 * 静态属性
 */
// 以下命名法，参考 https://www.zybang.com/question/cd851429401ca47079ab9b9fd80950e6.html
ChessPiece.CHARACTER_ROOKS = "车";
ChessPiece.CHARACTER_KNIGHTS = "马";
ChessPiece.CHARACTER_ELEPHANTS = "相";
ChessPiece.CHARACTER_GUARDS = "仕";
ChessPiece.CHARACTER_KING = "帅";
ChessPiece.CHARACTER_CANNONS = "炮";
ChessPiece.CHARACTER_SOLDIERS = "兵";
// 位置信息 类型标识
ChessPiece.LOCATION_TYPE_INIT = "init";
ChessPiece.LOCATION_TYPE_CURRENT = "current";
ChessPiece.LOCATION_TYPE_TARGET = "target";

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
     * @param {boolean} options.isInitChessPiece 是否初始化棋子，默认为 true
     * @param {boolean} options.isNeedInitAnimat 是否需要初始化动画，默认为 true
     * @param {number} options.initAnimatIntervalSecond 初始化动画间隔时间，默认为 0.1秒
     */
    constructor({container, isInitChessPiece = true, isNeedInitAnimat = true, initAnimatIntervalSecond = 0.1}) {
        // 棋盘容器
        this.container = $(container);
        // 棋盘位置信息二维数组
        this.locationInfoArray = this.createLocationInfoArray();

        // 动画相关选项
        this.isNeedInitAnimat = isNeedInitAnimat;
        this.initAnimatIntervalSecond = initAnimatIntervalSecond;

        // 默认会 初始化棋子
        if (isInitChessPiece !== false) {
            this.initChessPiece();
        }

        // 绑定事件
        this.bindEvent();

        /* --- 内部缓存 --- */
        // 棋盘上的棋子数组
        this._chessPieceArray = [];
    }

    /**
     * 创建 棋盘位置信息二维数组，数组元素对象包括 棋点格子容器、棋点格子坐标、棋子对象 属性
     * @return {Array<Array<Object>>} 棋盘位置信息二维数组，数组元素对象包括 棋点格子容器、棋点格子坐标、棋子对象（默认为null） 属性
     */
    createLocationInfoArray() {
        var elementArrays = [];

        this.container.find("." + CHESSBOARD_ROW_CLASSNAME).each(function (rowIndex, row) {
            var elementRowArray = [];

            $(this).find("." + CHESSPIECE_LOCATION_CLASSNAME).each(function (colIndex, col) {
                var element = $(this);

                // 最后一行每个格子 有两个棋子位置容器，所以这里需要提排除补充的棋子位置容器
                if (!element.hasClass(CHESSPIECE_LOCATION_LASTROW_CLASSNAME)) {
                    elementRowArray.push(element);
                }
            });

            elementArrays.push(elementRowArray);
        });

        // 补充最后一行的棋子位置容器
        var elementLastRowArray = [];
        this.container.find("." + CHESSPIECE_LOCATION_LASTROW_CLASSNAME).each(function (colIndex, col) {
            elementLastRowArray.push($(this));
        });
        elementArrays.push(elementLastRowArray);

        // 将二维元素数组 转换为 棋盘位置信息二维数组（数组元素对象包括 棋点格子容器、棋点格子坐标、棋子对象 属性）
        return elementArrays.map((elementRowArray, y) => elementRowArray.map((element, x) => {
            // 将棋点格子的坐标信息 添加到元素中
            element.attr(Chessboard.LOCATION_X_ATTRNAME, x)
                .attr(Chessboard.LOCATION_Y_ATTRNAME, y);

            return {
                element,
                x,
                y,
                xyArray: [x, y],
                chessPiece: null
            };
        }));
    }
    
    /**
     * 判断指定位置是否有棋子存在
     * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     * @return {boolean} 若指定位置有棋子，则返回 true，否则返回 false
     */
    hasChessPiece([x, y]) {
        return this.locationInfoArray[y][x].chessPiece ? true : false;
    }

    /**
     * 将棋子放置到棋盘的指定位置上（不校验位置信息）
     * @param {ChessPiece} chessPiece 需要放置的棋子对象
     * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     */
    putChessPieceToLocation(chessPiece, [x, y]) {
        // 将棋子放入棋盘的指定位置
        this.locationInfoArray[y][x].element.append(chessPiece.getChessPieceElement());

        // 更新 棋盘位置信息数组 对应位置的棋子对象
        this.locationInfoArray[y][x].chessPiece = chessPiece;
        // currentLocationX 不为负数，则需要解除旧的棋子引用。而该值为负数说明正在初始化棋盘，没有旧的棋子引用可以解除
        if (chessPiece.currentLocationX >= 0) {
            // 解除之前棋盘位置信息的棋子引用
            this.locationInfoArray[chessPiece.currentLocationY][chessPiece.currentLocationX].chessPiece = null;
        }

        // 更新棋子的当前位置
        chessPiece.updateCurrentLocation([x, y]);
    }

    /**
     * 将初始化棋子放置到棋盘上
     * @param {ChessPiece} chessPiece 需要放置的棋子对象
     * @return {boolean} 若成功将棋子放入棋盘内，则返回 true，否则返回 false
     */
    putInitChessPiece(chessPiece) {
        var x = parseInt(chessPiece.initLocationX, 10);
        var y = parseInt(chessPiece.initLocationY, 10);

        if (!Chessboard.checkLocationRange([x, y])) {
            return false;
        }

        if (this.hasChessPiece([x, y])) {
            console.warn("该位置(%s, %s)有棋子，请重新选择其它棋盘位置", x, y);

            return false;
        }

        this.putChessPieceToLocation(chessPiece, [x, y]);

        console.info(chessPiece.makeInfo("[$side]方棋子[$name] 成功放置至 ($x, $y) 位置"));

        return true;
    }

    /**
     * 创建棋子对象，并放置在棋盘上
     * @param {Object} options 配置对象，详情请参见 ChessPiece 类的构造器参数说明
     * @return {ChessPiece} 新创建的棋子对象
     */
    addChessPiece(options) {
        // 把棋盘自身引用 作为 参数对象的 chessboard 属性值
        options.chessboard = this;

        var chessPiece = new ChessPiece(options);

        // 将新创建的棋子放在棋盘上
        if (this.putInitChessPiece(chessPiece)) {
            // 缓存 成功放置到棋盘的棋子
            this._chessPieceArray.push(chessPiece);
        }
        else {
            console.warn(chessPiece.makeInfo("[$side]方棋子[$name] 放置在 ($x, $y) 位置失败", ChessPiece.LOCATION_TYPE_INIT));
        }

        return chessPiece;
    }

    /**
     * 初始化棋子（在棋盘上布置双方各16子）
     */
    initChessPiece() {
        Chessboard.getInitChessPieceOptionsArray()
            // 为了更好的视觉效果，先对数组排序（从上到下，从左到右）
            .sort(({location: [x1, y1]}, {location: [x2, y2]}) => ((y1 == y2) ? (x1 - x2) : (y1 - y2)))
            .forEach((options, i) => {
                // 间隔时间默认是0，即没有间隔
                let intervalMillisecond = 0;

                if (this.isNeedInitAnimat) {
                    intervalMillisecond = this.initAnimatIntervalSecond * 1e3;
                }

                setTimeout(() => {
                    this.addChessPiece(options);
                }, i * intervalMillisecond)
            });
    }

    /**
     * 移动棋子
     * @param {ChessPiece} chessPiece 需要移动的棋子对象
     * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     */
    moveChessPiece(chessPiece, xyArray) {
        chessPiece.setTargetLocation(xyArray);

        this.putChessPieceToLocation(chessPiece, xyArray);
    }

    /**
     * 根据 棋点格子容器 获取 棋点位置信息对象
     * @param {jQueryObject} element 棋点格子容器的 包装jQuery对象
     * @return {Object} 棋点位置信息对象
     */
    getLocationInfoByElement(element) {
        var x = element.attr(Chessboard.LOCATION_X_ATTRNAME);
        var y = element.attr(Chessboard.LOCATION_Y_ATTRNAME);

        return this.locationInfoArray[y][x];
    }

    /**
     * 绑定事件
     */
    bindEvent() {
        // 缓存this引用
        var chessboard = this;

        // （被点击时）激活的棋子元素
        var activeElement = null;

        // 棋子元素 点击事件
        this.container.on("click", "." + CHESSPIECE_CLASSNAME, function () {
            activeElement = $(this);

            return false;
        })
        // 棋点格子容器 点击事件
        .on("click", "." + CHESSPIECE_LOCATION_CLASSNAME, function () {
            if (!activeElement) {
                return;
            }

            // 原位置的 棋点位置信息对象
            var originLocationInfo = chessboard.getLocationInfoByElement(activeElement.parent());
            // 目标位置的 棋点位置信息对象
            var targetLocationInfo = chessboard.getLocationInfoByElement($(this));

            // 棋子移动信息
            var moveInfo = originLocationInfo.chessPiece.makeInfo("[$side]方棋子[$name] 由 ($x, $y) 位置 移动到")
                + "(" + targetLocationInfo.x + ", " + targetLocationInfo.y + ") 位置";
            
            chessboard.moveChessPiece(originLocationInfo.chessPiece, targetLocationInfo.xyArray);

            console.info(moveInfo);

            activeElement = null;
        });
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
 * 校验位置范围
 * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
 * @return {boolean} 位置范围在棋盘坐标内，则返回 true，否则返回 false
 */
Chessboard.checkLocationRange = ([x, y]) => {
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
};

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
