import browser from './browser.js';
import utils from './utils.js';
import dtd from './dtd.js';

function getDomNode(node, start, ltr, startFromChild, fn, guard) {
  var tmpNode = startFromChild && node[start],
    parent;
  !tmpNode && (tmpNode = node[ltr]);
  while (!tmpNode && (parent = (parent || node).parentNode)) {
    if (parent.tagName == "BODY" || (guard && !guard(parent))) {
      return null;
    }
    tmpNode = parent[ltr];
  }
  if (tmpNode && fn && !fn(tmpNode)) {
    return getDomNode(tmpNode, start, ltr, false, fn);
  }
  return tmpNode;
}
var attrFix = {
  tabindex: "tabIndex",
  readonly: "readOnly"
},
  styleBlock = utils.listToMap([
    "-webkit-box",
    "-moz-box",
    "block",
    "list-item",
    "table",
    "table-row-group",
    "table-header-group",
    "table-footer-group",
    "table-row",
    "table-column-group",
    "table-column",
    "table-cell",
    "table-caption"
  ]);
var domUtils = ({
  //节点常量
  NODE_ELEMENT: 1,
  NODE_DOCUMENT: 9,
  NODE_TEXT: 3,
  NODE_COMMENT: 8,
  NODE_DOCUMENT_FRAGMENT: 11,

  //位置关系
  POSITION_IDENTICAL: 0,
  POSITION_DISCONNECTED: 1,
  POSITION_FOLLOWING: 2,
  POSITION_PRECEDING: 4,
  POSITION_IS_CONTAINED: 8,
  POSITION_CONTAINS: 16,
  //ie6使用其他的会有一段空白出现
  fillChar: "\u200B",
  //-------------------------Node部分--------------------------------
  keys: {
/*Backspace*/ 8: 1,
/*Delete*/ 46: 1,
/*Shift*/ 16: 1,
/*Ctrl*/ 17: 1,
/*Alt*/ 18: 1,
    37: 1,
    38: 1,
    39: 1,
    40: 1,
    13: 1 /*enter*/
  },
  /**
     * 获取节点A相对于节点B的位置关系
     * @method getPosition
     * @param { Node } nodeA 需要查询位置关系的节点A
     * @param { Node } nodeB 需要查询位置关系的节点B
     * @return { Number } 节点A与节点B的关系
     * @example
     * ```javascript
     * //output: 20
     * var position = UE.dom.domUtils.getPosition( document.documentElement, document.body );
     *
     * switch ( position ) {
     *
     *      //0
     *      case UE.dom.domUtils.POSITION_IDENTICAL:
     *          console.log('元素相同');
     *          break;
     *      //1
     *      case UE.dom.domUtils.POSITION_DISCONNECTED:
     *          console.log('两个节点在不同的文档中');
     *          break;
     *      //2
     *      case UE.dom.domUtils.POSITION_FOLLOWING:
     *          console.log('节点A在节点B之后');
     *          break;
     *      //4
     *      case UE.dom.domUtils.POSITION_PRECEDING;
     *          console.log('节点A在节点B之前');
     *          break;
     *      //8
     *      case UE.dom.domUtils.POSITION_IS_CONTAINED:
     *          console.log('节点A被节点B包含');
     *          break;
     *      case 10:
     *          console.log('节点A被节点B包含且节点A在节点B之后');
     *          break;
     *      //16
     *      case UE.dom.domUtils.POSITION_CONTAINS:
     *          console.log('节点A包含节点B');
     *          break;
     *      case 20:
     *          console.log('节点A包含节点B且节点A在节点B之前');
     *          break;
     *
     * }
     * ```
     */
  getPosition: function (nodeA, nodeB) {
    // 如果两个节点是同一个节点
    if (nodeA === nodeB) {
      // domUtils.POSITION_IDENTICAL
      return 0;
    }
    var node,
      parentsA = [nodeA],
      parentsB = [nodeB];
    node = nodeA;
    while ((node = node.parentNode)) {
      // 如果nodeB是nodeA的祖先节点
      if (node === nodeB) {
        // domUtils.POSITION_IS_CONTAINED + domUtils.POSITION_FOLLOWING
        return 10;
      }
      parentsA.push(node);
    }
    node = nodeB;
    while ((node = node.parentNode)) {
      // 如果nodeA是nodeB的祖先节点
      if (node === nodeA) {
        // domUtils.POSITION_CONTAINS + domUtils.POSITION_PRECEDING
        return 20;
      }
      parentsB.push(node);
    }
    parentsA.reverse();
    parentsB.reverse();
    if (parentsA[0] !== parentsB[0]) {
      // domUtils.POSITION_DISCONNECTED
      return 1;
    }
    var i = -1;
    while ((i++ , parentsA[i] === parentsB[i])) { }
    nodeA = parentsA[i];
    nodeB = parentsB[i];
    while ((nodeA = nodeA.nextSibling)) {
      if (nodeA === nodeB) {
        // domUtils.POSITION_PRECEDING
        return 4;
      }
    }
    // domUtils.POSITION_FOLLOWING
    return 2;
  },

  /**
     * 检测节点node在父节点中的索引位置
     * @method getNodeIndex
     * @param { Node } node 需要检测的节点对象
     * @return { Number } 该节点在父节点中的位置
     * @see UE.dom.domUtils.getNodeIndex(Node,Boolean)
     */

  /**
     * 检测节点node在父节点中的索引位置， 根据给定的mergeTextNode参数决定是否要合并多个连续的文本节点为一个节点
     * @method getNodeIndex
     * @param { Node } node 需要检测的节点对象
     * @param { Boolean } mergeTextNode 是否合并多个连续的文本节点为一个节点
     * @return { Number } 该节点在父节点中的位置
     * @example
     * ```javascript
     *
     *      var node = document.createElement("div");
     *
     *      node.appendChild( document.createTextNode( "hello" ) );
     *      node.appendChild( document.createTextNode( "world" ) );
     *      node.appendChild( node = document.createElement( "div" ) );
     *
     *      //output: 2
     *      console.log( UE.dom.domUtils.getNodeIndex( node ) );
     *
     *      //output: 1
     *      console.log( UE.dom.domUtils.getNodeIndex( node, true ) );
     *
     * ```
     */
  getNodeIndex: function (node, ignoreTextNode) {
    var preNode = node,
      i = 0;
    while ((preNode = preNode.previousSibling)) {
      if (ignoreTextNode && preNode.nodeType == 3) {
        if (preNode.nodeType != preNode.nextSibling.nodeType) {
          i++;
        }
        continue;
      }
      i++;
    }
    return i;
  },

  /**
     * 检测节点node是否在给定的document对象上
     * @method inDoc
     * @param { Node } node 需要检测的节点对象
     * @param { DomDocument } doc 需要检测的document对象
     * @return { Boolean } 该节点node是否在给定的document的dom树上
     * @example
     * ```javascript
     *
     * var node = document.createElement("div");
     *
     * //output: false
     * console.log( UE.do.domUtils.inDoc( node, document ) );
     *
     * document.body.appendChild( node );
     *
     * //output: true
     * console.log( UE.do.domUtils.inDoc( node, document ) );
     *
     * ```
     */
  inDoc: function (node, doc) {
    return domUtils.getPosition(node, doc) == 10;
  },
  /**
     * 根据给定的过滤规则filterFn， 查找符合该过滤规则的node节点的第一个祖先节点，
     * 查找的起点是给定node节点的父节点。
     * @method findParent
     * @param { Node } node 需要查找的节点
     * @param { Function } filterFn 自定义的过滤方法。
     * @warning 查找的终点是到body节点为止
     * @remind 自定义的过滤方法filterFn接受一个Node对象作为参数， 该对象代表当前执行检测的祖先节点。 如果该
     *          节点满足过滤条件， 则要求返回true， 这时将直接返回该节点作为findParent()的结果， 否则， 请返回false。
     * @return { Node | Null } 如果找到符合过滤条件的节点， 就返回该节点， 否则返回NULL
     * @example
     * ```javascript
     * var filterNode = UE.dom.domUtils.findParent( document.body.firstChild, function ( node ) {
     *
     *     //由于查找的终点是body节点， 所以永远也不会匹配当前过滤器的条件， 即这里永远会返回false
     *     return node.tagName === "HTML";
     *
     * } );
     *
     * //output: true
     * console.log( filterNode === null );
     * ```
     */

  /**
     * 根据给定的过滤规则filterFn， 查找符合该过滤规则的node节点的第一个祖先节点，
     * 如果includeSelf的值为true，则查找的起点是给定的节点node， 否则， 起点是node的父节点
     * @method findParent
     * @param { Node } node 需要查找的节点
     * @param { Function } filterFn 自定义的过滤方法。
     * @param { Boolean } includeSelf 查找过程是否包含自身
     * @warning 查找的终点是到body节点为止
     * @remind 自定义的过滤方法filterFn接受一个Node对象作为参数， 该对象代表当前执行检测的祖先节点。 如果该
     *          节点满足过滤条件， 则要求返回true， 这时将直接返回该节点作为findParent()的结果， 否则， 请返回false。
     * @remind 如果includeSelf为true， 则过滤器第一次执行时的参数会是节点本身。
     *          反之， 过滤器第一次执行时的参数将是该节点的父节点。
     * @return { Node | Null } 如果找到符合过滤条件的节点， 就返回该节点， 否则返回NULL
     * @example
     * ```html
     * <body>
     *
     *      <div id="test">
     *      </div>
     *
     *      <script type="text/javascript">
     *
     *          //output: DIV, BODY
     *          var filterNode = UE.dom.domUtils.findParent( document.getElementById( "test" ), function ( node ) {
     *
     *              console.log( node.tagName );
     *              return false;
     *
     *          }, true );
     *
     *      </script>
     * </body>
     * ```
     */
  findParent: function (node, filterFn, includeSelf) {
    if (node && !domUtils.isBody(node)) {
      node = includeSelf ? node : node.parentNode;
      while (node) {
        if (!filterFn || filterFn(node) || domUtils.isBody(node)) {
          return filterFn && !filterFn(node) && domUtils.isBody(node)
            ? null
            : node;
        }
        node = node.parentNode;
      }
    }
    return null;
  },
  /**
     * 查找node的节点名为tagName的第一个祖先节点， 查找的起点是node节点的父节点。
     * @method findParentByTagName
     * @param { Node } node 需要查找的节点对象
     * @param { Array } tagNames 需要查找的父节点的名称数组
     * @warning 查找的终点是到body节点为止
     * @return { Node | NULL } 如果找到符合条件的节点， 则返回该节点， 否则返回NULL
     * @example
     * ```javascript
     * var node = UE.dom.domUtils.findParentByTagName( document.getElementsByTagName("div")[0], [ "BODY" ] );
     * //output: BODY
     * console.log( node.tagName );
     * ```
     */

  /**
     * 查找node的节点名为tagName的祖先节点， 如果includeSelf的值为true，则查找的起点是给定的节点node，
     * 否则， 起点是node的父节点。
     * @method findParentByTagName
     * @param { Node } node 需要查找的节点对象
     * @param { Array } tagNames 需要查找的父节点的名称数组
     * @param { Boolean } includeSelf 查找过程是否包含node节点自身
     * @warning 查找的终点是到body节点为止
     * @return { Node | NULL } 如果找到符合条件的节点， 则返回该节点， 否则返回NULL
     * @example
     * ```javascript
     * var queryTarget = document.getElementsByTagName("div")[0];
     * var node = UE.dom.domUtils.findParentByTagName( queryTarget, [ "DIV" ], true );
     * //output: true
     * console.log( queryTarget === node );
     * ```
     */
  findParentByTagName: function (node, tagNames, includeSelf, excludeFn) {
    tagNames = utils.listToMap(utils.isArray(tagNames) ? tagNames : [tagNames]);
    return domUtils.findParent(
      node,
      function (node) {
        return tagNames[node.tagName] && !(excludeFn && excludeFn(node));
      },
      includeSelf
    );
  },
  /**
     * 查找节点node的祖先节点集合， 查找的起点是给定节点的父节点，结果集中不包含给定的节点。
     * @method findParents
     * @param { Node } node 需要查找的节点对象
     * @return { Array } 给定节点的祖先节点数组
     * @grammar UE.dom.domUtils.findParents(node)  => Array  //返回一个祖先节点数组集合，不包含自身
     * @grammar UE.dom.domUtils.findParents(node,includeSelf)  => Array  //返回一个祖先节点数组集合，includeSelf指定是否包含自身
     * @grammar UE.dom.domUtils.findParents(node,includeSelf,filterFn)  => Array  //返回一个祖先节点数组集合，filterFn指定过滤条件，返回true的node将被选取
     * @grammar UE.dom.domUtils.findParents(node,includeSelf,filterFn,closerFirst)  => Array  //返回一个祖先节点数组集合，closerFirst为true的话，node的直接父亲节点是数组的第0个
     */

  /**
     * 查找节点node的祖先节点集合， 如果includeSelf的值为true，
     * 则返回的结果集中允许出现当前给定的节点， 否则， 该节点不会出现在其结果集中。
     * @method findParents
     * @param { Node } node 需要查找的节点对象
     * @param { Boolean } includeSelf 查找的结果中是否允许包含当前查找的节点对象
     * @return { Array } 给定节点的祖先节点数组
     */
  findParents: function (node, includeSelf, filterFn, closerFirst) {
    var parents = includeSelf && ((filterFn && filterFn(node)) || !filterFn)
      ? [node]
      : [];
    while ((node = domUtils.findParent(node, filterFn))) {
      parents.push(node);
    }
    return closerFirst ? parents : parents.reverse();
  },

  /**
     * 在节点node后面插入新节点newNode
     * @method insertAfter
     * @param { Node } node 目标节点
     * @param { Node } newNode 新插入的节点， 该节点将置于目标节点之后
     * @return { Node } 新插入的节点
     */
  insertAfter: function (node, newNode) {
    return node.nextSibling
      ? node.parentNode.insertBefore(newNode, node.nextSibling)
      : node.parentNode.appendChild(newNode);
  },

  /**
     * 删除节点node及其下属的所有节点
     * @method remove
     * @param { Node } node 需要删除的节点对象
     * @return { Node } 返回刚删除的节点对象
     * @example
     * ```html
     * <div id="test">
     *     <div id="child">你好</div>
     * </div>
     * <script>
     *     UE.dom.domUtils.remove( document.body, false );
     *     //output: false
     *     console.log( document.getElementById( "child" ) !== null );
     * </script>
     * ```
     */

  /**
     * 删除节点node，并根据keepChildren的值决定是否保留子节点
     * @method remove
     * @param { Node } node 需要删除的节点对象
     * @param { Boolean } keepChildren 是否需要保留子节点
     * @return { Node } 返回刚删除的节点对象
     * @example
     * ```html
     * <div id="test">
     *     <div id="child">你好</div>
     * </div>
     * <script>
     *     UE.dom.domUtils.remove( document.body, true );
     *     //output: true
     *     console.log( document.getElementById( "child" ) !== null );
     * </script>
     * ```
     */
  remove: function (node, keepChildren) {
    var parent = node.parentNode,
      child;
    if (parent) {
      if (keepChildren && node.hasChildNodes()) {
        while ((child = node.firstChild)) {
          parent.insertBefore(child, node);
        }
      }
      parent.removeChild(node);
    }
    return node;
  },

  /**
     * 取得node节点的下一个兄弟节点， 如果该节点其后没有兄弟节点， 则递归查找其父节点之后的第一个兄弟节点，
     * 直到找到满足条件的节点或者递归到BODY节点之后才会结束。
     * @method getNextDomNode
     * @param { Node } node 需要获取其后的兄弟节点的节点对象
     * @return { Node | NULL } 如果找满足条件的节点， 则返回该节点， 否则返回NULL
     * @example
     * ```html
     *     <body>
     *      <div id="test">
     *          <span></span>
     *      </div>
     *      <i>xxx</i>
     * </body>
     * <script>
     *
     *     //output: i节点
     *     console.log( UE.dom.domUtils.getNextDomNode( document.getElementById( "test" ) ) );
     *
     * </script>
     * ```
     * @example
     * ```html
     * <body>
     *      <div>
     *          <span></span>
     *          <i id="test">xxx</i>
     *      </div>
     *      <b>xxx</b>
     * </body>
     * <script>
     *
     *     //由于id为test的i节点之后没有兄弟节点， 则查找其父节点（div）后面的兄弟节点
     *     //output: b节点
     *     console.log( UE.dom.domUtils.getNextDomNode( document.getElementById( "test" ) ) );
     *
     * </script>
     * ```
     */

  /**
     * 取得node节点的下一个兄弟节点， 如果startFromChild的值为ture，则先获取其子节点，
     * 如果有子节点则直接返回第一个子节点；如果没有子节点或者startFromChild的值为false，
     * 则执行<a href="#UE.dom.domUtils.getNextDomNode(Node)">getNextDomNode(Node node)</a>的查找过程。
     * @method getNextDomNode
     * @param { Node } node 需要获取其后的兄弟节点的节点对象
     * @param { Boolean } startFromChild 查找过程是否从其子节点开始
     * @return { Node | NULL } 如果找满足条件的节点， 则返回该节点， 否则返回NULL
     * @see UE.dom.domUtils.getNextDomNode(Node)
     */
  getNextDomNode: function (node, startFromChild, filterFn, guard) {
    return getDomNode(
      node,
      "firstChild",
      "nextSibling",
      startFromChild,
      filterFn,
      guard
    );
  },
  /**
     * 检测节点node是否属是UEditor定义的bookmark节点
     * @method isBookmarkNode
     * @private
     * @param { Node } node 需要检测的节点对象
     * @return { Boolean } 是否是bookmark节点
     * @example
     * ```html
     * <span id="_baidu_bookmark_1"></span>
     * <script>
     *      var bookmarkNode = document.getElementById("_baidu_bookmark_1");
     *      //output: true
     *      console.log( UE.dom.domUtils.isBookmarkNode( bookmarkNode ) );
     * </script>
     * ```
     */
  isBookmarkNode: function (node) {
    return node.nodeType == 1 && node.id && /^_baidu_bookmark_/i.test(node.id);
  },
  /**
     * 清除node节点左右连续为空的兄弟inline节点
     * @method clearEmptySibling
     * @param { Node } node 执行的节点对象， 如果该节点的左右连续的兄弟节点是空的inline节点，
     * 则这些兄弟节点将被删除
     * @grammar UE.dom.domUtils.clearEmptySibling(node,ignoreNext)  //ignoreNext指定是否忽略右边空节点
     * @grammar UE.dom.domUtils.clearEmptySibling(node,ignoreNext,ignorePre)  //ignorePre指定是否忽略左边空节点
     * @example
     * ```html
     * <body>
     *     <div></div>
     *     <span id="test"></span>
     *     <i></i>
     *     <b></b>
     *     <em>xxx</em>
     *     <span></span>
     * </body>
     * <script>
     *
     *      UE.dom.domUtils.clearEmptySibling( document.getElementById( "test" ) );
     *
     *      //output: <div></div><span id="test"></span><em>xxx</em><span></span>
     *      console.log( document.body.innerHTML );
     *
     * </script>
     * ```
     */

  /**
     * 清除node节点左右连续为空的兄弟inline节点， 如果ignoreNext的值为true，
     * 则忽略对右边兄弟节点的操作。
     * @method clearEmptySibling
     * @param { Node } node 执行的节点对象， 如果该节点的左右连续的兄弟节点是空的inline节点，
     * @param { Boolean } ignoreNext 是否忽略忽略对右边的兄弟节点的操作
     * 则这些兄弟节点将被删除
     * @see UE.dom.domUtils.clearEmptySibling(Node)
     */

  /**
     * 清除node节点左右连续为空的兄弟inline节点， 如果ignoreNext的值为true，
     * 则忽略对右边兄弟节点的操作， 如果ignorePre的值为true，则忽略对左边兄弟节点的操作。
     * @method clearEmptySibling
     * @param { Node } node 执行的节点对象， 如果该节点的左右连续的兄弟节点是空的inline节点，
     * @param { Boolean } ignoreNext 是否忽略忽略对右边的兄弟节点的操作
     * @param { Boolean } ignorePre 是否忽略忽略对左边的兄弟节点的操作
     * 则这些兄弟节点将被删除
     * @see UE.dom.domUtils.clearEmptySibling(Node)
     */
  clearEmptySibling: function (node, ignoreNext, ignorePre) {
    function clear(next, dir) {
      var tmpNode;
      while (
        next &&
        !domUtils.isBookmarkNode(next) &&
        (domUtils.isEmptyInlineElement(next) ||
          //这里不能把空格算进来会吧空格干掉，出现文字间的空格丢掉了
          !new RegExp("[^\t\n\r" + domUtils.fillChar + "]").test(
            next.nodeValue
          ))
      ) {
        tmpNode = next[dir];
        domUtils.remove(next);
        next = tmpNode;
      }
    }
    !ignoreNext && clear(node.nextSibling, "nextSibling");
    !ignorePre && clear(node.previousSibling, "previousSibling");
  },
  /**
     * 将一个文本节点textNode拆分成两个文本节点，offset指定拆分位置
     * @method split
     * @param { Node } textNode 需要拆分的文本节点对象
     * @param { int } offset 需要拆分的位置， 位置计算从0开始
     * @return { Node } 拆分后形成的新节点
     * @example
     * ```html
     * <div id="test">abcdef</div>
     * <script>
     *      var newNode = UE.dom.domUtils.split( document.getElementById( "test" ).firstChild, 3 );
     *      //output: def
     *      console.log( newNode.nodeValue );
     * </script>
     * ```
     */
  split: function (node, offset) {
    var doc = node.ownerDocument;
    if (browser.ie && offset == node.nodeValue.length) {
      var next = doc.createTextNode("");
      return domUtils.insertAfter(node, next);
    }
    var retval = node.splitText(offset);
    return retval;
  },

  /**
     * 检测文本节点textNode是否为空节点（包括空格、换行、占位符等字符）
     * @method  isWhitespace
     * @param { Node } node 需要检测的节点对象
     * @return { Boolean } 检测的节点是否为空
     * @example
     * ```html
     * <div id="test">
     *
     * </div>
     * <script>
     *      //output: true
     *      console.log( UE.dom.domUtils.isWhitespace( document.getElementById("test").firstChild ) );
     * </script>
     * ```
     */
  isWhitespace: function (node) {
    return !new RegExp("[^ \t\n\r" + domUtils.fillChar + "]").test(
      node.nodeValue
    );
  },
  /**
     * 比较节点nodeA与节点nodeB是否具有相同的标签名、属性名以及属性值
     * @method  isSameElement
     * @param { Node } nodeA 需要比较的节点
     * @param { Node } nodeB 需要比较的节点
     * @return { Boolean } 两个节点是否具有相同的标签名、属性名以及属性值
     * @example
     * ```html
     * <span style="font-size:12px">ssss</span>
     * <span style="font-size:12px">bbbbb</span>
     * <span style="font-size:13px">ssss</span>
     * <span style="font-size:14px">bbbbb</span>
     *
     * <script>
     *
     *     var nodes = document.getElementsByTagName( "span" );
     *
     *     //output: true
     *     console.log( UE.dom.domUtils.isSameElement( nodes[0], nodes[1] ) );
     *
     *     //output: false
     *     console.log( UE.dom.domUtils.isSameElement( nodes[2], nodes[3] ) );
     *
     * </script>
     * ```
     */
  isSameElement: function (nodeA, nodeB) {
    if (nodeA.tagName != nodeB.tagName) {
      return false;
    }
    var thisAttrs = nodeA.attributes,
      otherAttrs = nodeB.attributes;
    if (!browser.ie && thisAttrs.length != otherAttrs.length) {
      return false;
    }
    var attrA,
      attrB,
      al = 0,
      bl = 0;
    for (var i = 0; (attrA = thisAttrs[i++]);) {
      if (attrA.nodeName == "style") {
        if (attrA.specified) {
          al++;
        }
        if (domUtils.isSameStyle(nodeA, nodeB)) {
          continue;
        } else {
          return false;
        }
      }
      if (browser.ie) {
        if (attrA.specified) {
          al++;
          attrB = otherAttrs.getNamedItem(attrA.nodeName);
        } else {
          continue;
        }
      } else {
        attrB = nodeB.attributes[attrA.nodeName];
      }
      if (!attrB.specified || attrA.nodeValue != attrB.nodeValue) {
        return false;
      }
    }
    // 有可能attrB的属性包含了attrA的属性之外还有自己的属性
    if (browser.ie) {
      for (i = 0; (attrB = otherAttrs[i++]);) {
        if (attrB.specified) {
          bl++;
        }
      }
      if (al != bl) {
        return false;
      }
    }
    return true;
  },

  /**
     * 判断节点nodeA与节点nodeB的元素的style属性是否一致
     * @method isSameStyle
     * @param { Node } nodeA 需要比较的节点
     * @param { Node } nodeB 需要比较的节点
     * @return { Boolean } 两个节点是否具有相同的style属性值
     * @example
     * ```html
     * <span style="font-size:12px">ssss</span>
     * <span style="font-size:12px">bbbbb</span>
     * <span style="font-size:13px">ssss</span>
     * <span style="font-size:14px">bbbbb</span>
     *
     * <script>
     *
     *     var nodes = document.getElementsByTagName( "span" );
     *
     *     //output: true
     *     console.log( UE.dom.domUtils.isSameStyle( nodes[0], nodes[1] ) );
     *
     *     //output: false
     *     console.log( UE.dom.domUtils.isSameStyle( nodes[2], nodes[3] ) );
     *
     * </script>
     * ```
     */
  isSameStyle: function (nodeA, nodeB) {
    var styleA = nodeA.style.cssText
      .replace(/( ?; ?)/g, ";")
      .replace(/( ?: ?)/g, ":"),
      styleB = nodeB.style.cssText
        .replace(/( ?; ?)/g, ";")
        .replace(/( ?: ?)/g, ":");
    if (browser.opera) {
      styleA = nodeA.style;
      styleB = nodeB.style;
      if (styleA.length != styleB.length) return false;
      for (var p in styleA) {
        if (/^(\d+|csstext)$/i.test(p)) {
          continue;
        }
        if (styleA[p] != styleB[p]) {
          return false;
        }
      }
      return true;
    }
    if (!styleA || !styleB) {
      return styleA == styleB;
    }
    styleA = styleA.split(";");
    styleB = styleB.split(";");
    if (styleA.length != styleB.length) {
      return false;
    }
    for (var i = 0, ci; (ci = styleA[i++]);) {
      if (utils.indexOf(styleB, ci) == -1) {
        return false;
      }
    }
    return true;
  },
  /**
     * 检查节点node是否为block元素
     * @method isBlockElm
     * @param { Node } node 需要检测的节点对象
     * @return { Boolean } 是否是block元素节点
     * @warning 该方法的判断规则如下： 如果该元素原本是block元素， 则不论该元素当前的css样式是什么都会返回true；
     *          否则，检测该元素的css样式， 如果该元素当前是block元素， 则返回true。 其余情况下都返回false。
     * @example
     * ```html
     * <span id="test1" style="display: block"></span>
     * <span id="test2"></span>
     * <div id="test3" style="display: inline"></div>
     *
     * <script>
     *
     *     //output: true
     *     console.log( UE.dom.domUtils.isBlockElm( document.getElementById("test1") ) );
     *
     *     //output: false
     *     console.log( UE.dom.domUtils.isBlockElm( document.getElementById("test2") ) );
     *
     *     //output: true
     *     console.log( UE.dom.domUtils.isBlockElm( document.getElementById("test3") ) );
     *
     * </script>
     * ```
     */
  isBlockElm: function (node) {
    return (
      node.nodeType == 1 &&
      (dtd.$block[node.tagName] ||
        styleBlock[domUtils.getComputedStyle(node, "display")]) &&
      !dtd.$nonChild[node.tagName]
    );
  },
  /**
     * 检测node节点是否为body节点
     * @method isBody
     * @param { Element } node 需要检测的dom元素
     * @return { Boolean } 给定的元素是否是body元素
     * @example
     * ```javascript
     * //output: true
     * console.log( UE.dom.domUtils.isBody( document.body ) );
     * ```
     */
  isBody: function (node) {
    return node && node.nodeType == 1 && node.tagName.toLowerCase() == "body";
  },
  /**
     * 检查节点node是否是空inline节点
     * @method  isEmptyInlineElement
     * @param { Node } node 需要检测的节点对象
     * @return { Number }  如果给定的节点是空的inline节点， 则返回1, 否则返回0。
     * @example
     * ```html
     * <b><i></i></b> => 1
     * <b><i></i><u></u></b> => 1
     * <b></b> => 1
     * <b>xx<i></i></b> => 0
     * ```
     */
  isEmptyInlineElement: function (node) {
    if (node.nodeType != 1 || !dtd.$removeEmpty[node.tagName]) {
      return 0;
    }
    node = node.firstChild;
    while (node) {
      //如果是创建的bookmark就跳过
      if (domUtils.isBookmarkNode(node)) {
        return 0;
      }
      if (
        (node.nodeType == 1 && !domUtils.isEmptyInlineElement(node)) ||
        (node.nodeType == 3 && !domUtils.isWhitespace(node))
      ) {
        return 0;
      }
      node = node.nextSibling;
    }
    return 1;
  },

  /**
     * 删除node节点下首尾两端的空白文本子节点
     * @method trimWhiteTextNode
     * @param { Element } node 需要执行删除操作的元素对象
     * @example
     * ```javascript
     *      var node = document.createElement("div");
     *
     *      node.appendChild( document.createTextNode( "" ) );
     *
     *      node.appendChild( document.createElement("div") );
     *
     *      node.appendChild( document.createTextNode( "" ) );
     *
     *      //3
     *      console.log( node.childNodes.length );
     *
     *      UE.dom.domUtils.trimWhiteTextNode( node );
     *
     *      //1
     *      console.log( node.childNodes.length );
     * ```
     */
  trimWhiteTextNode: function (node) {
    function remove(dir) {
      var child;
      while (
        (child = node[dir]) &&
        child.nodeType == 3 &&
        domUtils.isWhitespace(child)
      ) {
        node.removeChild(child);
      }
    }
    remove("firstChild");
    remove("lastChild");
  },

  /**
     * 合并node节点下相同的子节点
     * @name mergeChild
     * @desc
     * UE.dom.domUtils.mergeChild(node,tagName) //tagName要合并的子节点的标签
     * @example
     * <p><span style="font-size:12px;">xx<span style="font-size:12px;">aa</span>xx</span></p>
     * ==> UE.dom.domUtils.mergeChild(node,'span')
     * <p><span style="font-size:12px;">xxaaxx</span></p>
     */
  mergeChild: function (node, tagName, attrs) {
    var list = domUtils.getElementsByTagName(node, node.tagName.toLowerCase());
    for (var i = 0, ci; (ci = list[i++]);) {
      if (!ci.parentNode || domUtils.isBookmarkNode(ci)) {
        continue;
      }
      //span单独处理
      if (ci.tagName.toLowerCase() == "span") {
        if (node === ci.parentNode) {
          domUtils.trimWhiteTextNode(node);
          if (node.childNodes.length == 1) {
            node.style.cssText = ci.style.cssText + ";" + node.style.cssText;
            domUtils.remove(ci, true);
            continue;
          }
        }
        ci.style.cssText = node.style.cssText + ";" + ci.style.cssText;
        if (attrs) {
          var style = attrs.style;
          if (style) {
            style = style.split(";");
            for (var j = 0, s; (s = style[j++]);) {
              ci.style[utils.cssStyleToDomStyle(s.split(":")[0])] = s.split(
                ":"
              )[1];
            }
          }
        }
        if (domUtils.isSameStyle(ci, node)) {
          domUtils.remove(ci, true);
        }
        continue;
      }
      if (domUtils.isSameElement(node, ci)) {
        domUtils.remove(ci, true);
      }
    }
  },

  /**
     * 原生方法getElementsByTagName的封装
     * @method getElementsByTagName
     * @param { Node } node 目标节点对象
     * @param { String } tagName 需要查找的节点的tagName， 多个tagName以空格分割
     * @return { Array } 符合条件的节点集合
     */
  getElementsByTagName: function (node, name, filter) {
    if (filter && utils.isString(filter)) {
      var className = filter;
      filter = function (node) {
        return domUtils.hasClass(node, className);
      };
    }
    name = utils.trim(name).replace(/[ ]{2,}/g, " ").split(" ");
    var arr = [];
    for (var n = 0, ni; (ni = name[n++]);) {
      var list = node.getElementsByTagName(ni);
      for (var i = 0, ci; (ci = list[i++]);) {
        if (!filter || filter(ci)) arr.push(ci);
      }
    }

    return arr;
  },
  mergeToParent: function (node) {
    var parent = node.parentNode;
    while (parent && dtd.$removeEmpty[parent.tagName]) {
      if ((parent.tagName == node.tagName && parent.className == node.className) || parent.tagName == "A") {
        //针对a标签单独处理
        domUtils.trimWhiteTextNode(parent);
        //span需要特殊处理  不处理这样的情况 <span stlye="color:#fff">xxx<span style="color:#ccc">xxx</span>xxx</span>
        if (
          (parent.tagName == "SPAN" && !domUtils.isSameStyle(parent, node)) ||
          (parent.tagName == "A" && node.tagName == "SPAN")
        ) {
          if (parent.childNodes.length > 1 || parent !== node.parentNode) {
            node.style.cssText =
              parent.style.cssText + ";" + node.style.cssText;
            parent = parent.parentNode;
            continue;
          } else {
            parent.style.cssText += ";" + node.style.cssText;
            //trace:952 a标签要保持下划线
            if (parent.tagName == "A") {
              parent.style.textDecoration = "underline";
            }
          }
        }
        if (parent.tagName != "A") {
          parent === node.parentNode && domUtils.remove(node, true);
          break;
        }
      }
      parent = parent.parentNode;
    }
  },
  mergeSibling: function (node, ignorePre, ignoreNext) {
    function merge(rtl, start, node) {
      var next;
      if (
        (next = node[rtl]) &&
        !domUtils.isBookmarkNode(next) &&
        next.nodeType == 1 &&
        domUtils.isSameElement(node, next)
      ) {
        while (next.firstChild) {
          if (start == "firstChild") {
            node.insertBefore(next.lastChild, node.firstChild);
          } else {
            node.appendChild(next.firstChild);
          }
        }
        domUtils.remove(next);
      }
    }
    !ignorePre && merge("previousSibling", "firstChild", node);
    !ignoreNext && merge("nextSibling", "lastChild", node);
  },

  /**
     * 设置节点node及其子节点不会被选中
     * @method unSelectable
     * @param { Element } node 需要执行操作的dom元素
     * @remind 执行该操作后的节点， 将不能被鼠标选中
     * @example
     * ```javascript
     * UE.dom.domUtils.unSelectable( document.body );
     * ```
     */
  unSelectable: browser.opera
    ? function (node) {
      //for ie9
      node.onselectstart = function () {
        return false;
      };
      node.onclick = node.onkeyup = node.onkeydown = function () {
        return false;
      };
      node.unselectable = "on";
      node.setAttribute("unselectable", "on");
      for (var i = 0, ci; (ci = node.all[i++]);) {
        switch (ci.tagName.toLowerCase()) {
          case "iframe":
          case "textarea":
          case "input":
          case "select":
            break;
          default:
            ci.unselectable = "on";
            node.setAttribute("unselectable", "on");
        }
      }
    }
    : function (node) {
      node.style.MozUserSelect = node.style.webkitUserSelect = node.style.msUserSelect = node.style.KhtmlUserSelect =
        "none";
    },
  /**
     * 在doc下创建一个标签名为tag，属性为attrs的元素
     * @method createElement
     * @param { DomDocument } doc 新创建的元素属于该document节点创建
     * @param { String } tagName 需要创建的元素的标签名
     * @param { Object } attrs 新创建的元素的属性key-value集合
     * @return { Element } 新创建的元素对象
     * @example
     * ```javascript
     * var ele = UE.dom.domUtils.createElement( document, 'div', {
     *     id: 'test'
     * } );
     *
     * //output: DIV
     * console.log( ele.tagName );
     *
     * //output: test
     * console.log( ele.id );
     *
     * ```
     */
  createElement: function (doc, tag, attrs) {
    return domUtils.setAttributes(doc.createElement(tag), attrs);
  },
  /**
     * 为节点node添加属性attrs，attrs为属性键值对
     * @method setAttributes
     * @param { Element } node 需要设置属性的元素对象
     * @param { Object } attrs 需要设置的属性名-值对
     * @return { Element } 设置属性的元素对象
     * @example
     * ```html
     * <span id="test"></span>
     *
     * <script>
     *
     *     var testNode = UE.dom.domUtils.setAttributes( document.getElementById( "test" ), {
     *         id: 'demo'
     *     } );
     *
     *     //output: demo
     *     console.log( testNode.id );
     *
     * </script>
     *
     */
  setAttributes: function (node, attrs) {
    for (var attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        var value = attrs[attr];
        switch (attr) {
          case "class":
            //ie下要这样赋值，setAttribute不起作用
            node.className = value;
            break;
          case "style":
            node.style.cssText = node.style.cssText + ";" + value;
            break;
          case "innerHTML":
            node[attr] = value;
            break;
          case "value":
            node.value = value;
            break;
          default:
            node.setAttribute(attrFix[attr] || attr, value);
        }
      }
    }
    return node;
  },

  /**
     * 获取元素element经过计算后的样式值
     * @method getComputedStyle
     * @param { Element } element 需要获取样式的元素对象
     * @param { String } styleName 需要获取的样式名
     * @return { String } 获取到的样式值
     * @example
     * ```html
     * <style type="text/css">
     *      #test {
     *          font-size: 15px;
     *      }
     * </style>
     *
     * <span id="test"></span>
     *
     * <script>
     *     //output: 15px
     *     console.log( UE.dom.domUtils.getComputedStyle( document.getElementById( "test" ), 'font-size' ) );
     * </script>
     * ```
     */
  getComputedStyle: function (element, styleName) {
    //一下的属性单独处理
    var pros = "width height top left";

    if (pros.indexOf(styleName) > -1) {
      return (
        element[
        "offset" +
        styleName.replace(/^\w/, function (s) {
          return s.toUpperCase();
        })
        ] + "px"
      );
    }
    //忽略文本节点
    if (element.nodeType == 3) {
      element = element.parentNode;
    }
    try {
      var value =
        domUtils.getStyle(element, styleName) ||
        (window.getComputedStyle
          ? window.getComputedStyle(element, "")
            .getPropertyValue(styleName)
          : (element.currentStyle || element.style)[
          utils.cssStyleToDomStyle(styleName)
          ]);
    } catch (e) {
      return "";
    }
    return utils.transUnitToPx(utils.fixColor(styleName, value));
  },
  /**
     * 判断元素element是否包含给定的样式类名className
     * @method hasClass
     * @param { Node } ele 需要检测的元素
     * @param { String } classNames 需要检测的className， 多个className之间用空格分割
     * @return { Boolean } 元素是否包含所有给定的className
     * @example
     * ```html
     * <span id="test1" class="cls1 cls2"></span>
     *
     * <script>
     *     var test1 = document.getElementById("test1");
     *
     *     //output: false
     *     console.log( UE.dom.domUtils.hasClass( test1, "cls2 cls1 cls3" ) );
     *
     *     //output: true
     *     console.log( UE.dom.domUtils.hasClass( test1, "cls2 cls1" ) );
     * </script>
     * ```
     */

  /**
     * 判断元素element是否包含给定的样式类名className
     * @method hasClass
     * @param { Node } ele 需要检测的元素
     * @param { Array } classNames 需要检测的className数组
     * @return { Boolean } 元素是否包含所有给定的className
     * @example
     * ```html
     * <span id="test1" class="cls1 cls2"></span>
     *
     * <script>
     *     var test1 = document.getElementById("test1");
     *
     *     //output: false
     *     console.log( UE.dom.domUtils.hasClass( test1, [ "cls2", "cls1", "cls3" ] ) );
     *
     *     //output: true
     *     console.log( UE.dom.domUtils.hasClass( test1, [ "cls2", "cls1" ]) );
     * </script>
     * ```
     */
  hasClass: function (element, className) {
    if (utils.isRegExp(className)) {
      return className.test(element.className);
    }
    className = utils.trim(className).replace(/[ ]{2,}/g, " ").split(" ");
    for (var i = 0, ci, cls = element.className; (ci = className[i++]);) {
      if (!new RegExp("\\b" + ci + "\\b", "i").test(cls)) {
        return false;
      }
    }
    return i - 1 == className.length;
  },
  /**
     * 判断给定节点是否为br
     * @method isBr
     * @param { Node } node 需要判断的节点对象
     * @return { Boolean } 给定的节点是否是br节点
     */
  isBr: function (node) {
    return node.nodeType == 1 && node.tagName == "BR";
  },
  /**
     * 判断给定的节点是否是一个“填充”节点
     * @private
     * @method isFillChar
     * @param { Node } node 需要判断的节点
     * @param { Boolean } isInStart 是否从节点内容的开始位置匹配
     * @returns { Boolean } 节点是否是填充节点
     */
  isFillChar: function (node, isInStart) {
    if (node.nodeType != 3) return false;
    var text = node.nodeValue;
    if (isInStart) {
      return new RegExp("^" + domUtils.fillChar).test(text);
    }
    return !text.replace(new RegExp(domUtils.fillChar, "g"), "").length;
  },
});

export default domUtils;
