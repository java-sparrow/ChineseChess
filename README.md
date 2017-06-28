# 象棋程序
提供 两方对弈、胜负计时、读谱重放、单步点评等功能。

其实已经有比较不错的象棋平台了，比如 [中国象棋棋谱网](http://www.xiaqi.cn/)，也提供了诸如 读谱重放、单步点评等功能（[戳这里观摩](http://www.xiaqi.cn/201110/16310.html)），但是平台尚未加入象棋规则，所以没有对落子位置加以限制。

## 为什么折腾这个项目

* 小时候对象棋有兴趣
* 2013年也曾想过做一个这样的平台，但那时刚从事前端，技术水平Hold不住
* 有足够多的js可以写
* 体现技术水平？

## 目前支持的功能
* 棋盘样式及棋子样式
* 棋盘初始化（放置32个棋子，可以设置开启动画）
* 棋子移动功能（各种棋子都有完整的移动规则限制，也可以吃对方棋子）
* 棋子激活时，有发光状态，且有移动范围及打击范围提示
* 控制台日志输出

## 后续功能
* [x] 完善其它棋子移动规则
* [ ] “将”、“帅”不能面对面
* [ ] 双方棋子交替行走
* [ ] 终局胜负自动判断
* [ ] 将控制台日志 输出到页面上
* [ ] 计时功能
* [ ] 支持键盘快捷键操作
* [ ] UI改善
    * [x] 激活棋子的样式
    * [ ] 加入象棋规则提示（显示棋子被限制移动的原因）
    * [ ] 显示标准棋盘坐标（1 \~ 9、九 \~ 一）
    * [ ] 可视化自定义棋局
    * [ ] 单步点评
    * [ ] 增加棋子信息展示（如 特定位置的该棋子术语：骑河车、屏风马、仕角炮）
    * [ ] 对象棋杀招进行提示：马后炮、天地炮（后面还可以扩展为 成就）
* [ ] 棋谱相关
    * [ ] 落子时显示棋谱步骤
    * [ ] 记录整局棋谱 并支持导入导出
    * [ ] 读谱重放
* [ ] 代码质量
    * [ ] 增加小工具方法，减少间接获取数据的操作（用方法调用代替强逻辑操作）
    * [ ] 增加数据对象类，方便文档之间的 @see 链接跳转
    * [ ] 文件拆分
    * [ ] 项目构建配置
    * [ ] 单元测试
* [ ] 在线对弈平台？

## 最后
* 欢迎在这里点评代码
* 发现BUG 或 有新idea，赶紧提 Issues~
