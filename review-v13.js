(function () {
  'use strict';

  var BEST_BY_PROD = {
    '101': ["c20241230ogvhzjjlnge5o","c20241229n2i1ztexytewn","c20241230zgqymgnlmmjim","c20241227ytjmmgu4mjqwz","c20241230ogywnzc0yzu2m","c20241229ntviotrmzjriz","c20241225nmiwztcxn2m4y","c20241223mmvkmwe1otewn","c20241226ngq0ogfkzdq4y"],
    '100': ["c20240610yjixm2q1mtjjn","c20240610mzbkzjexmti4m","c20240610owiyzmi1mdewz","c20240610yjnmywu1zjk1z","c20240610yjgxnjk3zjvio","c20240610odu5mwrmzwrhm","c20240610ndkwn2e5otg4m","c20240610mgu1otm5zdewo","c20240610odyxoty0ymjmn","c20240610zjjhntnmmzllz"],
    '80':  ["c202406101423823dd77d4","c2024061043d15ae38f457","c20240610453b1e1c05853","c20240610be17a570cd48e","c20240610828f10779d94c","c2024061082c415ca63832","c20240610a2477783cbaaf","c20240610f6e82fd841e39","c20240610fb62507116b8b","c20240610da8763b1ae486"],
    '83':  ["c202412306cb25e2826e4b","c2024122910a415f8a3e7d","c20241230c3b2fb565973d","c202412273337f54581da6","c2024123011c57153ecd7d","c202412292830ce5018ba9","c20241225d2a7d53c5ade6","c202412238b266d6caf651","c20241226bfdc6973fd87f"]
  };

  var CFG = {
    changeSliderClick: false,
    bestSlider:        true,
    photoReverse:      true,
    mainOldestFirst:   true,
    hideStarFilter:    true
  };

  var BUSY = false, deb = null;
  function J(){ return window.jQuery; }

  function currentProdIdx(){
    var el = document.querySelector('[data-prod-idx]');
    if(el){ var v = el.getAttribute('data-prod-idx'); if(v) return String(v); }
    var m = (location.search||'').match(/[?&]idx=(\d+)/);
    return m ? m[1] : null;
  }
  function bestListForProd(){
    var pid = currentProdIdx();
    return (pid && BEST_BY_PROD[pid]) ? BEST_BY_PROD[pid] : null;
  }

  function fileKey(url){
    if(!url) return '';
    var m = String(url).match(/\/([^\/?#]+\.(?:png|jpe?g|gif|webp))/i);
    return m ? m[1].toLowerCase() : '';
  }

  function buildIdxMap(){
    var map = {};
    document.querySelectorAll('.review_image_list .item').forEach(function(a){
      var oc = a.getAttribute('onclick') || '';
      var mm = oc.match(/viewReviewDetail\(\s*'?(\d+)'?/);
      if(!mm) return;
      var div = a.querySelector('div');
      var key = div ? fileKey(div.style.backgroundImage) : '';
      if(key) map[key] = mm[1];
    });
    return map;
  }

  var swiperWired = false;
  function onChangeSliderClick(e){
    var t = e.target;
    var a = t && t.closest ? t.closest('a.css-8ebp35') : null;
    if(!a) return;
    if(!a.closest('.review1, .review2')) return;
    e.preventDefault(); e.stopPropagation();
    var img = a.querySelector('img');
    var key = img ? fileKey(img.getAttribute('src')) : '';
    if(!key) return;
    var map = buildIdxMap();
    var idx = map[key];
    if(idx && window.SITE_SHOP_DETAIL && SITE_SHOP_DETAIL.viewReviewDetail){
      SITE_SHOP_DETAIL.viewReviewDetail(idx, 0, 'Y');
    }
  }
  function wireChangeSlider(){
    if(!CFG.changeSliderClick || swiperWired) return;
    if(!document.querySelector('.review1, .review2')) return;
    document.addEventListener('click', onChangeSliderClick, true);
    swiperWired = true;
    var st=document.createElement('style');
    st.textContent='.review1 a.css-8ebp35,.review2 a.css-8ebp35{cursor:pointer}';
    document.head.appendChild(st);
  }

  function owlBg($d){
    if(!$d || !$d.length) return '';
    var bg = ($d[0].style && $d[0].style.backgroundImage) || '';
    var mm = bg.match(/url\(["']?([^"')]+)["']?\)/);
    if(mm) return mm[1];
    bg = $d.css('background-image') || '';
    mm = bg.match(/url\(["']?([^"')]+)["']?\)/);
    if(mm && mm[1] !== 'none') return mm[1];
    return $d.attr('data-src') || $d.attr('data-bg') || $d.attr('data-original') || '';
  }

  function buildPhotoStrip(){
    if(!CFG.photoReverse) return;
    if(!M.bestData || !M.bestData.length) return;
    var $ = J(); if(!$) return;

    $('.review_image_list .owl-carousel').each(function(){
      var $owl = $(this);
      if(!$owl.hasClass('owl-loaded')) return;
      if($owl.data('revStripDone')) return;

      BUSY = true;
      try{
        var bestIdxOrder = {};
        var order = 0;
        M.bestData.forEach(function(d){
          if(d.detailIdx){ if(bestIdxOrder[String(d.detailIdx)]===undefined) bestIdxOrder[String(d.detailIdx)] = order; }
          order++;
        });
        var bestCount = M.bestData.length;

        var seen = {}, all = [], seq = 0;
        $owl.find('.owl-item').not('.cloned').each(function(){
          var $a = $(this).children('.item').first();
          if(!$a.length) return;
          var oc = $a.attr('onclick') || '';
          var m = oc.match(/viewReviewDetail\(\s*'?(\d+)'?/);
          var idx = m ? m[1] : ('_'+seq);
          var img = owlBg($a.children('div').first());
          if(!img) return;
          if(seen[idx]) return;
          seen[idx] = true;
          var isBest=false, sortKey=999999;
          if(m && bestIdxOrder[String(idx)]!==undefined){ isBest=true; sortKey=bestIdxOrder[String(idx)]; }
          all.push({ idx: (m?idx:''), img: img, isBest:isBest, sortKey:sortKey, seq:seq });
          seq++;
        });

        var matched = all.filter(function(o){return o.isBest;}).length;
        if(matched === 0 && bestCount > 0){
          all.forEach(function(o,k){ if(k < bestCount){ o.isBest=true; o.sortKey=k; } });
        }

        var bestPart = all.filter(function(o){return o.isBest;}).sort(function(a,b){return a.sortKey-b.sortKey;});
        var restPart = all.filter(function(o){return !o.isBest;});
        restPart.sort(function(a,b){ return (parseInt(a.idx,10)||a.seq) - (parseInt(b.idx,10)||b.seq); });
        var items = bestPart.concat(restPart);

        var strip = document.createElement('div');
        strip.className = 'revphoto-strip';
        strip.innerHTML = items.map(function(d){
          return '<a class="revphoto-item" href="javascript:;" data-idx="'+(d.idx||'')+'" '
               + 'style="background-image:url('+d.img+')"></a>';
        }).join('');
        strip.addEventListener('click', function(e){
          var it = e.target.closest && e.target.closest('.revphoto-item');
          if(!it) return;
          e.preventDefault(); e.stopPropagation();
          var idx = it.getAttribute('data-idx');
          if(idx && window.SITE_SHOP_DETAIL && SITE_SHOP_DETAIL.viewReviewDetail){
            SITE_SHOP_DETAIL.viewReviewDetail(idx, 0, 'Y');
          }
        });

        $owl[0].parentNode.insertBefore(strip, $owl[0].nextSibling);
        $owl.css('display', 'none');
        $owl.data('revStripDone', true);

        var navs = $owl.closest('.review_image_list').find('.nav_btn');
        if(navs.length >= 2){
          $(navs[0]).off('click.revphoto').on('click.revphoto', function(e){ e.preventDefault(); strip.scrollBy({left:-strip.clientWidth*0.8, behavior:'smooth'}); });
          $(navs[1]).off('click.revphoto').on('click.revphoto', function(e){ e.preventDefault(); strip.scrollBy({left: strip.clientWidth*0.8, behavior:'smooth'}); });
        }
      }catch(e){}
      BUSY = false;
    });
  }

  var M = { realLast:null, perPage:null, fallbackLast:null, bestClones:null, carIdx:null, bestIdxs:null,
            bestData:null, sliderBuilt:false, photoStripBuilt:false, fn:null, block:null,
            discovering:false, pendingDisp:null, effLast:null,
            curDisp:1, orig:null, ready:false, flipped:false, confirmed:false, origFirstKey:'' };

  function toReal(d){
    var last = M.effLast || M.realLast;
    if(!last) return d;
    if(d <= 1) return 1;
    var r = last - d + 2;
    return r < 2 ? 2 : (r > last ? last : r);
  }

  function firstKey($wrap){
    var li = $wrap.children('li').first();
    if(!li.length) return '';
    var sp = li.find('[block-review-code]').first();
    if(sp.length) return sp.attr('block-review-code');
    var oc = (li.find('a[onclick*="openAddReview"]').attr('onclick')||'');
    var m = oc.match(/openAddReview\((\d+)/);
    return m ? m[1] : (li.text()||'').replace(/\s+/g,'').slice(0,40);
  }

  function activeWrap(){
    var $ = J();
    var v = $('.list_review_wrap').filter(':visible').first();
    return v.length ? v : $('.list_review_wrap').first();
  }
  function activePag(){
    var $ = J();
    var v = $('.paging-block .pagination').filter(':visible').first();
    return v.length ? v : $('.paging-block .pagination').first();
  }
  function detectFn(){
    var $ = J(); var name = '';
    var $p = activePag();
    if($p && $p.length){
      var oc = '';
      $p.find('a[onclick*="changeContent"]').each(function(){ if(!oc) oc = $(this).attr('onclick')||''; });
      var m = oc.match(/SITE_SHOP_DETAIL\.(changeContent\w+)\s*\(/);
      if(m) name = m[1];
    }
    return name;
  }

  function readPaging(){
    var $ = J(); var nums=[], active=null;
    var $pag = activePag();
    $pag.find('li').each(function(){
      var t=($(this).find('a').text()||'').replace(/[^0-9]/g,'');
      if(t){ var n=parseInt(t,10); nums.push(n); if($(this).hasClass('active')) active=n; }
    });
    return { nums:nums, active:active, max: nums.length?Math.max.apply(null,nums):null };
  }

  function setupMain(){
    if(!CFG.mainOldestFirst || M.ready) return;
    var $ = J(); if(!$) return;
    if(!window.SITE_SHOP_DETAIL) return;
    if(typeof SITE_SHOP_DETAIL.changeContentPCTab !== 'function'
       && typeof SITE_SHOP_DETAIL.changeContentTab !== 'function') return;
    var $wrap = activeWrap();
    if(!$wrap.length) return;

    M.perPage = $wrap.children('li').length || null;
    M.block = 5;

    if(!M.bestData || !M.bestData.length){
      var _bd = extractBestData($wrap);
      if(_bd && _bd.length) M.bestData = _bd;
    }

    M.fn = detectFn();
    if(typeof SITE_SHOP_DETAIL[M.fn] !== 'function'){
      M.fn = (typeof SITE_SHOP_DETAIL.changeContentTab === 'function') ? 'changeContentTab' : 'changeContentPCTab';
    }
    M.orig = SITE_SHOP_DETAIL[M.fn].bind(SITE_SHOP_DETAIL);

    ['changeContentPCTab','changeContentTab'].forEach(function(fn){
      if(typeof SITE_SHOP_DETAIL[fn] !== 'function') return;
      if(SITE_SHOP_DETAIL[fn].__revWrapped) return;
      var orig = SITE_SHOP_DETAIL[fn].bind(SITE_SHOP_DETAIL);
      var wrapped = function(tab, page){
        var a = Array.prototype.slice.call(arguments);
        if(tab === 'review' && M.realLast){ M.curDisp = page; a[1] = toReal(page); }
        return orig.apply(SITE_SHOP_DETAIL, a);
      };
      wrapped.__revWrapped = true;
      SITE_SHOP_DETAIL[fn] = wrapped;
    });

    M.ready = true;
  }

  function setPaging(on){ try{ document.body.classList.toggle('rev-paging', !!on); }catch(e){} }

  function reverseList($wrap){
    var $ = J();
    var sig = firstKey($wrap);
    if(sig && $wrap.attr('data-revsig') === sig) return false;
    var best=[], rest=[];
    $wrap.children('li').each(function(){
      ($(this).find('.badge.review_best').length ? best : rest).push(this);
    });
    rest.reverse();
    $wrap.empty();
    best.forEach(function(li){ $wrap.append(li); });
    rest.forEach(function(li){ $wrap.append(li); });
    $wrap.attr('data-revsig', firstKey($wrap));
    return true;
  }

  function processMain(){
    if(!CFG.mainOldestFirst || !M.ready) return;
    var $ = J(); if(!$) return;
    var $wrap = activeWrap();
    if(!$wrap.length) return;

    if(!M.realLast && M.discovering){
      var p = readPaging();
      if(p.active){
        M.realLast = p.active;
        var lastCount = $wrap.children('li').length;
        M.effLast = (M.perPage>0 && lastCount>0 && lastCount < M.perPage && M.realLast>1)
                  ? (M.realLast - 1) : M.realLast;
        M.discovering = false;
        var pd = M.pendingDisp; M.pendingDisp = null;
        if(pd && pd >= 2){
          var rt = toReal(pd);
          M.curDisp = pd;
          if(rt !== p.active){
            M.orig('review', rt, 1, 1, 'N', 0);
            return;
          }
        }
      }
    }
    if(!M.realLast && !M.discovering){
      BUSY = true; try{ rebuildPaging(); }catch(e){} BUSY = false;
      setPaging(false);
      return;
    }
    if(!M.realLast) return;

    BUSY = true;
    var did = false;
    try{ if(M.curDisp >= 2) did = reverseList($wrap); }catch(e){}
    try{ rebuildPaging(); }catch(e){}
    BUSY = false;

    if(M.curDisp <= 1 || did) setPaging(false);

    setTimeout(safeRebuild, 150);
    setTimeout(safeRebuild, 500);
    setTimeout(safeRebuild, 1000);
  }

  function rebuildPaging(){
    var $ = J();
    var $pag = activePag();
    if(!$pag.length) return;
    if($pag.find('a[onclick*="__revGo"]').length) return;
    if(!$pag.find('li a').length) return;

    var B   = M.block || 5;
    var cur = M.curDisp || 1;
    var last = M.effLast || M.realLast;
    var blk = Math.floor((cur - 1) / B);
    var lo  = blk * B + 1;
    var hi  = lo + B - 1;
    if(last) hi = Math.min(hi, last);

    var html='';
    var pPrev = lo<=1;
    html+='<li><a href="javascript:;" class="'+(pPrev?'disabled':'')+'"'
         +(pPrev?'':' onclick="__revGo('+(lo-1)+');return false;"')
         +'><i aria-hidden="true" class="icon-arrow-left"></i></a></li>';
    for(var d=lo; d<=hi; d++){
      html+='<li class="'+(d===cur?'active':'')+'">'
           +'<a href="javascript:;" onclick="__revGo('+d+');return false;">'+d+'</a></li>';
    }
    var pNext = last ? (hi>=last) : false;
    html+='<li><a href="javascript:;" class="'+(pNext?'disabled':'')+'"'
         +(pNext?'':' onclick="__revGo('+(hi+1)+');return false;"')
         +'><i aria-hidden="true" class="icon-arrow-right"></i></a></li>';
    $pag.html(html);
  }

  function safeRebuild(){ if(BUSY) return; BUSY=true; try{ rebuildPaging(); }catch(e){} BUSY=false; }

  window.__revGo = function(d){
    if(!M.orig) return;
    M.curDisp = d;
    if(d <= 1){ setPaging(false); M.orig('review', 1, 1, 1, 'N', 0); return; }
    setPaging(true);
    setTimeout(function(){ setPaging(false); }, 2500);
    if(!M.realLast){
      M.discovering = true;
      M.pendingDisp = d;
      M.orig('review', 999999, 1, 1, 'N', 0);
      return;
    }
    M.orig('review', toReal(d), 1, 1, 'N', 0);
  };

  var AMP  = String.fromCharCode(38) + 'amp;';
  var LT   = String.fromCharCode(38) + 'lt;';
  var GT   = String.fromCharCode(38) + 'gt;';
  var QUOT = String.fromCharCode(38) + 'quot;';
  function escapeHtml(s){
    return String(s||'')
      .split(String.fromCharCode(38)).join(AMP)
      .split(String.fromCharCode(60)).join(LT)
      .split(String.fromCharCode(62)).join(GT)
      .split(String.fromCharCode(34)).join(QUOT);
  }

  function liCode($li){
    var el = $li.find('[block-review-code]').first();
    return el.length ? (el.attr('block-review-code')||'') : '';
  }
  function liDetailIdx($li){
    var vd = '';
    $li.find('[onclick*="viewReviewDetail"]').each(function(){
      if(vd) return;
      var m = ((this.getAttribute && this.getAttribute('onclick'))||'').match(/viewReviewDetail\(\s*'?(\d+)'?/);
      if(m) vd = m[1];
    });
    if(!vd){
      var oc = ($li.find('a[onclick*="openAddReview"]').attr('onclick')||'');
      var m2 = oc.match(/openAddReview\((\d+)/);
      if(m2) vd = m2[1];
    }
    // 비로그인 상태: EditReviewShow("code","sxxxx","IDX") 의 3번째 인자가 idx
    if(!vd){
      var oc3 = ($li.find('[onclick*="EditReviewShow"]').attr('onclick')||'');
      var m3 = oc3.match(/EditReviewShow\(\s*["'][^"']*["']\s*,\s*["'][^"']*["']\s*,\s*["']?(\d+)["']?/);
      if(m3) vd = m3[1];
    }
    if(!vd){
      var oc4 = ($li.find('[onclick*="DeleteShow"]').attr('onclick')||'');
      var m4 = oc4.match(/DeleteShow\(\s*["'][^"']*["']\s*,\s*["'][^"']*["']\s*,\s*["']?(\d+)["']?/);
      if(m4) vd = m4[1];
    }
    return vd || '';
  }
  function liData($li, code){
    var $ = J();
    var img='';
    var $bt=$li.find('.board_thumb').first();
    if($bt.length){
      var bg=$bt.attr('style')||'';
      var mm=bg.match(/url\(["']?([^"')]+)["']?\)/);
      if(mm) img=mm[1];
    }
    if(!img){ var $im=$li.find('._review_img img, .thumb_detail_img_wrap img').first(); if($im.length) img=$im.attr('src')||''; }

    var $body=$li.find('._review_body').first().clone();
    $body.find('.badge,.dummy,._block_review_command_,.more,._dummy').remove();
    var text=($body.text()||'').replace(/\s+/g,' ').trim();

    var stars=$li.find('.star_point_wrap .bts.bt-star.active').length || 5;

    return { code:code, detailIdx: liDetailIdx($li), img:img, text:text, stars:stars };
  }

  function extractBestData($wrap){
    var $ = J();
    var want = bestListForProd();
    if(!want) return [];

    var seenWant = {}, wantU = [];
    want.forEach(function(c){ if(c && !seenWant[c]){ seenWant[c]=true; wantU.push(c); } });

    var byCode = {};
    $wrap.children('li').each(function(){
      var code = liCode($(this));
      if(code && !byCode[code]) byCode[code] = $(this);
    });

    var arr = [], pushed = {};
    wantU.forEach(function(code){
      if(pushed[code]) return;
      var $li = byCode[code];
      if(!$li) return;
      var d = liData($li, code);
      if(d.img){ arr.push(d); pushed[code]=true; }
    });
    return arr;
  }

  function bestCardsHTML(data){
    return data.map(function(d){
      var stars='';
      for(var i=0;i<5;i++) stars += '<span style="color:'+(i<d.stars?'#ff5a3c':'#e2e2e2')+'">\u2605</span>';
      return '<a class="revbest-card" href="javascript:;" data-idx="'+(d.detailIdx||'')+'" data-code="'+d.code+'">'
           +   '<span class="revbest-txtwrap">'
           +     '<span class="revbest-stars">'+stars+'</span>'
           +     '<span class="revbest-text">'+escapeHtml(d.text)+'</span>'
           +   '</span>'
           +   '<span class="revbest-thumb" style="background-image:url('+d.img+')"></span>'
           + '</a>';
    }).join('');
  }

  function openReview(d){
    // 0) 카드에 idx가 이미 있으면 바로 열기 (로그인 상태 등)
    if(d.idx && window.SITE_SHOP_DETAIL && SITE_SHOP_DETAIL.viewReviewDetail){
      SITE_SHOP_DETAIL.viewReviewDetail(d.idx, 0, 'Y'); return;
    }
    var $ = J();
    var $wrap = activeWrap();
    // 1) code 로 목록 li 를 찾아, 그 li 에서 idx 를 추출해 열기 (로그인/비로그인 공통)
    if(d.code && $wrap && $wrap.length && window.SITE_SHOP_DETAIL && SITE_SHOP_DETAIL.viewReviewDetail){
      var foundIdx = '';
      $wrap.children('li').each(function(){
        if(foundIdx) return;
        if(liCode($(this)) === d.code){
          foundIdx = liDetailIdx($(this));
        }
      });
      if(foundIdx){ SITE_SHOP_DETAIL.viewReviewDetail(foundIdx, 0, 'Y'); return; }
    }
    // 2) 사진 파일명으로 owl(포토구매평) idx 맵에서 찾아 열기
    if(d.img && window.SITE_SHOP_DETAIL && SITE_SHOP_DETAIL.viewReviewDetail){
      var map = buildIdxMap();
      var key = fileKey(d.img);
      if(key && map[key]){
        SITE_SHOP_DETAIL.viewReviewDetail(map[key], 0, 'Y'); return;
      }
    }
    // 3) 마지막 폴백: 목록 li 자체를 클릭
    var $target = null;
    $wrap.children('li').each(function(){
      if($target) return;
      if(liCode($(this)) === d.code) $target = $(this);
    });
    if($target){
      var $a = $target.find('a[onclick*="openAddReview"]').first();
      if($a.length){ $a[0].click(); return; }
      $target[0].click();
    }
  }

  function buildBestSlider(){
    if(!CFG.bestSlider || M.sliderBuilt) return;
    if(!M.bestData || !M.bestData.length) return;
    var swipers = document.querySelectorAll('.review1, .review2');
    if(!swipers.length) return;

    var built = false;
    swipers.forEach(function(sw){
      if(sw.dataset.revbestDone) return;
      var parent = sw.parentNode;
      if(!parent) return;
      var track = document.createElement('div');
      track.className = 'revbest-track';
      track.innerHTML = bestCardsHTML(M.bestData);

      function openFromCard(card){
        if(!card) return;
        var thumb = card.querySelector('.revbest-thumb');
        var img = '';
        if(thumb){
          var mm = (thumb.getAttribute('style')||'').match(/url\(["']?([^"')]+)["']?\)/);
          if(mm) img = mm[1];
        }
        openReview({ idx: card.getAttribute('data-idx'), code: card.getAttribute('data-code'), img: img });
      }

      // 각 카드에 직접 이벤트를 건다 (트랙 위임보다 모바일에서 안정적)
      var cards = track.querySelectorAll('.revbest-card');
      Array.prototype.forEach.call(cards, function(card){
        var sx = 0, sy = 0, moved = false;

        function press(x, y){ sx = x; sy = y; moved = false; }
        function move(x, y){
          if(Math.abs(x - sx) > 10 || Math.abs(y - sy) > 10) moved = true;
        }

        // 스크롤인지 탭인지 판정만 pointer/touch로 (열기는 click에서)
        if(window.PointerEvent){
          card.addEventListener('pointerdown', function(e){ press(e.clientX, e.clientY); }, {passive:true});
          card.addEventListener('pointermove', function(e){ move(e.clientX, e.clientY); }, {passive:true});
        } else {
          card.addEventListener('touchstart', function(e){ var t=e.touches&&e.touches[0]; if(t) press(t.clientX,t.clientY); }, {passive:true});
          card.addEventListener('touchmove', function(e){ var t=e.touches&&e.touches[0]; if(t) move(t.clientX,t.clientY); }, {passive:true});
        }

        // 실제 열기는 네이티브 click 으로 (사파리 팝업 차단 회피)
        card.addEventListener('click', function(e){
          e.preventDefault();
          if(moved){ moved = false; return; }  // 드래그(스크롤)였으면 무시
          openFromCard(card);
        });
      });

      // PC 마우스 드래그로 좌우 스크롤 (모바일 터치는 네이티브 스크롤이라 그대로)
      (function(){
        var dragging = false, startX = 0, startScroll = 0, dragMoved = false;

        // 링크/이미지 네이티브 드래그 자체를 차단 (텍스트 끌림, javascript:; 미리보기 방지)
        track.addEventListener('dragstart', function(e){ e.preventDefault(); });

        track.addEventListener('mousedown', function(e){
          if(e.button !== 0) return;
          dragging = true;
          dragMoved = false;
          startX = e.pageX;
          startScroll = track.scrollLeft;
          e.preventDefault();            // 텍스트 선택/링크 드래그 시작 차단
        });

        document.addEventListener('mousemove', function(e){
          if(!dragging) return;          // ★ 버튼 안 눌렀으면 절대 반응 안 함
          var dx = e.pageX - startX;
          if(Math.abs(dx) > 4) dragMoved = true;
          track.scrollLeft = startScroll - dx;
          if(dragMoved){ track.style.cursor = 'grabbing'; }
        });

        document.addEventListener('mouseup', function(){
          if(!dragging) return;
          dragging = false;
          track.style.cursor = '';
          // 드래그였다면 뒤이어 발생하는 클릭(리뷰 열기)을 한 번 막는다
          if(dragMoved){
            var block = function(ev){
              ev.stopPropagation(); ev.preventDefault();
              track.removeEventListener('click', block, true);
            };
            track.addEventListener('click', block, true);
            setTimeout(function(){ track.removeEventListener('click', block, true); }, 50);
          }
        });
      })();

      parent.insertBefore(track, sw.nextSibling);
      sw.dataset.revbestDone = '1';

      var box = sw.closest('.css-1a9t3rq, .css-be6gxt') || parent.parentNode;
      if(box){
        var prev = box.querySelector('.css-szna78');
        var next = box.querySelector('.css-rp5no0');
        if(prev) prev.addEventListener('click', function(e){ e.preventDefault(); track.scrollBy({left:-track.clientWidth*0.8, behavior:'smooth'}); }, true);
        if(next) next.addEventListener('click', function(e){ e.preventDefault(); track.scrollBy({left: track.clientWidth*0.8, behavior:'smooth'}); }, true);
      }
      built = true;
    });

    if(built){
      document.body.classList.add('revbest-active');
      M.sliderBuilt = true;
    }
  }

  function tick(){
    if(BUSY){ clearTimeout(deb); deb=setTimeout(tick, 60); return; }
    try{ if(bestListForProd()){ document.documentElement.classList.add('revbest-prehide'); } }catch(e){}
    try{ wireChangeSlider(); }catch(e){}
    try{ buildPhotoStrip(); }catch(e){}
    try{
      if(bestListForProd() && (!M.bestData || !M.bestData.length)){
        var $w = (window.jQuery) ? window.jQuery('.list_review_wrap').filter(':visible').first() : null;
        if($w && $w.length){ var _d = extractBestData($w); if(_d && _d.length) M.bestData = _d; }
      }
    }catch(e){}
    try{ buildBestSlider(); }catch(e){}
    if(!M.ready){ try{ setupMain(); }catch(e){} }
    else        { try{ processMain(); }catch(e){} }
  }

  function start(){
    try{ if(bestListForProd()){ document.documentElement.classList.add('revbest-prehide'); } }catch(e){}
    var s=document.createElement('style');
    var css='.rev-paging .list_review_wrap{opacity:0}';
    if(CFG.hideStarFilter){ css+='.review_top .star-point-wrap{display:none!important}'; }
    if(CFG.bestSlider){
      css+=''
         + 'html.revbest-prehide .review1,html.revbest-prehide .review2{display:none!important;visibility:hidden!important}'
         + '.revbest-active .review1,.revbest-active .review2{display:none!important}'
         + 'html.revbest-prehide .revbest-track,.revbest-active .revbest-track{display:flex!important;visibility:visible!important}'
         + '.revbest-track{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 10px;'
         +   '-webkit-overflow-scrolling:touch;cursor:grab}'
         + '.revbest-track::-webkit-scrollbar{height:6px}'
         + '.revbest-track::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}'
         + '.revbest-card{flex:0 0 auto;width:min(86%,360px);display:flex;gap:12px;'
         +   'background:#fff;border:1px solid #eee;border-radius:10px;padding:14px;'
         +   'cursor:pointer;box-sizing:border-box;'
         +   'text-decoration:none;color:inherit;-webkit-tap-highlight-color:rgba(0,0,0,0.05);'
         +   '-webkit-user-select:none;-moz-user-select:none;user-select:none;'
         +   '-webkit-user-drag:none}'
         + '.revbest-txtwrap{flex:1;min-width:0;display:block}'
         + '.revbest-stars{font-size:13px;letter-spacing:1px;margin-bottom:6px;display:block}'
         + '.revbest-text{font-size:13px;line-height:1.5;color:#333;overflow:hidden;'
         +   'display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical}'
         + '.revbest-thumb{flex:0 0 auto;width:96px;height:96px;border-radius:8px;display:block;'
         +   'background-size:cover;background-position:center;background-repeat:no-repeat}';
    }
    if(CFG.photoReverse){
      css+='.revphoto-strip{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;'
         +   '-webkit-overflow-scrolling:touch}'
         + '.revphoto-strip::-webkit-scrollbar{height:6px}'
         + '.revphoto-strip::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}'
         + '.revphoto-item{flex:0 0 auto;width:110px;height:110px;border-radius:6px;'
         +   'background-size:cover;background-position:center;background-repeat:no-repeat;'
         +   'cursor:pointer;display:block}';
    }
    s.textContent=css;
    document.head.appendChild(s);

    new MutationObserver(function(){
      clearTimeout(deb); deb=setTimeout(tick, 40);
    }).observe(document.body, {childList:true, subtree:true});

    var n=0, iv=setInterval(function(){ tick(); if(++n>60) clearInterval(iv); }, 500);
    tick();
  }

  if(document.readyState!=='loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
