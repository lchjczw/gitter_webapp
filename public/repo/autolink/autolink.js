!function(e){function t(e){for(var t,n=document.createNodeIterator(e,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,function(e){return 1!==e.nodeType?NodeFilter.FILTER_ACCEPT:"A"===e.tagName?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_SKIP},!1);null!==(t=n.nextNode());){var r=/\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>“”‘’'"]+|\(([^\s()<>“”‘’'"]+|(\([^\s()<>“”‘’'"]+\)))*\))+(?:\(([^\s()<>“”‘’'"]+|(\([^\s()<>“”‘’'"]+\)))*\)|[^\s`!()\[\]{};:.,<>?«»“”‘’'"]))/i,o=r.exec(t.data);if(o){var i=o[0],d=document.createElement("a");d.setAttribute("target","_new"),d.setAttribute("rel","nofollow"),d.innerText=i,i.match(/^https?:\/\//)?d.setAttribute("href",i):d.setAttribute("href","http://"+i);var a=t.splitText(o.index);a.nodeValue=a.nodeValue.substr(i.length),t.parentNode.insertBefore(d,a),n.nextNode()}}}return e.autolink=t,"function"==typeof define&&define.amd&&define([],function(){return t}),t}(window);
//@ sourceMappingURL=autolink-6d78f3f.js.map