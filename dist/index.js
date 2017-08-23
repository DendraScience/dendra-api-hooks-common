'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.coerce = coerce;
exports.coerceQuery = coerceQuery;
exports.splitList = splitList;
exports.timestamp = timestamp;
exports.uniqueArray = uniqueArray;

var _feathersHooksCommon = require('feathers-hooks-common');

var _utils = require('@dendra-science/utils');

// Regular expressions for data type detection
/**
 * Useful hooks for use with Dendra/Feathers API services.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module dendra-api-hooks-common
 */

const BOOL_REGEX = /^(false|true)$/i;
const ID_PATH_REGEX = /\/\w*_id(s)?(\/.*)?$/;
const ID_STRING_REGEX = /^[0-9a-f]{24}$/i;
const ISO_DATE_REGEX = /^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.([0-9]{3}))?Z$/i;

function checkModule(name) {
  try {
    return typeof require.resolve(name) === 'string';
  } catch (e) {
    return false;
  }
}

let ObjectID;
if (checkModule('mongodb')) ObjectID = require('mongodb').ObjectID;

function coercer(obj, path) {
  if (typeof obj !== 'string') return obj;

  // Date
  if (ISO_DATE_REGEX.test(obj)) {
    const ms = Date.parse(obj);
    if (!isNaN(ms)) return new Date(ms);
  }

  // ObjectID (strict)
  if (ObjectID && ID_PATH_REGEX.test(path) && ID_STRING_REGEX.test(obj)) return new ObjectID(obj.toString());

  return obj;
}

function queryCoercer(obj, path) {
  if (typeof obj !== 'string') return obj;

  // Boolean
  if (BOOL_REGEX.test(obj)) return obj === 'true';

  // Numeric
  const n = parseFloat(obj);
  if (!isNaN(n) && isFinite(obj)) return n;

  return coercer(obj, path);
}

function coerce() {
  return hook => {
    if (typeof hook.data === 'undefined') return;
    hook.data = (0, _utils.treeMap)(hook.data, coercer);
  };
}

function coerceQuery() {
  return hook => {
    if (typeof hook.params.query !== 'object') return;
    hook.params.query = (0, _utils.treeMap)(hook.params.query, queryCoercer);
  };
}

function splitList(path, sep = ',', options) {
  const opts = Object.assign({
    trim: true,
    unique: true
  }, options);

  return hook => {
    const value = (0, _feathersHooksCommon.getByDot)(hook, path);
    if (typeof value !== 'string') return;

    let ary = value.split(sep);
    if (opts.trim) ary = ary.map(item => item.trim()).filter(item => item.length > 0);

    (0, _feathersHooksCommon.setByDot)(hook, path, opts.unique ? [...new Set(ary)] : ary);
  };
}

function timestamp() {
  return hook => {
    delete hook.data.created_at;
    delete hook.data.updated_at;

    switch (hook.method) {
      case 'create':
        hook.data.created_at = new Date();
        hook.data.updated_at = hook.data.created_at;
        break;
      case 'update':
      case 'patch':
        hook.data.updated_at = new Date();
        break;
    }
  };
}

function uniqueArray(path) {
  return hook => {
    const ary = (0, _feathersHooksCommon.getByDot)(hook, path);
    if (Array.isArray(ary)) (0, _feathersHooksCommon.setByDot)(hook, path, [...new Set(ary)]);
  };
}