/*!
 * smoothState.js is jQuery plugin that progressively enhances
 * page loads to behave more like a single-page application.
 *
 * @author  Miguel Ángel Pérez   reachme@miguel-perez.com
 * @see     http://smoothstate.com
 * @version 0.7.2
 */
!function(t,n,o,e){"use strict";if(!n.history.pushState)return t.fn.smoothState=function(){return this},void(t.fn.smoothState.options={});if(!t.fn.smoothState){var r=t("html, body"),a=n.console,i={debug:!1,anchors:"a",forms:"form",blacklist:".no-smoothState",prefetch:!1,cacheLength:0,loadingClass:"is-loading",alterRequest:function(t){return t},onBefore:function(t,n){},onStart:{duration:0,render:function(t){}},onProgress:{duration:0,render:function(t){}},onReady:{duration:0,render:function(t,n){t.html(n)}},onAfter:function(t,n){}},s={isExternal:function(t){var o=t.match(/^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/);return"string"==typeof o[1]&&o[1].length>0&&o[1].toLowerCase()!==n.location.protocol?!0:"string"==typeof o[2]&&o[2].length>0&&o[2].replace(new RegExp(":("+{"http:":80,"https:":443}[n.location.protocol]+")?$"),"")!==n.location.host?!0:!1},stripHash:function(t){return t.replace(/#.*/,"")},isHash:function(t,o){o=o||n.location.href;var e=t.indexOf("#")>-1?!0:!1,r=s.stripHash(t)===s.stripHash(o)?!0:!1;return e&&r},translate:function(n){var o={dataType:"html",type:"GET"};return n="string"==typeof n?t.extend({},o,{url:n}):t.extend({},o,n)},shouldLoadAnchor:function(t,n){var o=t.prop("href");return!(s.isExternal(o)||s.isHash(o)||t.is(n)||t.prop("target"))},clearIfOverCapacity:function(t,n){return Object.keys||(Object.keys=function(t){var n,o=[];for(n in t)Object.prototype.hasOwnProperty.call(t,n)&&o.push(n);return o}),Object.keys(t).length>n&&(t={}),t},storePageIn:function(n,o,e,r){var a=t(e);return n[o]={status:"loaded",title:a.filter("title").first().text(),html:a.filter("#"+r)},n},triggerAllAnimationEndEvent:function(n,o){o=" "+o||"";var e=0,r="animationstart webkitAnimationStart oanimationstart MSAnimationStart",a="animationend webkitAnimationEnd oanimationend MSAnimationEnd",i="allanimationend",l=function(o){t(o.delegateTarget).is(n)&&(o.stopPropagation(),e++)},u=function(o){t(o.delegateTarget).is(n)&&(o.stopPropagation(),e--,0===e&&n.trigger(i))};n.on(r,l),n.on(a,u),n.on("allanimationend"+o,function(){e=0,s.redraw(n)})},redraw:function(t){t.height()}},l=function(o){if(null!==o.state){var e=n.location.href,r=t("#"+o.state.id),a=r.data("smoothState");a.href===e||s.isHash(e,a.href)||a.load(e,!1)}},u=function(e,i){var l=t(e),u=l.prop("id"),c=null,d=!1,f={},h=n.location.href,p=function(t){t=t||!1,t&&f.hasOwnProperty(t)?delete f[t]:f={},l.data("smoothState").cache=f},g=function(n,o){o=o||t.noop;var e=s.translate(n);if(!f.hasOwnProperty(e.url)||"undefined"!=typeof e.data){f=s.clearIfOverCapacity(f,i.cacheLength),f[e.url]={status:"fetching"};var r=t.ajax(e);r.success(function(t){s.storePageIn(f,e.url,t,u),l.data("smoothState").cache=f}),r.error(function(){f[e.url].status="error"}),o&&r.complete(o)}},m=function(){if(c){var n=t(c,l);if(n.length){var e=n.offset().top;o.body.scrollTop=e}c=null}},y=function(e){var s="#"+u,c=f[e]?t(f[e].html.html()):null;c.length?(o.title=f[e].title,l.data("smoothState").href=e,i.loadingClass&&r.removeClass(i.loadingClass),i.onReady.render(l,c),l.one("ss.onReadyEnd",function(){d=!1,i.onAfter(l,c),m()}),n.setTimeout(function(){l.trigger("ss.onReadyEnd")},i.onReady.duration)):!c&&i.debug&&a?a.warn("No element with an id of "+s+" in response from "+e+" in "+f):n.location=e},v=function(t,o){var e=s.translate(t);"undefined"==typeof o&&(o=!0);var c=!1,d=!1,h={loaded:function(){var t=c?"ss.onProgressEnd":"ss.onStartEnd";d&&c?d&&y(e.url):l.one(t,function(){y(e.url)}),o&&n.history.pushState({id:u},f[e.url].title,e.url)},fetching:function(){c||(c=!0,l.one("ss.onStartEnd",function(){i.loadingClass&&r.addClass(i.loadingClass),i.onProgress.render(l),n.setTimeout(function(){l.trigger("ss.onProgressEnd"),d=!0},i.onProgress.duration)})),n.setTimeout(function(){f.hasOwnProperty(e.url)&&h[f[e.url].status]()},10)},error:function(){i.debug&&a?a.log("There was an error loading: "+e.url):n.location=e.url}};f.hasOwnProperty(e.url)||g(e),i.onStart.render(l),n.setTimeout(function(){r.scrollTop(0),l.trigger("ss.onStartEnd")},i.onStart.duration),h[f[e.url].status]()},S=function(n){var o,e=t(n.currentTarget);s.shouldLoadAnchor(e,i.blacklist)&&!d&&(n.stopPropagation(),o=s.translate(e.prop("href")),o=i.alterRequest(o),g(o))},w=function(n){var o=t(n.currentTarget);if(!n.metaKey&&!n.ctrlKey&&s.shouldLoadAnchor(o,i.blacklist)){var e=s.translate(o.prop("href"));d=!0,n.stopPropagation(),n.preventDefault(),c=o.prop("hash"),e=i.alterRequest(e),i.onBefore(o,l),v(e)}},E=function(n){var o=t(n.currentTarget);if(!o.is(i.blacklist)){n.preventDefault(),n.stopPropagation();var e={url:o.prop("action"),data:o.serialize(),type:o.prop("method")};d=!0,e=i.alterRequest(e),"get"===e.type.toLowerCase()&&(e.url=e.url+"?"+e.data),i.onBefore(o,l),v(e)}},b=function(t){t.on("click",i.anchors,w),t.on("submit",i.forms,E),i.prefetch&&t.on("mouseover touchstart",i.anchors,S)},P=function(){var t=l.prop("class");l.removeClass(t),s.redraw(l),l.addClass(t)};return i=t.extend({},t.fn.smoothState.options,i),null===n.history.state&&n.history.replaceState({id:u},o.title,h),s.storePageIn(f,h,o.documentElement.outerHTML,u),s.triggerAllAnimationEndEvent(l,"ss.onStartEnd ss.onProgressEnd ss.onEndEnd"),b(l),{href:h,cache:f,clear:p,load:v,fetch:g,restartCSSAnimations:P}},c=function(n){return this.each(function(){var o=this.tagName.toLowerCase();this.id&&"body"!==o&&"html"!==o&&!t.data(this,"smoothState")?t.data(this,"smoothState",new u(this,n)):!this.id&&a?a.warn("Every smoothState container needs an id but the following one does not have one:",this):"body"!==o&&"html"!==o||!a||a.warn("The smoothstate container cannot be the "+this.tagName+" tag")})};n.onpopstate=l,t.smoothStateUtility=s,t.fn.smoothState=c,t.fn.smoothState.options=i}}(jQuery,window,document);