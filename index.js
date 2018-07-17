// Generated by CoffeeScript 1.10.0

if (window.LITHIUM === undefined) {
  window.LITHIUM = {};
}

(function() {
  var expr, fs, request;

  fs = (typeof window === "undefined" || window === null ? require('fs') : false);

  request = (fs && fs.existsSync(__dirname + '/../sync-request') ? require('sync-request') : false);

  // Inline expand the property-expr library
  expr = (function(){var t=/[^.^\]^[]+|(?=\[\]|\.\.)/g,n=/^\d+$/,r=/^\d/,e=/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g,u={},c={};function a(t,n,r){var e,u,c,a,f=t.length;for(u=0;u<f;u++)(e=t[u])&&(o(e)&&(e='"'+e+'"'),c=!(a=i(e))&&/^\d+$/.test(e),n.call(r,e,a,c,u,t))}function i(t){return"string"==typeof t&&t&&-1!==["'",'"'].indexOf(t.charAt(0))}function o(t){return!i(t)&&(function(t){return t.match(r)&&!t.match(n)}(t)||function(t){return e.test(t)}(t))}return{expr:f,setter:function(t){return u[t]||(u[t]=new Function("data, value",f(t,"data")+" = value"))},getter:function(t,n){var r=t+"_"+n;return c[r]||(c[r]=new Function("data","return "+f(t,n,"data")))},split:function(n){return n.match(t)},join:function(t){return t.reduce(function(t,r){return t+(i(r)||n.test(r)?"["+r+"]":(t?".":"")+r)},"")},forEach:function(n,r,e){a(n.match(t),r,e)}};function f(n,r,e){return"string"==typeof r&&(e=r,r=!1),e=e||"data",(n=n||"")&&"["!==n.charAt(0)&&(n="."+n),r?function(n,r){var e,u=r,c=n.match(t);return a(c,function(t,n,r,c,a){e=c===a.length-1,u+=(t=n||r?"["+t+"]":"."+t)+(e?")":" || {})")}),new Array(c.length+1).join("(")+u}(n,e):e+n}})();

  // Namespace under the LITHIUM object
  LITHIUM.jsonRefLite = (function() {
    this.cache = {};
    this.extendtoken = '$extend';
    this.reftoken = '$ref';
    this.pathtoken = "#";
    this.debug = false;
    this.clone = function(obj) {
      var key, temp;
      if (obj === null || typeof obj !== 'object' || typeof obj === 'function') {
        return obj;
      }
      temp = obj.constructor();
      for (key in obj) {
        temp[key] = this.clone(obj[key]);
      }
      return temp;
    };
    this.findIds = function(json, ids) {
      var id, k, obj, v;
      id = false;
      obj = {};
      for (k in json) {
        v = json[k];
        if (json.id != null) {
          id = json.id;
        }
        if (id && k !== "id") {
          obj[k] = v;
        }
        if (typeof v === 'object') {
          this.findIds(v, ids);
        }
      }
      if (id) {
        return ids[id] = obj;
      }
    };
    this.get_json_pointer = function(ref, root) {
      var err, error, evalstr, result;
      evalstr = ref.replace(/\\\//, '#SLASH#').replace(/\//g, '.').replace(/#SLASH#/, '/');
      evalstr = evalstr.replace(new RegExp('^' + this.pathtoken), '');
      if (evalstr[0] === '.') {
        evalstr = evalstr.substr(1, evalstr.length - 1);
      }
      try {
        if (this.debug) {
          console.log("evaluating '" + evalstr + "'");
        }
        result = expr.getter(evalstr)(root);
      } catch (error) {
        err = error;
        result = "";
      }
      return result;
    };
    this.replace = function(json, ids, root) {
      var jsonpointer, k, ref, ref1, ref2, results, str, url, v;
      results = [];
      for (k in json) {
        v = json[k];
        if (this.debug && typeof ref === 'string') {
          console.log("checking " + k);
        }
        if ((v != null) && (v[reftoken] != null)) {
          ref = v[reftoken];
          if (this.debug && typeof ref === 'string') {
            console.log("checking " + k + " -> " + ref);
          }
          if (Object.keys(v).length > 1) {
            console.error("json-ref-lite error: object '" + k + "' contains reference as well as other properties..ignoring properties");
          }
          if (Array.isArray(ref)) {
            ref = this.replace(ref, ids, root);
          } else if (ids[ref] != null) {
            json[k] = ids[ref];
          } else if (request && String(ref).match(/^https?:/)) {
            url = ref.match(/^[^#]*/);
            if (!this.cache[url]) {
              this.cache[url] = this.resolve(JSON.parse(request("GET", url).getBody().toString()));
            }
            json[k] = this.cache[url];
            if (ref.match(this.pathtoken)) {
              jsonpointer = ref.replace(new RegExp(".*" + pathtoken), this.pathtoken);
              if (jsonpointer.length) {
                json[k] = this.get_json_pointer(jsonpointer, json[k]);
              }
            }
          } else if (fs && fs.existsSync(ref)) {
            str = fs.readFileSync(ref).toString();
            if (str.match(/module\.exports/)) {
              json[k] = this.resolve(require(ref));
            } else {
              json[k] = this.resolve(JSON.parse(str));
            }
          } else if (String(ref).match(new RegExp('^' + this.pathtoken))) {
            if (this.debug) {
              console.log("checking " + ref + " pathtoken");
            }
            json[k] = this.get_json_pointer(ref, root);
          }
          if ((((ref1 = json[k]) != null ? ref1.length : void 0) != null) && ((ref2 = json[k]) != null ? ref2.length : void 0) === 0 && this.debug) {
            results.push(console.log(ref + " reference not found"));
          } else {
            results.push(void 0);
          }
        } else {
          if (typeof v === 'object') {
            results.push(this.replace(v, ids, root));
          } else {
            results.push(void 0);
          }
        }
      }
      return results;
    };
    this.extend = function(json) {
      var k, ref, results, rk, rv, v;
      if (typeof json === 'object') {
        results = [];
        for (k in json) {
          v = json[k];
          if (k === this.extendtoken && (v[this.reftoken] != null)) {
            ref = this.get_json_pointer(v[this.reftoken], json);
            for (rk in v) {
              rv = v[rk];
              if (rk !== this.reftoken) {
                ref[rk] = rv;
              }
            }
            delete json[k];
          }
          if (typeof v === 'object') {
            results.push(v = this.extend(v));
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    };
    this.resolve = function(json) {
      var ids;
      ids = {};
      this.findIds(json, ids);
      if (this.debug && Object.keys(ids).length) {
        console.dir(ids);
      }
      this.replace(json, ids, json);
      return json;
    };
    this.evaluate = function(json, data, cb) {
      var k, ref1, v;
      if (cb == null) {
        cb = this.evaluateStr;
      }
      ref1 = this.clone(json);
      for (k in ref1) {
        v = ref1[k];
        if (typeof v === 'string') {
          json[k] = cb(v, data);
        }
        if (typeof v === 'object') {
          json[k] = this.evaluate(v, data);
        }
      }
      return json;
    };
    this.evaluateStr = function(k, data) {
      var error, itemstr;
      if (typeof k !== 'string') {
        return k;
      }
      if (k[0] === '{' && k[k.length - 1] === '}') {
        try {
          return expr.getter(k.replace(/^{/, '').replace(/}$/, ''))(data);
        } catch (error) {
          return null;
        }
      } else {
        itemstr = k.replace(/(\{)(.*?)(\})/g, function($0, $1, $2) {
          var err, error1, result;
          result = '';
          if ((data == null) || ($2 == null)) {
            return result;
          }
          if ((data[$2] != null) && typeof data[$2] === 'function') {
            result = data[$2]();
          } else {
            if (data[$2] != null) {
              result = data[$2];
            } else {
              try {
                $2 = $2.replace(new RegExp('^' + this.pathtoken + '\/'), '').replace(/\//g, '.');
                result = expr.getter($2)(data);
              } catch (error1) {
                err = error1;
                result = '';
              }
              if (result == null) {
                result = '';
              }
            }
          }
          this.evaluateStr(result, data);
          return result;
        });
        return itemstr;
      }
    };
    return this;
  })();

}).call(this);
