javascript: (() => {/* eslint-disable-line no-unused-labels */
  /*
   * TextSpeechBookmarklet v1.05
   * (c) 2020 Query Kuma
   * Released under the MIT License.
   */
  /* cSpell:ignore meiryo,ratemenu,ratesetting,afterbegin,Bookmarklet,Kuma,Johnson,Jacob,Rideout,Maciej,Ceglowski,Holowaychuk,arrowright */

  var config = {
    /* 一時停止と再開 */
    "use_shortcut_space": true,
    /* 選択範囲以降を再生 */
    "use_shortcut_arrowright": true
  };

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

      /* franc_minの言語からspeechSynthesisの言語に変換。franc_minにオランダ語nlがない */
      var lang_replace = {
        "deu": "de",
        "eng": "en",
        "spa": "es",
        "fra": "fr",
        "hin": "hi",
        "ind": "id",
        "ita": "it",
        "jpn": "ja",
        "kor": "ko",
        "nld": "nl",
        "pol": "pl",
        "por": "pt",
        "rus": "ru",
        "cmn": "zh"
      };
      var franc_languages = Object.keys(lang_replace);

      var franc_lang = util.franc(str, {
        "minLength": 3,
        "only": franc_languages
      });

      var lang = lang_replace[franc_lang];

      return lang;
    }
  };

  /*!
   * franc v5.0.0
   * https://github.com/wooorm/franc
   * (c) 2014 Titus Wormer <tituswormer@gmail.com>
   * (c) 2008 Kent S Johnson
   * (c) 2006 Jacob R Rideout <kde@jacobrideout.net>
   * (c) 2004 Maciej Ceglowski
   * Released under the MIT License
   */
  /*!
   * trim v0.0.1
   * https://www.npmjs.com/package/trim
   * (c) 2012 TJ Holowaychuk <tj@vision-media.ca>
   * Released under the MIT License
   */
  /* eslint-disable-next-line */
  util.franc = function () { var e, a, n, i = {}; function t(i) { if ("number" != typeof i || isNaN(i) || i < 1 || i === 1 / 0) throw new Error("`" + i + "` is not a valid argument for n-gram"); return function (e) { var a, n = []; if (null == e) return n; if (e = e.slice ? e : String(e), (a = e.length - i + 1) < 1) return n; for (; a--;)n[a] = e.slice(a, a + i); return n } } function r(e) { return String(e).replace(/\s+/g, " ") } "use strict", (i = t).bigram = t(2), t.trigram = t(3); var o = r, u = {}; function s(e) { return e.replace(/^\s*|\s*$/g, "") } (u = u = s).left = function (e) { return e.replace(/^\s*/, "") }, u.right = function (e) { return e.replace(/\s*$/, "") }; var d = {}; "use strict"; var l = i.trigram, c = {}.hasOwnProperty; function m(e) { return null == e ? "" : u(o(String(e).replace(/[\u0021-\u0040]+/g, " "))).toLowerCase() } function h(e) { return l(" " + m(e) + " ") } function g(e) { for (var a, n = h(e), i = n.length, t = {}; i--;)a = n[i], c.call(t, a) ? t[a]++ : t[a] = 1; return t } function p(e) { var a, n = g(e), i = []; for (a in n) i.push([a, n[a]]); return i.sort(F), i } function f(e) { for (var a, n = e.length, i = {}; n--;)i[(a = e[n])[0]] = a[1]; return i } function F(e, a) { return e[1] - a[1] } m, h, g, d.asTuples = p, f; var w = { cmn: /[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DB5\u4E00-\u9FEF\uF900-\uFA6D\uFA70-\uFAD9]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/g, Latin: /[A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7BF\uA7C2-\uA7C6\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uAB66\uAB67\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A]/g, Cyrillic: /[\u0400-\u0484\u0487-\u052F\u1C80-\u1C88\u1D2B\u1D78\u2DE0-\u2DFF\uA640-\uA69F\uFE2E\uFE2F]/g, Devanagari: /[\u0900-\u0950\u0955-\u0963\u0966-\u097F\uA8E0-\uA8FF]/g, jpn: /[\u3041-\u3096\u309D-\u309F]|\uD82C[\uDC01-\uDD1E\uDD50-\uDD52]|\uD83C\uDE00|[\u30A1-\u30FA\u30FD-\u30FF\u31F0-\u31FF\u32D0-\u32FE\u3300-\u3357\uFF66-\uFF6F\uFF71-\uFF9D]|\uD82C[\uDC00\uDD64-\uDD67]|[㐀-䶵一-龯]/g, kor: /[\u1100-\u11FF\u302E\u302F\u3131-\u318E\u3200-\u321E\u3260-\u327E\uA960-\uA97C\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/g }, D = { Latin: { spa: " de|os |de | la|la | y | a |es |ón |ión|rec|ere|der| co|e l|el |en |ien|ent|cho|ech|ció|aci|o a|a p| el|al |a l|as |e d| en|ona|na |da |s d|nte| to|ad |ene|con| su| pr|tod| se|ho | pe|los|per|ers| lo| ti|cia|o d|n d|a t|cio|ida|res| es|tie|ion|rso|te | in|do |to |son|dad| re| li|e s|tad|que|pro|est|oda|men|nci| po|a e| qu|ue | un|ne |s y|lib|n e|su | na|s e|ia |nac|e e|tra|or | pa|ado|a d|nes|se |ra |a c|com|nal|por|er |a s|ual|rta| o |ber|les|one|rá |des|s p|dos|sta|ser|ter|ar |era|ibe|ert|ale| di|a a|nto|l d|del|ica|hos|o e|io |imi|oci|n c|s n|ant|cci|re |e c|y l|ame| as|mie|enc| so|o s|ici|las|par|s t|ndi| cu|ara|dic|bre|una|tos|ntr|l p|s l|e a|pre|cla|o t|a y|omo|man|y a|ial|so |nid|n l|n p| al|mo |e p|s s| ig|igu|gua|uma| fu|nta|y e|soc|o p|no |ali|ten|s a|ade|hum|ran|l t|n t|s c|ria|dis|d d| ca|cas|das|ada|ido|l e|y d|tiv|vid|mbr|a i| hu|fun|und|eli|s i| ma|nda|e i| ha|uni|nad|a u|sar|s o| ac|die|qui|rac|ndo| tr|ind| me|ori|tal|odo|ari|lid|esp|o y|tic|ca |un |esa|cti|cua|ier|ta |lar|ons|ont|iva|ide|med|edi|d y|ele|nos|ist|l m|s h|ecc|sti|tor| le|seg|cie|r e|n a|ito|ios|rse|ie |o i|a o|o l|pen|tri|rim|l y|ami|lig|erá|o c|rot|ote|mat|ond|ern|n s|e h|an |ect|lo |ibr|ple|sus|us ", eng: " th|the| an|he |nd |and|ion| of|of |tio| to|to |on | in|al |ati|igh|rig|ght| ri|or |ent|as |ll |is |ed |in | be|e r|ne |ver|one|s t|all|eve|t t| fr| ha| re|s a|ty |ery|d t| pr| or|e h| ev| co|ht |e a|ng |his|ts |yon|be |ing|ce |ryo| sh|n t|fre|ree|men|her|pro|has|nal|sha|es |nat|y a|for| hi|hal|n a|f t|nt | pe|n o|s o| fo|nce|d i|er |e s|res|ect|ons|ity|l b|ly |e e|ry |an |e o|ter|ers|e i| de|cti|hts|eed|edo|dom| wh|ona|re | no|l a| a |e p| un| as|ny |d f| wi|nit| na|nte| en|d a|any|ere|ith| di|e c|e t|st |y t|ns |ted|sta|per|th |man|ve |om |nti|s e|t o|ch | ar|d o|equ|soc|oci|wit|ess|ote|ial|rea| al| fu| on| so|uni|oth| ma| ac| se|enc| eq|qua|ual|ive|lit|thi|int| st|tat|r t|t a|y o|e w|hum|uma|und|led|cia|l o|e f| is|le |f h| by|by | la|ali|are|y i|con|te | wo|eas| hu|ave|o a|com| me|ic |r a|ge |f a|ms |whe| ch|en |n e|rot|tec|tit|s r| li|o t|ple|s d|rat|ate|t f|o o|wor| fa|hou|dis|t i|nda|nde|eli|anc|rom| su|cie|no |ary|inc|son|age|at |oms|oun|nst|s w|d w|ld |n p|nta|l p|tan|edu|n s|duc|itl|tle|whi|hic|ich|ble|o s|imi|min|law|aw |gni|iti| ot|g t|eme|se |e b|ntr|tra| pu|d n|s i|act|e d|ort| he|r s|cou|unt|pen|ily| ag|ces|rit|it |din|s f|hav|ind| ed|uca|cat|ren|ien|tho|ern|d e|omm", por: "os |de | de| a | e |o d|to |ão | di|ent|da |ito|em | co|eit|as |dir|ire|es |rei| se|ção|ade|a p|e d|s d|dad|men|nte|do |s e| pe| pr|dos| to| da|o e| o |a a|o a|ess|tod|con| qu|que| do|e a|te |al |res|ida|m d| in|er | ou|sso| re| na|a s| po|uma| li|cia| te|pro|açã|e e|ar |a d|a t|ue | su| es|ou |s p|a e|tos|des|com|ra |ia |tem|no | pa|ame|nto|e p|is |est|oda|na |s o|tra|ões|das|pes|soa|o s|s n|o p|ser|s a| à |ais| as| em|o o|e o|ber|oa |o t|ado|a c|sua|ua | no|ter|man|e s| os|s s|e n|çõe|ica|lib|ibe|erd|rda|nci|odo|nal|so |ntr|or |ura|s t|o c|ona| so| ao|hum|ual|sta|ma |ons|a n|era|e t|pre|ara|r a|por| hu|cio|o à|ria|par|ind|e c|ran|gua| um|o i|a l|s c|ndi|m a| en|und|nos|e r|ano|aci|ion|soc|oci|nid|sen|raç| ac|ndo|nsi| ig|igu| fu|fun|m o|nac|per|ali|rec|ime|ont|açõ|int|r p| al|um | me|a i|s h|nta|rio|cçã|ere|pel|l d|a o| ex|pri|uni|ese|ada| ma|ant|ide|nda| fa|am |e f|lid|io |ém |ita|iva|omo|o r|esp|a f|m p|lic|ca |s f|naç|pod|ode|ver|a q|r e|tad|tiv|vid|e l|o q|r d|e i|seu|eli|mo |ecç|s i|ial|ing|ngu|s l| vi|ist|ta |eci|ênc|a m| ca|der|ido|ios| un|dis|cla|qua|se |ati|sti|r o|sid|roc| tr|sem|o n|ao |dam|ens|tur|ico|rot|ote|tec|sse|l e|ena|for| pl| ni|nin|gué|uém|não|ela|tro|ros|ias", ind: "an |ang| da|ng | pe|ak | ke| me| se|ata|dan|kan| di| be|hak|ber|per|ran|nga|yan|eng| ya| ha|asa|men|gan|ara|nya|n p|n d|n k|a d| at|tan|at |ora|ala| ba|san|erh|ap |ya |rha|n b| ma|a s|pen|g b|eba|as |aan| or|ntu|uk |eti|tia|tas|aka|set|ban|n s| un|n y| te|ter|iap|tuk|k m|beb|bas|lam| de|n m|k a|keb|am |i d|ama|unt|ah |dal|end|n h|p o|den|sa |dak|mem|ika|ra |ebe|pun|ri |nda|ela|ma | sa|di |a m|n t|k d|ngg|n a|tau|asi| ti|eri|gar|man|ada|al |um |un |ari|au |lak|a p|ta |a b|ngs|ole| ne|neg|dar|ers|gsa|ida|leh|ert|k h|ana|sam|sia|i m|ia |dap|era|dil|ila|tid|eh |h d|atu|bat|uka|aha|a a|ai |g d|lan|tu |t d|uan| in|ena|har|sem|ser|kat|erl|apa|erb|uat|na |kum|g s|ung|nan|emp|rta|l d|mas|ega|n u| hu|ka |eni|pat|mba|adi| su|aga|ent|nta|huk|uku|rga|ndi|ind|i s|ar |sua|aku|rus|n i|ni |car|si |nny|han| la|in |u d|lah|ik |gga|ua |ian|ann|lai|usi|emb|rik|mer|erk|arg|emu|dun|dip|nas|lua|aru|ema|a u|min|mat|aya|kes|rak|eka|a t|rka|a k|iba|rbu|rma|yat|ini|ina|anu|nus|mua|s p|ut |lin| ta|us |ndu|da |pem|ami|sya|yar|nak|das|k s|kel|ese|mel| pu|ern|a n|aik|uar|t p|g p|ant|ili|dik| an|tin|ing|ipe|tak|iny|ain| um| ja|aks|sar|rse|aup|upu|seo|eor|g m|g t|dir|pel|ura|bai|aba|erd|eca|h p|kep|m m|jam|umu|mum", fra: " de|es |de |ion|nt |et |tio| et|ent| la|la |e d|on |ne |oit|le |e l| le|s d|t d|ati|e p|roi|it | dr|dro| à | co|té |ns |te |e s|men|re | to|tou| l’|con|que|les| qu| so| pe|des|son|ons|s l| un| pr|ue |s e| pa|e c|ts |t l|onn| au|e a|e e|eme| li|ant|ont|out|ute|ers|res|t à| sa| a |ce |per|tre|a d|er |cti| en|ité|lib| re|en |ux |lle|rso| in| ou|un |à l|nne|nat|une|ou |n d|us |par|nte|ur | se| d’|dan|ans|s s|pro|e t|s p|r l|ire|a p|t p|its|és |ond|sa |a l|nce|é d| dé|nal|aux|omm|me |ert| fo| na|iqu|ect|ale| da| ce|t a|s a|mme|ibe|ber|rté|s c|e r|al |t e| po|our|com|san|qui|e n|ous|r d| ne|fon|au |e o|ell|ali|lit| es| ch|iss|tes|éra|air|s n| di|ter|ui | pl|ar |aut|ien|soc|oci|tra|rat|êtr|int|été|pou|du |est|éga|ran|ain|s o|eur|ona|rs |anc|n c|rai|pri|cla|age|nsi|e m|s t| do|bre|sur|ure|ut | êt| ét|à u|ge |ess|ser|ens| ma|cia|l e| su|n p|a c|ein|st |bli| du|ntr|rés|sen|ndi|ir |n t|a s|soi| ég|ine|l’h|nda|rit| ré|t c|s i|il |l’a|e q| te|é e|t s|qu’|ass|ais|cun|peu|ée |tat|ind|t q|u d|n a| ac|tés|idé|l n|ill| as|’en|ign|gal|hom|nta| fa|lig|ins| on|ie |rel|ote|t i|n s|sse| tr|n e|oir|ple|l’e|s é|ive|a r|rec|nna|ssa| mo|s u|uni|t ê|pré|act| vi|era|sid| nu|e f|pay|’ho|cat|leu|ten|rot|tec|s m", deu: "en |er |der| un|nd |und|ein|ung|cht| de|ich|sch|ng | ge|ie |che| di|die|ech|rec|gen|ine|eit| re| da|ch |n d|ver|hen| zu|t d| au|ht | ha|lic|it |ten|rei| be|in | ei| in| ve|nde|auf|ede|den|n s|zu |uf |ter|ne |fre| je|jed|es | se| an|n u|and|sei|run| fr|at |s r|das|hei|hte|e u|ens|r h|nsc|as |nge| al|ere|hat|men|lle|nte|rde|t a|ese|ner| od|ode| we|g d|n g|all|t u|ers| so|d d|n a|nen|te |lei| vo|wer| gr|ben|ige|e a|ion| st|ege|le |cha| me|ren|n j|haf|aft| er|erk|bei|ent|erd| si|kei|tig|eih|ihe|r d|len|on |n i|lun| gl|chu|e s|ist|st |unt|ern|tli|gem|ges|ft |ati|tio|gru|end|ies|mit|eic|sen|r g|e e|ei | wi|n n| na|sta|gun|ite|n z|r s|gle|chl|lie|mei|em |uch|nat|n w|urc|rch|de |hre| sc|sse|ale|ach|r m|des|n e|spr|t w|r e|d f| ni| du|dur|nie| mi|ied|fen|int|dar|e f|e g|geh|e d|f g|t s|ang|ste|hab|abe|h a|n v|alt|tz |hli|sic|her|nun|eme|ruc|taa|aat|he |e m|erf|ans|geg| is|tun|pru|d g|arf|rf |n o|ndl|ehe|e b|h d|d s|dig|arb|wie|r b| ih|r w|nsp|ber|t i|r a|r v|igk|gke|bes|n r|str|gew|rbe|ema|e v|n h| ar|rt |ind|n f|ins|esc|ieß|ken|ger|eru|ffe|ell|han|igu|man|sam|t g|ohn|hul|rst|tra|rli|lte|hut|utz|ls |ebe|von|r o|e i|nne|etz|d a|rn |isc|sel| fa|one|son|et |aus|r i|det|da |raf|iem|e z|lan|sow", ita: " di|to |ion| de| in|la |e d|ne |di | e |zio|re |le |ni |ell|one|lla|a d|rit|o d|itt|del| co|dir|iri|ti |ess|ent| al|azi|tto|te |i d|i i|ere|tà | pr|ndi|e l|ale|ind|o a|e e|gni|e i|nte|con|li |a s| un|i e|ogn|men|uo | og| ne|idu|ivi|e a|div|vid|duo| ha|tti| es|a p|no | li|za |pro|ato|all|sse|per|ser| so|i s| la| su|e p| pe|a l|na |ibe|ali| il|il |e n|lib|ber|e c|ia |ha |che|e s|o s|o e| qu|in |nza|ta |nto| ri|he |o i|oni|sta| o | a |o c|nel|e o|naz|so |o p|o h|gli| po|i u|ond|i p|ame|ers|i c|ver|ro |ri |era|un |lle|a c|ua | ch|ssi|una|el |i a|ert|rtà| l |a a|tat|ant|dis|ei |a e| si| ad|à e|nal| da| le|est|pri|nit|ter|ual| st|ona|are|ità|dei|cia|gua|anz|tut| pa|al | ed| re|sua|ono| na|uni|raz|si |ita|com|ist|man|ed |der|ad |i o|enz|soc|que|res| se|o o|ese| tu|i r|io |ett|à d|on |dic|sia|rso|se |uma|ani|rio|ari|ial|eri|ien|ll |oci|rat|tra|ich|pre|qua|do | um|a t|i l|zza|sci|tri|er |ico|pos|a n|ara|o n|son|att| fo|fon|nda|utt|par|nti|sti|nes|n c| i |chi|hia|iar|int|sen|e u|str|uzi|ati|a r|rop|opr|egu| me|ra |ann| ma| eg|ost|bil|isp|ues| no|ont|rà |tta|ina|ezz|l i|tal| ra|gio|nno|a i|d a|i m|ria| cu|ore|e r|izi|dev|tan|lit|cie|non|sso|sun|ite|ica|l d|ide|lia|cos|i n|nta|a f| is|l p|art", pol: " pr|nie| i |ie |pra| po|ani|raw|ia |nia|go |wie| do|ch |ego|iek|owi| ni|ści|ci |awo|a p|do | cz|ośc|ych| ma|ek |rze|prz| na|wo | za| w |ej |noś|czł|zło|eni| je|wa |łow|i p|wol|oln| lu|rod| ka|wsz| wo|lno|y c|ma |każ|ażd|ny |dy |o d|stw|owa|żdy| wy|rzy|ecz|sta| sw|e p|twa|czn|dzi|i w|szy|zys|na |ów |lub|ub |a w|k m|est| sp|kie|wan|ają| ws|pow|e w|spo|nyc|pos|rac|a i|cze|yst|ać |neg|sze|ne |mi |aro|ńst| ja|jak|o p|pod| z |acj|obo| ko|i i|nar|i n| ro|awa| ró|zy |dow|zen|zan|zne|zec|jąc|iej|cy |rów|nej|odn|nic|czy|o s|no |ony|aw |i z|ówn|odz|jeg|o w|edn|o z|aki|o o|a s| st|ni |bez|owo| in|ien|eńs|ami| or|dno|zie|mie| ob|kol|stę|tęp|i k|ez |w c|poł|ołe|łec|ym |orz|jed|o u| os|olw|lwi|wia|ka |owy|owe|y w| be|o n|jes|wob|wyc|a j| od|zna|inn|zyn|aln|któ|cji|ji |się|i s|raz|y s|lud| kr|ją |cza|zes|nik|st |swo|a o|sza|ora|icz|kra|a z|h p|i o|ost|roz|war|ara|że |lni|raj| si|ię |e o|a n|em |eka|stk|tki|pop|ą p|iec|ron|kow|odo|w p|peł|ełn|ran|wni|dni|ows|ech|gan|dów|zon|pie|a d|i l| kt|tór|ini|ejs| de|dek|ywa|iko|z w|god|ków|adz|dst|taw| to|trz|e i|ich|dzy|by |bod|iu |nan|h i|chn|zeń|y z|ano|udz|ieg|w z|ier|ale|a k|z p|zaw|ekl|kla|lar|any|du | zw| go|o r|to |az |y n|ods|ymi|ju |och|nau|wej|i m", nld: "en |de |an | de|van| va| en| he|ing|cht|der|ng |n d|n v|et |een|ech| ge|n e|ver|rec|nde| ee| re| be|ede|er |e v|gen|het|den| te|ten| op| in|n i| ve|lij| zi|zij|ere|eli|ijk|oor|ht |te |ens|n o|and|t o|ied|ijn| on|ke |op |eid| vo|jn |id |ond|in |sch| vr|n z|rde|aan| ie|aar|ren|men|rij|hei|ord|hte|eft| we|ft |n g|n w|or |n h|eef| me|wor|vri|t r|hee|al |le |of |ati| of|g v|lle|e b| wo|eni| aa|voo|r h|n a| al|nd |e o|n t|ege|erk|t h|jke| na|sta|at | da|e e|end|nat| st|nge|ste|e g|tie|n b|om |die|e r|r d|erw|ij |dig|e s| om|wel|t e|ige|ter|gel|ie |e m|re |t d| za|ers|ijh|jhe|d v|zal|nig|nie|bes|ns |e w|est|d e|g e|e n|ele| do|ge |vol|che|e d|ig |gin|eze|nst|ona|eke|cha|hap|dat|lke|e a| di|waa| to|min|jk |tel| gr|len|eme|lin|elk|ard|doo| wa|eve|ven|n s|str|gro|han|del|ich| ov|ove|n n|t v|tio|ion|wet|it |gem|ijd|met| zo|uit|aat|dez|ze |rin|e i|all|st |ach| ni|toe|n m|ies|es |taa|per|hed|heb|ebb|bbe|ien|sti| ma|nte|ale|kin|nin|mee|daa|el |ben|ema|man|s e|e h|esc|her|lan|ang|ete|g o|wer|is | er|pen|nsc|beg|igd|t g|ont|iet|tig|ron|tin|p v|r e|rwi|wij|ijs| hu|erm|nal|bij|eer|edi|ite|t a|t w|d o|naa|weg|iem|g d|teg|ert|arb|als|d z|tan|tre| la|ar |ame|js |rmi|t b|app|rwe| bi|t z|ker|eri|ken| an" }, Cyrillic: { rus: " пр| и |рав|ств| на|пра|го |ени|ове|во |ани| ка|ть | по| в | об|ия |лов| св|сво|на | че|о н|ело|ост| со|чел|ие |ого|ния|ет |ест|аво|ажд|ый | им|век|ние| не|льн|име|ова|ли |ать|т п|при|каж|и п| ра|или|обо|жды| до|ых |дый|ек |воб|бод|й ч|его|ва |ся |и и|мее|еет|но |и с|аци|ии |тва|ой |лен|то | ил|ных|к и|енн|ми |тво| бы| за|ию | вс|аль|о с|ом |о п|о в|и н|ван|сто|их |ьно|нов|ног|и в|про|ако|сти|ий |и о|бра|пол|ое |дол|олж|тор| во|раз|ти |я и|я в| ос|ным|нос|жен|все|и р| ег|не |ред|тел|ель|ей |сно|оди|о и|а и|чес|общ|тве|щес| ко|ним|има|как| ли| де|шен|нно|е д|пре|осу| от|тьс|ься|вле|нны|аст|осн|а с|одн|ран|бще|лжн|быт|ыть|сов|нию| ст|сту|ват|рес|е в|оль|ном|чен|иче| ни|ак |ым |что|стр|ден|туп|ду |а о|ля |зов|ежд|нар|род|е и| то|ны |вен|м и|рин|нац|вер|оже|ую | чт|она|обр|ь в|й и| ме|аро|ото|лич|нии|бес|есп|я п|х и|о б|ем |е м| мо|дос|ьны|тоя|еоб|ая | вы| ре|и к|кот|ное|под| та|жно|ста| го|гос|суд|ам |ава|я н| к |ав |авн|ход|льс|нст| бе|ово|и д|ели| дл|для|ной|вов|ами|ате|оро|дно|ен |печ|ече|ка |еск|ве |уще|в к|нен|мож|уда|о д|ю и|ции|ког|вно|оду|жде|и б|тра|сре|дст|от |ьст|е п|нал|пос|о о|вны|сем|азо|тер|соц|оци|циа|ь п|олн|так|кон|ите|обе|изн| др|дру|дов|е о| эт|х п|ни |еди|дин|му " }, Devanagari: { hin: "के |प्र| के| और|और |ों | का|कार| प्|का | को|ं क|या |ति |ार |को | है|िका|ने |है |्रत| अध|धिक|की |अधि|ा क| कि| की| सम|ें |व्य|्ति|क्त|से | व्|्यक|ा अ|में|मान|ि क| स्| मे|सी |न्त|े क| हो|ता |यक्|ै ।|क्ष|त्य|िक | कर| या|्य |भी | वि|रत्|ी स| जा|र स|्ये|येक|ेक |रों|स्व|िया|ा ज|त्र|क व|र ह| अन|्रा|ित |किस|ा स|िसी|ा ह| से|ना |र क| पर| सा|गा |देश| । | अप|ान |समा|्त |े स|्त्|ी क|ा प| ।प|वार| रा|न क|षा |अन्|।प्|था |ष्ट| मा|्षा|्वा|ारो|तन्| इस|े अ|ाप्|प्त|राष|ाष्|्ट्|ट्र|्वत|वतन| उस|राप|त ह|कि | सं|ं औ|हो | दे|किय|ा ।|े प|ार्| भी|करन| न |री |र अ|जाए|क स|ी प|िवा|सभी|्तर|अपन| नि| तथ|तथा|रा |यों|े व|ाओं|ओं |पर |सम्|्री|ीय |सके|व क| द्|द्व|ारा|िए | ऐस|रता| सभ|िक्|ो स|रक्|र प|माज|्या|होग|र उ|ा व|रने| जि|ं म|े म|ाव |ाएग| भा|पने| लि|स्थ|पूर|इस |त क|ाने|रूप|भाव|लिए|े ल|कृत|र्व|ा औ|ो प|द्ध| घो|घोष|श्य|ेश |। इ| रू|ूप |एगा|शिक|े ब|दी | उन|रीय|रति|ूर्|न्य|्ध |णा |ी र|ं स|र्य|य क|परा| पा|े औ|ी अ|ेशो|शों|ानव|ियो|म क| शि| सु|तर्|जो |्र |तिक|सार|चित| पू|ी भ|जिस|ा उ|दिय|राध|चार|र द|विश|स्त|ारी|परि| जन|वाह|नव | बु|म्म|ले |्म |र्ण| जो|ानू|नून|िश्|गी |साम|ोगा|रका|्रो|ोषण|षणा|ाना|ो क|े य| यह|चूं|ूंक|ंकि|अपर|कोई|ोई |ाह |ी म| ।क|ी न|ा ग|ध क|े ज|न स|बन्|निय|याद|ादी|्मा| सद|जीव|हित|य ह|कर |ास |ी ज|ाज |ं न|्था|ामा|कता" } }, b = {}; "use strict", v.all = j, b = v; var k = 2048, z = 10, y = 300; function v(e, a) { return j(e, a)[0][0] } function j(e, a) { var n, i = a || {}, t = z, r = [].concat(i.whitelist || [], i.only || []), o = [].concat(i.blacklist || [], i.ignore || []); return null !== i.minLength && void 0 !== i.minLength && (t = i.minLength), !e || e.length < t ? O() : (n = C(e = e.slice(0, k), w))[0] in D ? A(e, B(d.asTuples(e), D[n[0]], r, o)) : 0 !== n[1] && L(n[0], r, o) ? S(n[0]) : O() } function A(e, a) { for (var n = a[0][1], i = e.length * y - n, t = -1, r = a.length; ++t < r;)a[t][1] = 1 - (a[t][1] - n) / i || 0; return a } function C(e, a) { var n, i, t, r = -1; for (i in a) (t = E(e, a[i])) > r && (r = t, n = i); return [n, r] } function E(e, a) { var n = e.match(a); return (n ? n.length : 0) / e.length || 0 } function B(e, a, n, i) { var t, r = []; for (t in a = x(a, n, i)) r.push([t, q(e, a[t])]); return 0 === r.length ? O() : r.sort(N) } function q(e, a) { for (var n, i, t = 0, r = -1, o = e.length; ++r < o;)(n = e[r])[0] in a ? (i = n[1] - a[n[0]] - 1) < 0 && (i = -i) : i = y, t += i; return t } function x(e, a, n) { var i, t; if (0 === a.length && 0 === n.length) return e; for (t in i = {}, e) L(t, a, n) && (i[t] = e[t]); return i } function L(e, a, n) { return 0 === a.length && 0 === n.length || (0 === a.length || -1 !== a.indexOf(e)) && -1 === n.indexOf(e) } function O() { return S("und") } function S(e) { return [[e, 1]] } function N(e, a) { return e[1] - a[1] } return function () { var e, a, n, i, t, r; for (t in D) for (a in e = D[t]) { for (r = (i = e[a].split("|")).length, n = {}; r--;)n[i[r]] = r; e[a] = n } }(), b }();

  var textControl = {
    "text": "",
    "text_obj_lst": [],
    "cur_text_obj": null,
    "update_text_obj_lst": function () {
      var cur_text_obj_idx = this.text_obj_lst.indexOf(this.cur_text_obj);
      this.text_obj_lst = this.text_obj_lst.slice(cur_text_obj_idx);
    },
    "get_top_from_index": function (text_node, index) {
      var r = new Range();
      r.setStart(text_node, index);
      r.setEnd(text_node, index + 1);
      return r.getBoundingClientRect().top;
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

          /* eslint-disable-next-line no-use-before-define */
          if (textSpeechControl.auto_scroll) {

            /* boundary_eventはtext_objの位置indexにある */
            var index = text_obj.len - sum + charIndex + 1;
            var top = this.get_top_from_index(text_obj.node, index);

            var lower_limit = document.documentElement.clientHeight * 0.2;
            var upper_limit = document.documentElement.clientHeight * 0.6;

            if (top < lower_limit || top > upper_limit) {
              var new_scroll_top = document.documentElement.scrollTop + top - lower_limit;
              scroll(0, new_scroll_top);
            }
          }

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
      if (["NOSCRIPT", "CODE", "RP", "RT", "TITLE"].indexOf(node.nodeName.toUpperCase()) >= 0) {
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
    "auto_scroll": true,
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
        this.stop_click_removeEventListeners(utter, option);
      }
    },
    "pause_click": function () {
      this.textSpeechControlPause.classList.toggle('textSpeechControlHide');
      this.textSpeechControlPlay.classList.toggle('textSpeechControlHide');
      this.textSpeechControlRateMenu.classList.add('textSpeechControlHide');

      this.textSpeechControlForward.style.display = (this.auto_scroll &&
        this.textSpeechControlPlay.classList.contains("textSpeechControlHide"))
        ? "none"
        : "";

      speechSynthesis.pause();
    },
    "resume_click": function () {
      this.textSpeechControlPause.classList.toggle('textSpeechControlHide');
      this.textSpeechControlPlay.classList.toggle('textSpeechControlHide');
      this.textSpeechControlRateMenu.classList.add('textSpeechControlHide');

      this.textSpeechControlForward.style.display = (this.auto_scroll &&
        this.textSpeechControlPlay.classList.contains("textSpeechControlHide"))
        ? "none"
        : "";

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
      /* ここにあるのは後から追加したから */
      if (e.target.id === "textSpeechControlAutoScroll") {
        this.auto_scroll = !this.auto_scroll;
        if (this.access_localStorage) {
          localStorage.auto_scroll = this.auto_scroll;
        }
        e.target.textContent = this.auto_scroll ? "ON" : "OFF";

        this.textSpeechControlForward.style.display = (this.auto_scroll &&
          this.textSpeechControlPlay.classList.contains("textSpeechControlHide"))
          ? "none"
          : "";
        this.textSpeechControlRateMenu.classList.add('textSpeechControlHide');
        return;
      }

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

      if (this.access_localStorage) {
        localStorage.textSpeechRate = rate;
      }
      this.keepControlOnEnd = false;
    },
    "forward_click": async function () {
      this.textSpeechControlRateMenu.classList.add('textSpeechControlHide');

      var sel = getSelection();
      var sel_exist = sel.rangeCount && sel.toString().length;
      var common_ancestor;

      if (!sel_exist) return;

      var sel_range = sel.getRangeAt(0);
      textControl.set_sel_range(sel_range);
      common_ancestor = util.get_common_ancestor(sel_range.commonAncestorContainer, this.common_ancestor);

      sel.empty();

      this.textSpeechControlPause.classList.remove('textSpeechControlHide');
      this.textSpeechControlPlay.classList.add('textSpeechControlHide');

      this.textSpeechControlForward.style.display = (this.auto_scroll &&
        this.textSpeechControlPlay.classList.contains("textSpeechControlHide"))
        ? "none"
        : "";

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
    "document_keydown": function (e) {

      /* ブックマークレットを起動して読み上げを停止したらkeydownイベントが残る。windowに値を置いて回避 */
      if (!(window.text_speech_bookmarklet && window.text_speech_bookmarklet.id === this.id)) {
        document.removeEventListener('keydown', this.event_listeners.document_keydown);
        return;
      }

      switch (e.code) {
        case 'Space':

          e.preventDefault();

          if (speechSynthesis.paused) {
            this.resume_click();
          } else {
            this.pause_click();
          }

          break;

        case 'ArrowRight':

          if (this.auto_scroll && !(config.use_shortcut_arrowright && speechSynthesis.paused)) {
            break;
          }

          e.preventDefault();
          this.forward_click();

          break;

        default:
          break;
      }
    },
    "show": function () {

      /* document_keydownで使用 */
      this.id = Symbol('id');
      window.text_speech_bookmarklet = { "id": this.id };

      document.body.insertAdjacentHTML('afterbegin', `
<style class="textSpeechControl">
.textSpeechControl{font-family:"meiryo"!important;font-size:14px!important;z-index:2000000000;position:fixed;right:20px;bottom:20px;background-color:rgba(28,28,28,0.9);padding:2px 8px;user-select:none!important;}
.textSpeechControl2{display:inline-block;color:white;cursor:pointer;}
.textSpeechControl3{letter-spacing:-8px;padding-left:0;padding-right:8px;}
.textSpeechControlHide{display:none;}
.textSpeechControl_current{outline:solid red 1px !important;outline-offset:-1px;}
.textSpeechControl4{position:absolute;bottom:30px;right:20px;width:80px;text-align:center;background-color:rgba(28,28,28,0.9);color:white;}
.textSpeechControl5:hover{background-color:rgba(255,255,255,.1);cursor:pointer;}
.textSpeechControl6:hover{background-color:rgba(255,255,255,.1);cursor:pointer;}
.textSpeechControl_currentRate:before{position:absolute;content:'✔';left:5%;}
.textSpeechControlIconWrapper{position:relative;display:inline-block;width:20px;height:20px;padding:2px;box-sizing:border-box;margin-right:0px;margin-bottom:-5px;background-color: black;}
.textSpeechControlIconForward{position:absolute;margin-left:2px;margin-top:1px;width:0;height:0;border-left:7px solid white;border-top:7px solid transparent;border-bottom:7px solid transparent;}
.textSpeechControlIconForward:after{content:'';position:absolute;top:-7px;left:0;border-left:7px solid white;border-top:7px solid transparent;border-bottom:7px solid transparent;}
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
  <div>位置調整</div>
  <div class="textSpeechControl6" id="textSpeechControlAutoScroll">OFF</div>
 </div>
 <span class="textSpeechControl2" id="textSpeechControlStop" title="停止">■</span>
 <span class="textSpeechControl2" id="textSpeechControlPause" title="一時停止"><span class="textSpeechControl3">┃┃</span></span>
 <span class="textSpeechControl2 textSpeechControlHide" id="textSpeechControlPlay" title="再開">&#x25b6;</span>
 <span class="textSpeechControl2" id="textSpeechControlForward" title="選択範囲以降を再生"><div class="textSpeechControlIconWrapper"><div class="textSpeechControlIconForward"></div></div></span>
</span>`);

      this.textSpeechControlStop = document.getElementById('textSpeechControlStop');
      this.textSpeechControlPause = document.getElementById('textSpeechControlPause');
      this.textSpeechControlPlay = document.getElementById('textSpeechControlPlay');
      this.textSpeechControlRateSetting = document.getElementById('textSpeechControlRateSetting');
      this.textSpeechControlRateMenu = document.getElementById('textSpeechControlRateMenu');
      this.textSpeechControlForward = document.getElementById('textSpeechControlForward');
      textControl.textSpeechControl = document.getElementById('textSpeechControl');
      this.textSpeechControlAutoScroll = document.getElementById('textSpeechControlAutoScroll');

      this.textSpeechControlAutoScroll.textContent = this.auto_scroll ? "ON" : "OFF";
      this.textSpeechControlForward.style.display = this.auto_scroll ? "none" : "";

      this.event_listeners.stop_click = this.stop_click.bind(this);
      this.event_listeners.pause_click = this.pause_click.bind(this);
      this.event_listeners.resume_click = this.resume_click.bind(this);
      this.event_listeners.ratesetting_click = this.ratesetting_click.bind(this);
      this.event_listeners.ratemenu_click = this.ratemenu_click.bind(this);
      this.event_listeners.forward_click = this.forward_click.bind(this);
      this.event_listeners.document_keydown = this.document_keydown.bind(this);

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
    "speech_start_addEventListeners": function (utter) {

      this.event_listeners.utter_end = this.utter_end.bind(this);
      this.event_listeners.utter_boundary = this.utter_boundary.bind(this);
      this.event_listeners.document_keydown = this.document_keydown.bind(this);

      utter.addEventListener('end', this.event_listeners.utter_end);
      utter.addEventListener('boundary', this.event_listeners.utter_boundary);

      if (config.use_shortcut_space) {
        document.addEventListener('keydown', this.event_listeners.document_keydown);
      }
    },
    "stop_click_removeEventListeners": function (utter, option) {

      utter.removeEventListener('end', this.event_listeners.utter_end);
      utter.removeEventListener('boundary', this.event_listeners.utter_boundary);
      document.removeEventListener('keydown', this.event_listeners.document_keydown);

      if (option.keepListeners) return;

      this.textSpeechControlStop.removeEventListener('click', this.event_listeners.stop_click);
      this.textSpeechControlPause.removeEventListener('click', this.event_listeners.pause_click);
      this.textSpeechControlPlay.removeEventListener('click', this.event_listeners.resume_click);
      this.textSpeechControlRateSetting.removeEventListener('click', this.event_listeners.ratesetting_click);
      this.textSpeechControlRateMenu.removeEventListener('click', this.event_listeners.ratemenu_click);
      this.textSpeechControlForward.removeEventListener('click', this.event_listeners.forward_click);
    },
    "speech_start": async function (rate) {
      if (!rate) {
        if (this.access_localStorage && localStorage.textSpeechRate) {
          rate = localStorage.textSpeechRate;
        }
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

        if (lang.search('en') < 0) {
          console.log('lang:', lang);
        }
      }

      var voices = speechSynthesis.getVoices().filter((a) => a.lang.search(lang) >= 0);
      utter.voice = voices[0];

      this.speech_start_addEventListeners(utter);

      speechSynthesis.speak(utter);
    },
    "check_localStorage": function () {
      try {
        void (localStorage);
      } catch (e) {
        this.access_localStorage = false;
        return;
      }
      this.access_localStorage = true;
    },
    "main": async function () {

      delete window.text_speech_bookmarklet;

      this.check_localStorage();

      if (this.access_localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, 'auto_scroll')) {
          this.auto_scroll = JSON.parse(localStorage.auto_scroll);
        }
      }

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
