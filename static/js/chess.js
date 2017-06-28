// 样式类名
const CHESSBOARD_CONTAINER_CLASSNAME = "chessboard-container";
const CHESSBOARD_ROW_CLASSNAME = "chessboard-row";
const CHESSPIECE_LOCATION_CLASSNAME = "chess-pieces-location";
const CHESSPIECE_LOCATION_LASTROW_CLASSNAME = "chess-pieces-location--row-last";
const CHESSPIECE_LOCATION_MOVEABLE_CLASSNAME = "chess-pieces-location--moveable";
const CHESSPIECE_LOCATION_KILLABLE_CLASSNAME = "chess-pieces-location--killable";
const CHESSPIECE_CLASSNAME = "chess-pieces";
const CHESSPIECE_ACTIVE_CLASSNAME = "chess-pieces--active";

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

        // 棋子未移动时，上一个目标位置为-1
        this.previousLocationX = -1;
        this.previousLocationY = -1;
    }

    /**
     * 获取棋子元素
     * @return {jQueryObject} 棋子元素
     */
    getChessPieceElement() {
        return this.chessPieceElement;
    }

    /**
     * 更新棋子的当前位置信息（会自动保存棋子的上一个位置）
     * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     */
    updateCurrentLocation([x, y]) {
        // 先保存棋子的上一个位置
        this.setPreviousLocation([this.currentLocationX, this.currentLocationY]);
        
        // 再更新棋子的当前位置
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
     * 设置棋子的上一个位置信息
     * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     */
    setPreviousLocation([x, y]) {
        this.previousLocationX = x;
        this.previousLocationY = y;
    }

    /**
     * 目标位置是否有改变（与当前位置不同）
     * @return {boolean} 若棋子的目标位置与当前位置不同，是则返回 true，否则返回 false
     */
    isTargetLocationChange() {
        return !((this.targetLocationX === this.currentLocationX) && (this.targetLocationY === this.currentLocationY));
    }

    /**
     * 制作棋子信息字符串，用于打印输出棋子信息。
     * 字符串内支持 $side, $name, $x, $y 变量。
     * 其中，位置信息的类型 由第二个参数指定（初始化位置、当前位置、目标位置），默认使用 当前位置类型
     * @param {String} info 信息字符串，可使用 $side, $name, $x, $y 这几个变量
     * @param {String} locationType 位置类型，可枚举值为 ChessPiece.LOCATION_TYPE_INIT, ChessPiece.LOCATION_TYPE_CURRENT, ChessPiece.LOCATION_TYPE_TARGET, ChessPiece.LOCATION_TYPE_PREVIOUS
     * @return {String} 已替换变量信息的字符串
     */
    makeInfo(info, locationType) {
        var locationTypeName = ({
            [ChessPiece.LOCATION_TYPE_INIT]: ChessPiece.LOCATION_TYPE_INIT,
            [ChessPiece.LOCATION_TYPE_CURRENT]: ChessPiece.LOCATION_TYPE_CURRENT,
            [ChessPiece.LOCATION_TYPE_TARGET]: ChessPiece.LOCATION_TYPE_TARGET,
            [ChessPiece.LOCATION_TYPE_PREVIOUS]: ChessPiece.LOCATION_TYPE_PREVIOUS
        // 从Map对象中 获取对应位置类型。若没有对应位置类型，则默认使用 当前位置类型
        })[locationType] || ChessPiece.LOCATION_TYPE_CURRENT;

        return info.replace("$side", this.playSide.toString())
            .replace("$name", this.character)
            .replace("$x", this[locationTypeName + "LocationX"])
            .replace("$y", this[locationTypeName + "LocationY"]);
    }

    /**
     * 比较棋子名称是否相等（与阵营无关，如“象”等于“相”）
     * @param {String} character 要比较的棋子名称
     * @return {boolean} 如果棋子名称相同（与阵营无关，如“象”等于“相”），则返回 true，否则返回 false
     */
    equalCharacter(character) {
        return (this.character === character) || (this.character === ChessPiece.getSecondCharacter(character));
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
ChessPiece.LOCATION_TYPE_PREVIOUS = "previous";

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
     * 获取棋盘指定位置的棋子
     * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     * @return {ChessPiece} 棋子对象。若 指定位置不在棋盘范围内 或 指定位置没有棋子，则返回 null
     */
    getChessPiece([x, y]) {
        // 范围溢出则返回 null
        if (!Chessboard.checkLocationRange([x, y])) {
            return null;
        }

        return this.locationInfoArray[y][x].chessPiece;
    }
    
    /**
     * 判断指定位置是否有棋子存在
     * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     * @return {boolean} 若指定位置有棋子，则返回 true，否则返回 false
     */
    hasChessPiece(xyArray) {
        return this.getChessPiece(xyArray) ? true : false;
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
            let previousLocationX = chessPiece.currentLocationX;
            let previousLocationY = chessPiece.currentLocationY;

            // 解除之前棋盘位置信息的棋子引用
            this.locationInfoArray[previousLocationY][previousLocationX].chessPiece = null;
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
     * 从棋盘上的指定位置 移除棋子
     * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     * @return {boolean} 若成功移除棋子，则返回 true，否则返回 false（仅在位置范围溢出 或 指定位置没有棋子时，返回 false）
     */
    removeChessPieceFromLocation([x, y]) {
        // 范围溢出则不处理
        if (!Chessboard.checkLocationRange([x, y])) {
            return false;
        }

        // 指定位置没有棋子，也不处理
        if (!this.hasChessPiece([x, y])) {
            return false;
        }

        // 棋盘位置信息对象
        var locationInfo = this.locationInfoArray[y][x];
        
        // 将棋子从棋盘上移除
        locationInfo.chessPiece.getChessPieceElement().remove();
        // 解除棋子对棋盘的引用
        locationInfo.chessPiece.chessboard = null;
        // 解除棋盘位置信息数组 对应位置的棋子对象引用
        locationInfo.chessPiece = null;

        return true;
    }

    /**
     * 根据纵坐标值（通常是棋子的初始化纵坐标值）获取己方领地纵坐标值范围
     * @param {number} y 纵坐标值
     * @return {Object} 一个包含 min 和 max 属性的对象。若参数y值不在棋盘范围内，则 min 和 max 的值均为 -1
     */
    getTerritoryAreaByLocation(y) {
        var minY = -1;
        var maxY = -1;

        if (y >= 0 && y <= 4) {
            minY = 0;
            maxY = 4;
        }
        else if (y >= 5 && y <= 9) {
            minY = 5;
            maxY = 9;
        }

        return {
            min: minY,
            max: maxY
        };
    }

    /**
     * 获取指定棋子的领地纵坐标值范围
     * @param {ChessPiece} chessPiece 需要获取领地纵坐标值范围 的棋子对象
     * @return {Object} 一个包含 min 和 max 属性的对象。若参数y值不在棋盘范围内，则 min 和 max 的值均为 -1
     */
    getTerritoryAreaByChessPiece(chessPiece) {
        return this.getTerritoryAreaByLocation(chessPiece.initLocationY);
    }

    /**
     * 判断目标位置（仅需要纵坐标值）是否在己方领地（未过河）
     * @param {ChessPiece} chessPiece 用于判断领地范围的棋子对象
     * @param {number} y 纵坐标值
     * @return {boolean} 目标位置的纵坐标值在己方领地则返回 true，否则返回 false
     */
    isTargetLocationInTerritoryArea(chessPiece, y) {
        y = y || chessPiece.targetLocationY;

        var rangeObject = this.getTerritoryAreaByChessPiece(chessPiece);

        return ((y >= rangeObject.min) && (y <= rangeObject.max));
    }

    /**
     * 获取指定棋子对象的可移动范围数据
     * @param {ChessPiece} chessPiece 需要获取移动范围的棋子对象
     * @return {Object} 包含 moveableLocationArray 和 killableLocationArray 两个属性的对象。目前仅完整支持“车”类型的棋子数据，其它类型棋子支持不完善
     */
    getChessPieceMoveableData(chessPiece) {
        /**
         * 获取指定位置的信息：是否有棋子、有己方棋子、有对方棋子
         * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
         * @return {Object} 位置信息，包含 isEmpty、hasOtherSideChessPiece、hasOwnSideChessPiece 三个属性的对象
         */
        var getLocationInfo = (xyArray) => {
            var tempChessPiece = this.getChessPiece(xyArray);

            var isEmpty = false;
            var hasOtherSideChessPiece = false;
            var hasOwnSideChessPiece = false;

            // 没有棋子说明 该位置属于空位
            if (!tempChessPiece) {
                isEmpty = true;
            }
            // 有棋子，则判断是己方还是对方
            else {
                // 该位置有对方棋子
                if (tempChessPiece.playSide.toString() != chessPiece.playSide.toString()) {
                    hasOtherSideChessPiece = true;
                }
                // 该位置有己方棋子
                else {
                    hasOwnSideChessPiece = true;
                }
            }

            return {
                isEmpty,
                hasOtherSideChessPiece,
                hasOwnSideChessPiece
            };
        };

        /**
         * 创建可移动范围数据对象，返回值包含 可移动位置数组 及 可攻击位置数组（后者是前者的子集）
         * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
         * @param {number} n 第一种增量，将作用于x或y。建议该值为非0。
         * @param {number} m 第二种增量，将作用于x或y
         * @param {boolean} isIncreaseOnce 是否仅对 x、y 坐标增长一次（只有“车”、“炮”在同一方向上可以有多个坐标变换，其它棋子在一个方向上只能有一次坐标变换）
         * @return {Object} 包含 moveableLocationArray 和 killableLocationArray 两个属性的对象
         */
        var makeMoveableLocationInfo = ([x, y], n, m, isIncreaseOnce) => {
            var moveableLocationResultArray = [];
            var killableLocationResultArray = [];

            // 根据 x、y 的增量，生成一个新的位置数组
            var createLocationArrayByIncrement = (xIncrement, yIncrement) => {
                let tempX = x;
                let tempY = y;

                while (true) {
                    tempX += xIncrement;
                    tempY += yIncrement;

                    let xyArray = [tempX, tempY];

                    // 若目标位置超出棋盘范围，则结束循环
                    if (!Chessboard.isLocationInChessboard(xyArray)) {
                        break;
                    }

                    let locationInfo = getLocationInfo(xyArray);

                    // 没有棋子说明 该位置属于可移动范围
                    if (locationInfo.isEmpty) {
                        moveableLocationResultArray.push(xyArray);
                    }
                    // 有棋子，则判断是己方还是对方
                    else {
                        // 如果是对方棋子，可以操作
                        if (locationInfo.hasOtherSideChessPiece) {
                            killableLocationResultArray.push(xyArray);
                            // 对方的棋子可以吃掉，所以该位置也是可移动范围
                            moveableLocationResultArray.push(xyArray);
                        }

                        // 有（对方或己方）棋子阻塞，则结束循环
                        break;
                    }

                    // 如果仅需增长一次，则不进入下次循环
                    if (isIncreaseOnce) {
                        break;
                    }
                }
            };

            // 下面假设 n 不为 0，若 m 有值为 0，则通过判断去掉重复的操作
            createLocationArrayByIncrement(n, m);
            createLocationArrayByIncrement(-n, m);
            if (m !== 0) {
                createLocationArrayByIncrement(n, -m);
                createLocationArrayByIncrement(-n, -m);
            }
            // 当 n、m 值不相等时，需要交换增量位置继续操作
            if (m !== n) {
                createLocationArrayByIncrement(m, n);
                createLocationArrayByIncrement(m, -n);
                if (m !== 0) {
                    createLocationArrayByIncrement(-m, n);
                    createLocationArrayByIncrement(-m, -n);
                }
            }

            return {
                moveableLocationArray: moveableLocationResultArray,
                killableLocationArray: killableLocationResultArray
            };
        };

        // isTargetLocationInTerritoryArea 的快捷方式
        var isYInTerritoryArea = (
            y => this.isTargetLocationInTerritoryArea(chessPiece, y)
        );
        // isYInTerritoryArea 的快捷方式
        var isXYInTerritoryArea = (
            ([x, y]) => isYInTerritoryArea(y)
        );
        // 判断 指定位置信息 是否在九宫范围内（九宫范围与棋子所处领地有关）
        var isInNineGridArea = (() => {
            // 因为同一棋子的 nineGridArea 是相同的，所以使用闭包缓存 nineGridArea 变量
            var nineGridArea = Chessboard.getNineGridArea(chessPiece.initLocationY);

            return ([x, y]) => (
                (x >= nineGridArea.minX) && (x <= nineGridArea.maxX) && (y >= nineGridArea.minY) && (y <= nineGridArea.maxY)
            );
        })();

        /**
         * 创建 “炮”的可移动范围数据对象，返回值包含 可移动位置数组 及 可攻击位置数组（后者是前者的子集）
         *  TODO: 抽象 createLocationArrayByIncrement 方法，使之与 makeMoveableLocationInfo 的内部方法能合并重用
         * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
         * @return {Object} 包含 moveableLocationArray 和 killableLocationArray 两个属性的对象
         */
        var makeCannonsMoveableLocationInfo = ([x, y]) => {
            var moveableLocationResultArray = [];
            var killableLocationResultArray = [];

            // 根据 x、y 的增量，生成一个新的位置数组
            var createLocationArrayByIncrement = (xIncrement, yIncrement) => {
                var tempX = x;
                var tempY = y;
                // “隔子”标志：是否有棋子在中间（炮吃子需要间隔一个棋子）
                var hasChessPieceInMiddleFlag = false;

                while (true) {
                    tempX += xIncrement;
                    tempY += yIncrement;

                    let xyArray = [tempX, tempY];

                    // 若目标位置超出棋盘范围，则结束循环
                    if (!Chessboard.isLocationInChessboard(xyArray)) {
                        break;
                    }

                    let locationInfo = getLocationInfo(xyArray);

                    // 没有棋子在中间的话，添加可移动范围
                    if (!hasChessPieceInMiddleFlag) {
                        // 没有棋子说明 该位置属于可移动范围
                        if (locationInfo.isEmpty) {
                            moveableLocationResultArray.push(xyArray);
                        }
                        // 有棋子间隔，则设置“隔子”标志
                        else {
                            hasChessPieceInMiddleFlag = true;
                        }
                    }
                    // 有棋子在中间的话，添加攻击范围
                    else {
                        // 如果是对方棋子，可以操作
                        if (locationInfo.hasOtherSideChessPiece) {
                            killableLocationResultArray.push(xyArray);
                            // 对方的棋子可以吃掉，所以该位置也是可移动范围
                            moveableLocationResultArray.push(xyArray);

                            break;
                        }
                        // 如果隔着棋子遇到己方棋子，则应该结束本次“位置探索”（结束循环）
                        else if (locationInfo.hasOwnSideChessPiece) {
                            break;
                        }
                        // else 如果没有棋子，也不能移动。因为炮可以隔着棋子吃子，但不能隔着棋子移动
                    }
                }
            };

            // 炮是水平或垂直移动
            createLocationArrayByIncrement(1, 0);
            createLocationArrayByIncrement(-1, 0);
            createLocationArrayByIncrement(0, 1);
            createLocationArrayByIncrement(0, -1);

            return {
                moveableLocationArray: moveableLocationResultArray,
                killableLocationArray: killableLocationResultArray
            };
        };

        /**
         * 过滤位置数组，用于最后的范围限定，如 象不能过河、兵不能后退、将士不能出九宫
         * @param {Object} moveableLocationInfo 包含 moveableLocationArray 和 killableLocationArray 两个属性的对象
         * @param {function(Array):boolean} filterHandler 过滤逻辑
         * @return {Object} 包含 moveableLocationArray 和 killableLocationArray 两个属性的（应用 过滤逻辑 处理后）对象
         */
        var filterLocationArray = ({moveableLocationArray, killableLocationArray}, filterHandler) => ({
            moveableLocationArray: moveableLocationArray.filter(filterHandler),
            killableLocationArray: killableLocationArray.filter(filterHandler)
        });

        var moveableLocationInfo = null;
        var currentLocationX = chessPiece.currentLocationX;
        var currentLocationY = chessPiece.currentLocationY;
        var currentXY = [currentLocationX, currentLocationY];

        // 棋子“车”的可移动范围数据
        if (chessPiece.equalCharacter(ChessPiece.CHARACTER_ROOKS)) {
            moveableLocationInfo = makeMoveableLocationInfo(currentXY, 1, 0);
        }
        // 棋子“象”的可移动范围数据
        else if (chessPiece.equalCharacter(ChessPiece.CHARACTER_ELEPHANTS)) {
            moveableLocationInfo = makeMoveableLocationInfo(currentXY, 2, 2, true);
            // 过滤逻辑：象不能过河
            moveableLocationInfo = filterLocationArray(moveableLocationInfo, isXYInTerritoryArea);
            // 过滤逻辑：“堵象眼”
            moveableLocationInfo = filterLocationArray(moveableLocationInfo, ([x, y]) => {
                // “象眼”位置为 棋子当前坐标与目标坐标 的中间位置，所以分别计算 水平和垂直坐标 的平均值即可得到
                var elephantEyeLocation = [(currentLocationX + x) / 2, (currentLocationY + y) / 2];
                
                // 如果“象眼”位置没有棋子，则目标位置可以移动
                return getLocationInfo(elephantEyeLocation).isEmpty;
            });
        }
        // 棋子“马”的可移动范围数据
        else if (chessPiece.equalCharacter(ChessPiece.CHARACTER_KNIGHTS)) {
            moveableLocationInfo = makeMoveableLocationInfo(currentXY, 1, 2, true);
            // 过滤逻辑：“绊马脚”
            moveableLocationInfo = filterLocationArray(moveableLocationInfo, ([x, y]) => {
                var horseFootLocation = [-1, -1];

                // “马脚”位置为 棋子坐标增量为 2 的方向上，与棋子相邻的位置（即其中一个方向坐标 取同方向当前位置和目标位置的平均值，另一个方向坐标 与同方向当前位置相同）
                if (Math.abs(currentLocationX - x) == 2) {
                    horseFootLocation = [(currentLocationX + x) / 2, currentLocationY];
                }
                else if (Math.abs(currentLocationY - y) == 2) {
                    horseFootLocation = [currentLocationX, (currentLocationY + y) / 2];
                }
                
                // 如果“马脚”位置没有棋子，则目标位置可以移动
                return getLocationInfo(horseFootLocation).isEmpty;
            });
        }
        // 棋子“将”的可移动范围数据
        else if (chessPiece.equalCharacter(ChessPiece.CHARACTER_KING)) {
            moveableLocationInfo = makeMoveableLocationInfo(currentXY, 1, 0, true);
            // 过滤逻辑：移动范围不能超出九宫
            moveableLocationInfo = filterLocationArray(moveableLocationInfo, isInNineGridArea);
        }
        // 棋子“士”的可移动范围数据
        else if (chessPiece.equalCharacter(ChessPiece.CHARACTER_GUARDS)) {
            moveableLocationInfo = makeMoveableLocationInfo(currentXY, 1, 1, true);
            // 过滤逻辑：移动范围不能超出九宫
            moveableLocationInfo = filterLocationArray(moveableLocationInfo, isInNineGridArea);
        }
        // 棋子“炮”的可移动范围数据
        else if (chessPiece.equalCharacter(ChessPiece.CHARACTER_CANNONS)) {
            moveableLocationInfo = makeCannonsMoveableLocationInfo(currentXY);
        }
        // 棋子“兵”的可移动范围数据
        else if (chessPiece.equalCharacter(ChessPiece.CHARACTER_SOLDIERS)) {
            moveableLocationInfo = makeMoveableLocationInfo(currentXY, 1, 0, true);

            // 过滤逻辑：兵只能前进，不能后退
            moveableLocationInfo = filterLocationArray(moveableLocationInfo, (
                // Chessboard.getMoveDirection 返回值大于 0 则为前进方向，等于 0 为 平移
                ([x, y]) => (Chessboard.getMoveDirection(chessPiece, y) >= 0)
            ));
            // 过滤逻辑：兵未过河时 不能平移
            moveableLocationInfo = filterLocationArray(moveableLocationInfo, (
                // 在己方领地（未过河）时，兵不能平移。在对方领地（已过河），兵可以平移
                ([x, y]) => (isYInTerritoryArea(currentLocationY) ? (y != currentLocationY) : true)
            ));
        }

        return moveableLocationInfo;
    }

    /**
     * 移动棋子
     * @param {ChessPiece} chessPiece 需要移动的棋子对象
     * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
     * @return {boolean} 移动棋子成功则返回 true，否则返回 false
     */
    moveChessPiece(chessPiece, xyArray) {
        chessPiece.setTargetLocation(xyArray);

        // 位置没有发生变化，不处理
        if (!chessPiece.isTargetLocationChange()) {
            return false;
        }

        // 获取目标棋点位置的棋子（若有的话）
        var existChessPiece = this.getChessPiece(xyArray);
        // 目标棋点位置有己方棋子，则输出提醒信息并返回
        if (existChessPiece && (existChessPiece.playSide.toString() == chessPiece.playSide.toString())) {
            console.warn(existChessPiece.makeInfo("($x, $y) 位置有己方棋子[$name]，无法移动"));

            return false;
        }
        // 若目标棋点位置有对方棋子，则吃掉对方棋子
        else if (existChessPiece) {
            this.removeChessPieceFromLocation(xyArray);
            
            console.info(chessPiece.makeInfo("原位置 ($x, $y) 的己方棋子[$name] 吃掉位于 ") + existChessPiece.makeInfo("($x, $y) 位置的对方棋子[$name]"));
        }

        this.putChessPieceToLocation(chessPiece, xyArray);

        return true;
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
     * 根据位置数组中的 指定位置信息 添加 指定样式类名
     * @param {Array} locationArray 存放位置数组的数组，数组的每一个元素，都是一个 xyArray 类型的数组
     * @param {String} className 样式类名，如果有多个样式类名需要添加，可以以空格隔开的形式组成字符串
     */
    addClassNameToLocationElement(locationArray = [], className) {
        locationArray.forEach(([x, y]) => {
            this.locationInfoArray[y][x].element.addClass(className);
        });
    }

    /**
     * 清除棋盘上的状态样式类名（除了内置的样式类名清除列表，还可以附加额外的样式类名列表）
     * @param {Array<String>} classNameArray 额外的样式类名数组
     */
    clearStatusClassName(classNameArray = []) {
        // 需要删除的类名列表
        var clearClassNameArray = [
            // 默认需要清除的状态类名
            CHESSPIECE_LOCATION_MOVEABLE_CLASSNAME,
            CHESSPIECE_LOCATION_KILLABLE_CLASSNAME
        // 合并 参数指定的额外类名列表
        ].concat(classNameArray);
        // jQuery 支持空格隔开的多个 className 操作
        var clearClassNames = clearClassNameArray.join(" ");

        // 遍历二维数组并删除 状态类名列表中的全部类名
        this.locationInfoArray.forEach((locationInfoRowArray, y) => {
            locationInfoRowArray.forEach((locationInfo, x) => {
                locationInfo.element.removeClass(clearClassNames);
            });
        });
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
            // 已有激活棋子时，不激活被点击的其它棋子，并让事件继续冒泡到棋点格子容器处理（可能是吃子）
            if (activeElement) {
                // 棋子激活时，再次点击自身 可以取消 自身的激活状态
                if (activeElement[0] === this) {
                    // 去掉激活样式类
                    activeElement.removeClass(CHESSPIECE_ACTIVE_CLASSNAME);

                    activeElement = null;
                    // 取消自身的激活状态之后，清除状态指示样式类名
                    chessboard.clearStatusClassName();

                    console.info(chessboard.getLocationInfoByElement($(this).parent()).chessPiece.makeInfo(
                        "[$side]方棋子[$name] ($x, $y) 取消激活"
                    ));
                }
                
                return;
            }
            
            activeElement = $(this);
            // 添加激活样式类
            activeElement.addClass(CHESSPIECE_ACTIVE_CLASSNAME);

            var locationInfo = chessboard.getLocationInfoByElement(activeElement.parent());
            var moveableData = chessboard.getChessPieceMoveableData(locationInfo.chessPiece);
            // 如果有移动范围数据，则添加对应的样式类名
            if (moveableData) {
                chessboard.addClassNameToLocationElement(moveableData.moveableLocationArray, CHESSPIECE_LOCATION_MOVEABLE_CLASSNAME);
                chessboard.addClassNameToLocationElement(moveableData.killableLocationArray, CHESSPIECE_LOCATION_KILLABLE_CLASSNAME);
            }
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
            // 缓存 原位置的棋子对象
            var originChessPiece = originLocationInfo.chessPiece;

            // 当点击的不是激活棋子自身时，判断落子位置是否属于有效的移动范围
            if ((originLocationInfo !== targetLocationInfo)) {
                // 移动范围有效性检测。TODO: 这里偷懒直接使用样式类判断，待重构
                if (!targetLocationInfo.element.hasClass(CHESSPIECE_LOCATION_MOVEABLE_CLASSNAME)) {
                    console.warn(originChessPiece.makeInfo("[$side]方棋子[$name] 选择的目标位置，不在可移动的范围内"));
                    return;
                }
            }

            // 移动失败，则停止处理。允许继续选择下一个位置移动（因为没有将 activeElement 设置为 null）
            if (!chessboard.moveChessPiece(originLocationInfo.chessPiece, targetLocationInfo.xyArray)) {
                return;
            }

            // 棋子移动信息
            var moveInfo = targetLocationInfo.chessPiece.makeInfo("[$side]方棋子[$name] 由 ($x, $y) 位置 移动到", ChessPiece.LOCATION_TYPE_PREVIOUS)
                + targetLocationInfo.chessPiece.makeInfo(" ($x, $y) 位置", ChessPiece.LOCATION_TYPE_TARGET);
            console.info(moveInfo);

            // 去掉激活样式类
            activeElement.removeClass(CHESSPIECE_ACTIVE_CLASSNAME);
            
            activeElement = null;
            // 落子之后，清除状态指示样式类名
            chessboard.clearStatusClassName();
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
 * 判断坐标位置是否在棋盘上，等同于 Chessboard.checkLocationRange ，但不打印提示信息
 * @param {Array} xyArray 位置数组，第一个元素为横坐标值，第二个元素为纵坐标值
 * @return {boolean} 位置范围在棋盘坐标内，则返回 true，否则返回 false
 */
Chessboard.isLocationInChessboard = ([x, y]) => (
    (x >= 0) && (x <= 8) && (y >= 0) && (y <= 9)
);

/**
 * 根据 棋子初始化位置的纵坐标值，获取九宫范围
 * @param {number} initLocationY 棋子初始化位置的纵坐标值
 * @return {Object} 包含 minX、maxX、minY、maxY 属性的对象
 */
Chessboard.getNineGridArea = initLocationY => {
    var minY = -1;
    var maxY = -1;

    // 根据棋子初始化位置的纵坐标值，计算九宫纵坐标值范围
    if ((initLocationY >= 0) && (initLocationY <= 4)) {
        minY = 0;
        maxY = 2;
    }
    else if ((initLocationY >= 5) && (initLocationY <= 9)) {
        minY = 7;
        maxY = 9;
    }

    return {
        // 横坐标为固定范围，不需要额外计算
        minX: 3,
        maxX: 5,
        minY,
        maxY
    }
};

/**
 * 获取棋子的移动方向，用以判断棋子 前进、后退、平移
 * @param {ChessPiece} chessPiece 棋子对象
 * @param {number} targetLocationY 目标位置的纵坐标
 * @return {number} 0 则表示平移。（已考虑棋子的进攻方向）大于 0 说明棋子向前进，小于 0 说明棋子向后退
 */
Chessboard.getMoveDirection = (chessPiece, targetLocationY) => {
    var currentLocationY = chessPiece.currentLocationY;
    // 纵坐标相等，则直接返回 0
    if (currentLocationY == targetLocationY) {
        return 0;
    }

    var diffY = targetLocationY - currentLocationY;
    // 默认情况下，棋子前进时纵坐标值变大。而当棋子初始化纵坐标为 5~9 时，说明 棋子前进时 纵坐标值变小，此时需要反转前进方向
    var isReverseForwardDirection = (chessPiece.initLocationY >= 5);

    // 根据前进方向，返回 纵坐标差值（或差值的相反数）
    return isReverseForwardDirection ? -diffY : diffY;
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
