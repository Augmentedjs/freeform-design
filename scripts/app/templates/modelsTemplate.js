define(["handlebars"],function(n){n=n.default;var a=n.template,l=n.templates=n.templates||{};return l.modelsTemplate=a({1:function(n,a,l,e,i){var s,r,t=null!=a?a:{},u=l.helperMissing,d="function",o=n.escapeExpression;return'        <li>\n            <div class="flexContainer">\n                <p>'+o((r=null!=(r=l.model||(null!=a?a.model:a))?r:u,typeof r===d?r.call(t,{name:"model",hash:{},data:i}):r))+'<br/><span class="secondary">\n'+(null!=(s=l.if.call(t,null!=a?a.url:a,{name:"if",hash:{},fn:n.program(2,i,0),inverse:n.noop,data:i}))?s:"")+'                    </span>\n                    <br/><span class="secondary">\n'+(null!=(s=l.if.call(t,null!=a?a.schema:a,{name:"if",hash:{},fn:n.program(4,i,0),inverse:n.noop,data:i}))?s:"")+'                    </span>\n                </p>\n                <div>\n                    <div class="inlineButton large" data-index="'+o((r=null!=(r=l.index||i&&i.index)?r:u,typeof r===d?r.call(t,{name:"index",hash:{},data:i}):r))+'" data-models="edit" data-click="editModel"><i class="material-icons md-dark">edit</i></div>\n                </div>\n            </div>\n        </li>\n'},2:function(n,a,l,e,i){var s;return"                        "+n.escapeExpression((s=null!=(s=l.url||(null!=a?a.url:a))?s:l.helperMissing,"function"==typeof s?s.call(null!=a?a:{},{name:"url",hash:{},data:i}):s))+"\n"},4:function(n,a,l,e,i){var s;return"                        "+n.escapeExpression((s=null!=(s=l.schema||(null!=a?a.schema:a))?s:l.helperMissing,"function"==typeof s?s.call(null!=a?a:{},{name:"schema",hash:{},data:i}):s))+"\n"},compiler:[7,">= 4.0.0"],main:function(n,a,l,e,i){var s;return"<div>\n    <ul>\n"+(null!=(s=l.each.call(null!=a?a:{},null!=a?a.models:a,{name:"each",hash:{},fn:n.program(1,i,0),inverse:n.noop,data:i}))?s:"")+"    </ul>\n</div>\n"},useData:!0})});
