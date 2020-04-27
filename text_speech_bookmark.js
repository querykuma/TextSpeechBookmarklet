javascript: (() => {/* eslint-disable-line no-unused-labels */
  /* 機能
  - テキストを選択してブックマークレット起動すると選択範囲のテキストを読み上げる。
  - テキストを選択しないでブックマークレット起動すると中心部のテキストを選んで読み上げる。
  - 読み上げ中にブックマークレット起動すると読み上げを停止する。
  - 言語を自動判定（主に英語と日本語）する。
  - 再生箇所を赤枠で示す。
  - 右下に一時停止などのボタンを表示する。
  - ボタンから再生速度を変更できる。
  - 選択範囲を選択してボタンを押すと選択範囲以降のテキストを読み上げる。
  */

  var util = {
    "sleep": function (ms) {
      return new Promise((res) => setTimeout(res, ms));
    },
    "get_common_ancestor": function (el1, el2) {
      /* 共通の祖先を得る */
      var e_lst = [];
      var e = el1;
      while (e !== document.documentElement) {
        e_lst.push(e);
        e = e.parentElement;
      }

      e = el2;
      while (e !== document.documentElement) {
        /* eslint-disable-next-line no-loop-func */
        var e_lst_find = e_lst.find((a) => a === e);
        if (e_lst_find) return e_lst_find;
        e = e.parentElement;
      }
      return null;
    },
    "is_node_visible": function (node) {
      var bcr = node.getBoundingClientRect();
      var cs = getComputedStyle(node);

      var m = cs.height.match(/^(\d+)px$/);
      var height_check = true;
      if (m) {
        var height = m[1];
        /* 1pxのheightを除く */
        height_check = height > 1;
      }

      return cs.display !== "none" &&
        cs.visibility !== "hidden" &&
        (cs.zIndex === "auto" || cs.zIndex >= 0) &&
        cs.fontSize !== "0px" &&
        height_check &&
        /* 丸め誤差を避けるため10加算 */
        bcr.left + 10 >= -document.scrollingElement.scrollLeft &&
        bcr.top + 10 >= -document.scrollingElement.scrollTop &&
        bcr.right <= document.scrollingElement.scrollWidth - document.scrollingElement.scrollLeft + 10 &&
        bcr.bottom <= document.scrollingElement.scrollHeight - document.scrollingElement.scrollTop + 10;
    },
    "is_under_node": function (node, node_top) {
      /* nodeがnode_topの下にあったらtrueを返す */
      while (node) {
        if (node === node_top) return true;
        node = node.parentElement;
      }
      return false;
    },
    "detect_lang": function (str) {
      /* html langが指定してあり、speechSynthesis.getVoices()に音声があれば、フランス語やロシア語でも短い選択範囲で話す。
       * 中国語や韓国語は選択範囲で短い範囲を指定したときのみ話す。日本語と英語は安定。 */

      var lang = document.documentElement.lang;
      if (lang) {
        var m = lang.match(/^(.*?)-/);
        if (m) {
          return m[1];
        }
        return lang;
      }

      /* Unicode from https://www.unicode.org/Public/UNIDATA/Blocks.txt */
      var jp_len = str.match(/[\u3040-\u309F\u30A0-\u30FF]/gu);
      jp_len = jp_len ? jp_len.length : 0;
      var ko_len = str.match(/[\uAC00-\uD7AF\uD7B0-\uD7FF]/gu);
      ko_len = ko_len ? ko_len.length : 0;
      var cjk_len = str.match(/[\u4E00-\u9FFF]/gu);
      cjk_len = cjk_len ? cjk_len.length : 0;
      var en_len = str.match(/[a-zA-Z]/gu);
      en_len = en_len ? en_len.length : 0;

      if (ko_len > 10) {
        return 'ko';
      } else if (cjk_len > 10) {
        if (jp_len > 10) {
          return 'ja';
        }
        return 'zh';
      }
      if (en_len > 100) return 'en';
      return 'ja';
    }
  };

  var textControl = {
    "text": "",
    "text_obj_lst": [],
    "cur_text_obj": null,
    "update_text_obj_lst": function () {
      var cur_text_obj_idx = this.text_obj_lst.indexOf(this.cur_text_obj);
      this.text_obj_lst = this.text_obj_lst.slice(cur_text_obj_idx);
    },
    "find_text_obj_from_charIndex": function (charIndex) {
      var sum = 0;
      for (var text_obj of this.text_obj_lst) {
        if (Object.prototype.hasOwnProperty.call(text_obj, "startOffset")) {
          if (Object.prototype.hasOwnProperty.call(text_obj, "endOffset")) {
            sum += text_obj.endOffset - text_obj.startOffset;
          } else {
            sum += text_obj.len - text_obj.startOffset + 1;
          }
        } else if (Object.prototype.hasOwnProperty.call(text_obj, "endOffset")) {
          sum += text_obj.endOffset;
        } else {
          sum += text_obj.len + 1;
        }

        if (sum > charIndex) {
          this.cur_text_obj = text_obj;
          return text_obj;
        }
      }
    },
    "sel_range": null,
    "set_sel_range": function (sel_range) {
      this.sel_range = sel_range;
    },
    "push_text_obj_after_sel_range": function (n, get_text_wrapper_val) {

      var r = new Range();
      r.selectNode(n);

      if (this.sel_range.compareBoundaryPoints(Range.START_TO_START, r) <= 0) {
        /* 選択範囲の始点が、nの始点より前にある */
        this.text_obj_lst.push({
          "node": n,
          "text": get_text_wrapper_val,
          "len": get_text_wrapper_val.length
        });
      } else if (this.sel_range.compareBoundaryPoints(Range.END_TO_START, r) <= 0) {
        /* 選択範囲の始点が、nの始点より後ろにある && 選択範囲の始点が、nの終点より前にある */
        this.text_obj_lst.push({
          "node": n,
          "text": get_text_wrapper_val,
          "startOffset": this.sel_range.startOffset,
          "len": get_text_wrapper_val.length
        });
      }
    },
    "push_text_obj": function (n, get_text_wrapper_val) {

      var r = new Range();
      r.selectNode(n);

      if (this.sel_range.compareBoundaryPoints(Range.START_TO_START, r) <= 0) {
        if (this.sel_range.compareBoundaryPoints(Range.END_TO_END, r) >= 0) {
          /* 選択範囲の始点が、nの始点より前にある && 選択範囲の終点が、nの終点より後ろにある */
          this.text_obj_lst.push({
            "node": n,
            "text": get_text_wrapper_val,
            "len": get_text_wrapper_val.length
          });
        } else if (this.sel_range.compareBoundaryPoints(Range.START_TO_END, r) > 0) {
          /* 選択範囲の始点が、nの始点より前にある && 選択範囲の終点が、nの始点より後ろにある && 選択範囲の終点が、nの終点より前にある */
          this.text_obj_lst.push({
            "node": n,
            "text": get_text_wrapper_val,
            "endOffset": this.sel_range.endOffset,
            "len": get_text_wrapper_val.length
          });
        }
      } else if (this.sel_range.compareBoundaryPoints(Range.END_TO_END, r) >= 0) {
        if (this.sel_range.compareBoundaryPoints(Range.END_TO_START, r) < 0) {
          /* 選択範囲の始点が、nの始点より後ろにある && 選択範囲の始点が、nの終点より前にある && 選択範囲の終点が、nの終点より後ろにある */
          this.text_obj_lst.push({
            "node": n,
            "text": get_text_wrapper_val,
            "startOffset": this.sel_range.startOffset,
            "len": get_text_wrapper_val.length
          });
        }
      } else {
        /* 選択範囲の始点が、nの始点より後ろにある && 選択範囲の終点が、nの終点より前にある */
        this.text_obj_lst.push({
          "node": n,
          "text": get_text_wrapper_val,
          "startOffset": this.sel_range.startOffset,
          "endOffset": this.sel_range.endOffset,
          "len": get_text_wrapper_val.length
        });
      }
    },
    "get_text_wrapper": function (node, after_sel_range = false) {
      /* 非表示を除いてテキストを得る */
      /* <NOSCRIPT>や<CODE>や<RP>や<RT>を除く */
      if (["NOSCRIPT", "CODE", "RP", "RT"].indexOf(node.nodeName) >= 0) {
        return "";
      } else if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      } else if (node.nodeType === Node.COMMENT_NODE) {
        return "";
      }

      if (util.is_under_node(node, this.textSpeechControl)) {
        return "";
      }

      if (!util.is_node_visible(node)) {
        return "";
      }

      [...node.childNodes].forEach((n) => {
        var get_text_wrapper_val = this.get_text_wrapper(n, after_sel_range);

        /* speechSynthesis doesn't speak if text contains "<"(less than) */
        if (get_text_wrapper_val && get_text_wrapper_val.search("<") >= 0) {
          get_text_wrapper_val = get_text_wrapper_val.replace(/</gu, "lt;");
        }

        if (get_text_wrapper_val && get_text_wrapper_val.trim()) {

          if (this.sel_range) {

            if (after_sel_range) {
              this.push_text_obj_after_sel_range(n, get_text_wrapper_val);

            } else {
              this.push_text_obj(n, get_text_wrapper_val);
            }

          } else {
            this.text_obj_lst.push({
              "node": n,
              "text": get_text_wrapper_val,
              "len": get_text_wrapper_val.length
            });
          }

        }
      });
    },
    "get_text": function () {
      this.text = this.text_obj_lst.map((a) => {
        if (Object.prototype.hasOwnProperty.call(a, "startOffset")) {
          if (Object.prototype.hasOwnProperty.call(a, "endOffset")) {
            return a.text.slice(a.startOffset, a.endOffset);
          }
          return a.text.slice(a.startOffset, a.len);
        }
        if (Object.prototype.hasOwnProperty.call(a, "endOffset")) {
          return a.text.slice(0, a.endOffset);
        }
        return a.text;
      }).join(' ');
      return this.text;
    }
  };

  var textSpeechControl = {
    "utter": null,
    "keepControlOnEnd": false,
    "common_ancestor": null,
    "event_listeners": {},
    "dom_set_position": function (charIndex) {
      var text_obj = textControl.find_text_obj_from_charIndex(charIndex);

      var elem = text_obj.node.parentElement;
      if (!elem.classList.contains("textSpeechControl_current")) {
        [...document.querySelectorAll(".textSpeechControl_current")].forEach((a) => {
          a.classList.remove("textSpeechControl_current");
        });
        elem.classList.add("textSpeechControl_current");
      }
    },
    "boundary_event": function (e) {
      this.dom_set_position(e.charIndex);
    },
    "clear_textSpeechControl": function () {
      if (this.keepControlOnEnd) return;
      [...document.querySelectorAll(".textSpeechControl")].forEach((a) => a.remove());
    },
    "stop_click": function (_option = {}) {
      var option = { "keepListeners": false };
      Object.assign(option, _option);

      this.clear_textSpeechControl();
      speechSynthesis.cancel();
      var utter = this.utter;
      if (utter) {
        utter.removeEventListener('end', this.event_listeners.utter_end);
        utter.removeEventListener('boundary', this.event_listeners.utter_boundary);

        if (option.keepListeners) return;

        this.textSpeechControlStop.removeEventListener('click', this.event_listeners.stop_click);
        this.textSpeechControlPause.removeEventListener('click', this.event_listeners.pause_click);
        this.textSpeechControlPlay.removeEventListener('click', this.event_listeners.resume_click);
        this.textSpeechControlRateSetting.removeEventListener('click', this.event_listeners.ratesetting_click);
        this.textSpeechControlRateMenu.removeEventListener('click', this.event_listeners.ratemenu_click);
        this.textSpeechControlForward.removeEventListener('click', this.event_listeners.forward_click);
      }
    },
    "pause_click": function () {
      this.textSpeechControlPause.classList.toggle('textSpeechControlHide');
      this.textSpeechControlPlay.classList.toggle('textSpeechControlHide');
      this.textSpeechControlRateMenu.classList.add('textSpeechControlHide');
      speechSynthesis.pause();
    },
    "resume_click": function () {
      this.textSpeechControlPause.classList.toggle('textSpeechControlHide');
      this.textSpeechControlPlay.classList.toggle('textSpeechControlHide');
      this.textSpeechControlRateMenu.classList.add('textSpeechControlHide');
      speechSynthesis.resume();
    },
    "ratesetting_click": function () {

      var rate = this.utter.rate;
      if (rate === -1) {
        rate = 1;
      }
      [...this.textSpeechControlRateMenu.querySelectorAll(".textSpeechControl5")].
        forEach((a) => {
          if (a.textContent === String(rate)) {
            a.classList.add("textSpeechControl_currentRate");
          } else {
            a.classList.remove("textSpeechControl_currentRate");
          }
        });

      this.textSpeechControlRateMenu.classList.toggle('textSpeechControlHide');
    },
    "ratemenu_click": async function (e) {
      if (!e.target.classList.contains("textSpeechControl5")) {
        this.ratesetting_click();
        return;
      }
      var rate = e.target.textContent;

      var utter_rate = this.utter.rate;
      if (utter_rate === -1) {
        utter_rate = 1;
      }

      if (rate === String(utter_rate)) {
        this.ratesetting_click();
        return;
      }

      this.keepControlOnEnd = true;
      speechSynthesis.cancel();

      this.textSpeechControlRateMenu.classList.add('textSpeechControlHide');
      if (this.textSpeechControlPause.classList.contains("textSpeechControlHide")) {
        this.textSpeechControlPause.classList.toggle('textSpeechControlHide');
        this.textSpeechControlPlay.classList.toggle('textSpeechControlHide');
      }

      textControl.update_text_obj_lst();

      await util.sleep(500);
      this.speech_start(rate);

      localStorage.textSpeechRate = rate;
      this.keepControlOnEnd = false;
    },
    "forward_click": async function () {
      this.textSpeechControlRateMenu.classList.add('textSpeechControlHide');

      this.textSpeechControlPause.classList.remove('textSpeechControlHide');
      this.textSpeechControlPlay.classList.add('textSpeechControlHide');

      var sel = getSelection();
      var sel_exist = sel.rangeCount && sel.toString().length;
      var common_ancestor;

      if (sel_exist) {

        var sel_range = sel.getRangeAt(0);
        textControl.set_sel_range(sel_range);
        common_ancestor = util.get_common_ancestor(sel_range.commonAncestorContainer, this.common_ancestor);
      } else {

        return;
      }
      sel.empty();

      this.keepControlOnEnd = true;
      this.stop_click({ "keepListeners": true });
      this.keepControlOnEnd = false;

      if (sel_exist) {
        /* これがないと再生が再開されない */
        await util.sleep(500);
      }

      /* eslint-disable-next-line require-atomic-updates */
      textControl.text_obj_lst = [];
      textControl.get_text_wrapper(common_ancestor, true);

      this.speech_start();
    },
    "show": function () {
      document.body.insertAdjacentHTML('afterbegin', `
<style class="textSpeechControl">
.textSpeechControl{font-family:"meiryo"!important;font-size:14px!important;z-index:5000;position:fixed;right:20px;bottom:20px;background-color:rgba(28,28,28,0.9);padding:2px 8px;user-select:none!important;}
.textSpeechControl2{display:inline-block;color:white;cursor:pointer;}
.textSpeechControl3{letter-spacing:-8px;padding-left:0;padding-right:8px;}
.textSpeechControlHide{display:none;}
.textSpeechControl_current{outline:solid red 1px;outline-offset:-1px;}
.textSpeechControl4{position:absolute;bottom:30px;right:10px;width:80px;text-align:center;background-color:rgba(28,28,28,0.9);color:white;}
.textSpeechControl5:hover{background-color:rgba(255,255,255,.1);cursor:pointer;}
.textSpeechControl_currentRate:before{position:absolute;content:'✔';left:5%;}
.textSpeechControliconWrapper{position:relative;display:inline-block;width:20px;height:20px;padding:2px;box-sizing:border-box;margin-right:0px;margin-bottom:-5px;background-color: black;}
.textSpeechControliconForward{position:absolute;margin-left:2px;margin-top:1px;width:0;height:0;border-left:7px solid white;border-top:7px solid transparent;border-bottom:7px solid transparent;}
.textSpeechControliconForward:after{content:'';position:absolute;top:-7px;left:0;border-left:7px solid white;border-top:7px solid transparent;border-bottom:7px solid transparent;}
}
</style>
<span class="textSpeechControl" id="textSpeechControl">
 <span class="textSpeechControl2" id="textSpeechControlRateSetting" title="再生速度">︙</span>
 <div class="textSpeechControl4 textSpeechControlHide" id="textSpeechControlRateMenu">
  <div>再生速度</div>
  <div class="textSpeechControl5">8</div>
  <div class="textSpeechControl5">4</div>
  <div class="textSpeechControl5">2</div>
  <div class="textSpeechControl5">1.75</div>
  <div class="textSpeechControl5">1.5</div>
  <div class="textSpeechControl5">1.25</div>
  <div class="textSpeechControl5">1</div>
 </div>
 <span class="textSpeechControl2" id="textSpeechControlStop" title="停止">■</span>
 <span class="textSpeechControl2" id="textSpeechControlPause" title="一時停止"><span class="textSpeechControl3">┃┃</span></span>
 <span class="textSpeechControl2 textSpeechControlHide" id="textSpeechControlPlay" title="再開">&#x25b6;</span>
 <span class="textSpeechControl2" id="textSpeechControlForward" title="選択範囲以降を再生"><div class="textSpeechControliconWrapper"><div class="textSpeechControliconForward"></div></div></span>
</span>`);

      this.textSpeechControlStop = document.getElementById('textSpeechControlStop');
      this.textSpeechControlPause = document.getElementById('textSpeechControlPause');
      this.textSpeechControlPlay = document.getElementById('textSpeechControlPlay');
      this.textSpeechControlRateSetting = document.getElementById('textSpeechControlRateSetting');
      this.textSpeechControlRateMenu = document.getElementById('textSpeechControlRateMenu');
      this.textSpeechControlForward = document.getElementById('textSpeechControlForward');
      textControl.textSpeechControl = document.getElementById('textSpeechControl');

      this.event_listeners.stop_click = this.stop_click.bind(this);
      this.event_listeners.pause_click = this.pause_click.bind(this);
      this.event_listeners.resume_click = this.resume_click.bind(this);
      this.event_listeners.ratesetting_click = this.ratesetting_click.bind(this);
      this.event_listeners.ratemenu_click = this.ratemenu_click.bind(this);
      this.event_listeners.forward_click = this.forward_click.bind(this);

      this.textSpeechControlStop.addEventListener('click', this.event_listeners.stop_click);
      this.textSpeechControlPause.addEventListener('click', this.event_listeners.pause_click);
      this.textSpeechControlPlay.addEventListener('click', this.event_listeners.resume_click);
      this.textSpeechControlRateSetting.addEventListener('click', this.event_listeners.ratesetting_click);
      this.textSpeechControlRateMenu.addEventListener('click', this.event_listeners.ratemenu_click);
      this.textSpeechControlForward.addEventListener('click', this.event_listeners.forward_click);
    },
    "utter_end": function () {
      this.clear_textSpeechControl();
    },
    "utter_boundary": function (e) {
      this.boundary_event(e);
    },
    "speech_start": async function (rate) {
      if (!rate && localStorage.textSpeechRate) {
        rate = localStorage.textSpeechRate;
      }
      var text = textControl.get_text();

      var lang = util.detect_lang(text);

      var utter = new SpeechSynthesisUtterance(text);
      if (rate) {
        utter.rate = rate;
      }
      this.utter = utter;

      if (lang.search('ja') < 0) {
        /* sleepしないとgetVoicesが英語の音声を返さない */
        await util.sleep(500);
      }

      var voices = speechSynthesis.getVoices().filter((a) => a.lang.search(lang) >= 0);
      utter.voice = voices[0];

      this.event_listeners.utter_end = this.utter_end.bind(this);
      this.event_listeners.utter_boundary = this.utter_boundary.bind(this);
      utter.addEventListener('end', this.event_listeners.utter_end);
      utter.addEventListener('boundary', this.event_listeners.utter_boundary);

      speechSynthesis.speak(utter);
    },
    "main": async function () {
      var sel = getSelection();
      var sel_exist = sel.rangeCount && sel.toString().length;

      if (speechSynthesis.speaking && !sel_exist) {
        /* 再生中なら停止 */
        this.stop_click();
      } else {
        this.keepControlOnEnd = true;
        this.stop_click();
        this.keepControlOnEnd = false;

        if (sel_exist) {
          /* これがないと再生が再開されない */
          await util.sleep(500);
        }

        this.show();

        [...document.querySelectorAll(".textSpeechControl_current")].forEach((a) => {
          a.classList.remove("textSpeechControl_current");
        });

        var common_ancestor;

        if (sel_exist) {

          var sel_range = sel.getRangeAt(0);
          textControl.set_sel_range(sel_range);
          common_ancestor = sel_range.commonAncestorContainer;

          if (common_ancestor.nodeType === Node.TEXT_NODE) {
            common_ancestor = common_ancestor.parentElement;
          }

          sel.empty();

        } else {

          var scroll_pos_org = [document.documentElement.scrollLeft, document.documentElement.scrollTop];

          /* 1つ目のスクロール位置で要素を得る */
          scrollTo(0, 0);
          var el_t1 = document.elementFromPoint(document.body.clientWidth / 2, document.body.clientWidth / 3);

          /* 2つ目のスクロール位置で要素を得る */
          scrollTo(0, document.documentElement.scrollHeight / 2);
          var el_t2 = document.elementFromPoint(document.body.clientWidth / 2, document.body.clientWidth / 3);

          scrollTo(scroll_pos_org[0], scroll_pos_org[1]);

          common_ancestor = util.get_common_ancestor(el_t1, el_t2) || document.body;
        }

        this.common_ancestor = common_ancestor;
        textControl.get_text_wrapper(common_ancestor);
        this.speech_start();
      }
    }
  };

  textSpeechControl.main();
})();
