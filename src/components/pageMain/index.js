import React from 'react';
import styles from './index.css';
import Range from './Range';

/**
 * 首页
 */
class PageMain extends React.Component {
  /**
   * 添加下划线
   */
  addUnderline = () => {
    this.replaceSelectedStrByEle(styles['custom-underline'])
  }

  /**
   * 启用荧光笔
   */
  enableNiteWriterPen = () => {
    this.replaceSelectedStrByEle(styles['nite-writer-pen'])
  }

  /**
   * 用元素替换被选中的文本
   */
  replaceSelectedStrByEle = (className) => {
    var getRange = () => {
      var me = window;
      var range = new Range(me.document);

      var sel = window.getSelection();
      if (sel && sel.rangeCount) {
        var firstRange = sel.getRangeAt(0);
        var lastRange = sel.getRangeAt(sel.rangeCount - 1);
        range.setStart(firstRange.startContainer, firstRange.startOffset)
          .setEnd(lastRange.endContainer, lastRange.endOffset);
      }
      return range
    }
    var range = getRange();
    range.applyInlineStyle('i', {
      class: className
    });
    range.select();
  }

  render() {
    return (
      <div>
        笔记功能预研
        <div>
          <button onClick={this.enableNiteWriterPen}>荧光笔</button>
          <button onClick={this.addUnderline}>添加下划线</button>
        </div>
        <p className={styles['content']}>
          <h3>《道德经》全文</h3>
          <p>

            01.道可道，非常道。<i>哈哈哈哈哈</i>名可名，非常名。无名天地之始。有名万物之母。故常无欲以观其妙。常有欲以观

          其徼。此两者同出而异名，同谓之玄。玄之又玄，众妙之门。
            </p>

          <p>
            02.天下皆知美之为美，斯恶矣；皆知善之为善，斯不善已。故有无相生，难易相成，长短相形，高下相

            倾，音声相和，前後相随。是以圣人处无为之事，行不言之教。万物作焉而不辞。生而不有，为而不恃，

            功成而弗居。夫唯弗居，是以不去。
          </p>

          <p>
            03.不尚贤， 使民不争。不贵难得之货，使民不为盗。不见可欲，使民心不乱。是以圣人之治，虚其心，

            实其腹，弱其志，强其骨；常使民无知、无欲，使夫智者不敢为也。为无为，则无不治。
          </p>

          <p>
            04.道冲而用之，或不盈。渊兮似万物之宗。解其纷，和其光，同其尘，湛兮似或存。吾不知谁之子，象

            帝之先。
          </p>
          <p>
            05.天地不仁，以万物为刍狗。圣人不仁，以百姓为刍狗。天地之间，其犹橐迭乎？虚而不屈，动而愈出

            。多言数穷，不如守中。
          </p>
          <p>
            06.谷神不死是谓玄牝。玄牝之门是谓天地根。绵绵若存，用之不勤。
          </p>

          <p>
            07.天长地久。天地所以能长且久者，以其不自生，故能长生。是以圣人後其身而身先，外其身而身存。

            非以其无私邪！故能成其私。
          </p>
          <p>
            08.上善若水。水善利万物而不争，处众人之所恶，故几於道。居善地，心善渊，与善仁，言善信，正善

            治，事善能，动善时。夫唯不争，故无尤。
          </p>
        </p>
      </div>
    );
  }
}

export default PageMain
