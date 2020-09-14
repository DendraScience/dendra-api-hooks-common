/**
 * Useful hooks for use with Dendra/Feathers API services.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module dendra-api-hooks-common
 */
import getByDot from 'lodash/get';
import setByDot from 'lodash/set';
import { getItems } from 'feathers-hooks-common';
import { treeMap } from '@dendra-science/utils'; // Regular expressions for data type detection

var BOOL_REGEX = /^(false|true)$/i;
var ID_PATH_REGEX = /\/(\w|\$)*_id(s)?(\/.*)?$/;
var ID_STRING_REGEX = /^[0-9a-f]{24}$/i;
var NAIVE_DATE_REGEX = /^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.([0-9]{3}))?$/i;
var UTC_DATE_REGEX = /^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.([0-9]{3}))?Z$/i;
var TEXT_SEARCH_PATH_REGEX = /\/(\w|\$)*\$text\/\$search$/;

function checkModule(name) {
  try {
    return typeof require.resolve(name) === 'string';
  } catch (e) {
    return false;
  }
}

var ObjectID;
if (checkModule('mongodb')) ObjectID = require('mongodb').ObjectID;
export function coercer(options, obj, path) {
  if (typeof obj !== 'string') return obj; // Mongo full text search

  if (options.text && TEXT_SEARCH_PATH_REGEX.test(path)) return obj; // Boolean

  if (options.bool && BOOL_REGEX.test(obj)) return obj === 'true'; // Numeric

  if (options.num) {
    var n = parseFloat(obj);
    if (!isNaN(n) && isFinite(obj)) return n;
  } // Date


  if (options.naive && NAIVE_DATE_REGEX.test(obj)) {
    var ms = Date.parse("".concat(obj, "Z"));
    if (!isNaN(ms)) return new Date(ms);
  }

  if (options.utc && UTC_DATE_REGEX.test(obj)) {
    var _ms = Date.parse(obj);

    if (!isNaN(_ms)) return new Date(_ms);
  } // ObjectID (strict)


  if (options.id && ObjectID && ID_PATH_REGEX.test(path) && ID_STRING_REGEX.test(obj)) return new ObjectID(obj.toString());
  return obj;
}
export function coerce() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    id: true,
    utc: true
  };
  var cb = coercer.bind(null, options);
  return context => {
    if (context.data !== undefined) context.data = treeMap(context.data, cb);
    return context;
  };
}
export function coerceQuery() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    bool: true,
    id: true,
    num: true,
    text: true,
    utc: true
  };
  var cb = coercer.bind(null, options);
  return context => {
    if (context.params.query) context.params.query = treeMap(context.params.query, cb);
    return context;
  };
}
export function splitList(path) {
  var sep = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ',';
  var options = arguments.length > 2 ? arguments[2] : undefined;
  var opts = Object.assign({
    trim: true,
    unique: true
  }, options);
  return context => {
    var value = getByDot(context, path);
    if (typeof value !== 'string') return context;
    var ary = value.split(sep);
    if (opts.trim) ary = ary.map(item => item.trim()).filter(item => item.length > 0);
    setByDot(context, path, opts.unique ? [...new Set(ary)] : ary);
    return context;
  };
}
export function timestamp() {
  return context => {
    var date = new Date();
    var items = getItems(context);
    if (!Array.isArray(items)) items = [items];

    switch (context.method) {
      case 'create':
        items.forEach(item => {
          item.created_at = date;
          item.updated_at = date;
        });
        break;

      case 'update':
      case 'patch':
        items.forEach(item => {
          item.updated_at = date;
        });
        break;
    }

    return context;
  };
}
export function userstamp() {
  return context => {
    if (typeof context.params.user !== 'object') return context;
    var id = context.params.user._id;
    var items = getItems(context);
    if (!Array.isArray(items)) items = [items];

    switch (context.method) {
      case 'create':
        items.forEach(item => {
          item.created_by = id;
          item.updated_by = id;
        });
        break;

      case 'update':
      case 'patch':
        items.forEach(item => {
          item.updated_by = id;
        });
        break;
    }

    return context;
  };
}
export function uniqueArray(path) {
  return context => {
    var ary = getByDot(context, path);
    if (Array.isArray(ary)) setByDot(context, path, [...new Set(ary)]);
    return context;
  };
}