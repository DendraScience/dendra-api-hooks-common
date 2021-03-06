/**
 * Useful hooks for use with Dendra/Feathers API services.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module dendra-api-hooks-common
 */

import { getByDot, setByDot, getItems } from 'feathers-hooks-common'
import { treeMap } from '@dendra-science/utils'

// Regular expressions for data type detection
const BOOL_REGEX = /^(false|true)$/i
const ID_PATH_REGEX = /\/(\w|\$)*_id(s)?(\/.*)?$/
const ID_STRING_REGEX = /^[0-9a-f]{24}$/i
const NAIVE_DATE_REGEX = /^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.([0-9]{3}))?$/i
const UTC_DATE_REGEX = /^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.([0-9]{3}))?Z$/i
const TEXT_SEARCH_PATH_REGEX = /\/(\w|\$)*\$text\/\$search$/

function checkModule(name) {
  try {
    return typeof require.resolve(name) === 'string'
  } catch (e) {
    return false
  }
}

let ObjectID
if (checkModule('mongodb')) ObjectID = require('mongodb').ObjectID

export function coercer(options, obj, path) {
  if (typeof obj !== 'string') return obj

  // Mongo full text search
  if (options.text && TEXT_SEARCH_PATH_REGEX.test(path)) return obj

  // Boolean
  if (options.bool && BOOL_REGEX.test(obj)) return obj === 'true'

  // Numeric
  if (options.num) {
    const n = parseFloat(obj)
    if (!isNaN(n) && isFinite(obj)) return n
  }

  // Date
  if (options.naive && NAIVE_DATE_REGEX.test(obj)) {
    const ms = Date.parse(`${obj}Z`)
    if (!isNaN(ms)) return new Date(ms)
  }
  if (options.utc && UTC_DATE_REGEX.test(obj)) {
    const ms = Date.parse(obj)
    if (!isNaN(ms)) return new Date(ms)
  }

  // ObjectID (strict)
  if (
    options.id &&
    ObjectID &&
    ID_PATH_REGEX.test(path) &&
    ID_STRING_REGEX.test(obj)
  )
    return new ObjectID(obj.toString())

  return obj
}

export function coerce(
  options = {
    id: true,
    utc: true
  }
) {
  const cb = coercer.bind(null, options)

  return context => {
    if (context.data !== undefined) context.data = treeMap(context.data, cb)

    return context
  }
}

export function coerceQuery(
  options = {
    bool: true,
    id: true,
    num: true,
    text: true,
    utc: true
  }
) {
  const cb = coercer.bind(null, options)

  return context => {
    if (context.params.query)
      context.params.query = treeMap(context.params.query, cb)

    return context
  }
}

export function splitList(path, sep = ',', options) {
  const opts = Object.assign(
    {
      trim: true,
      unique: true
    },
    options
  )

  return context => {
    const value = getByDot(context, path)
    if (typeof value !== 'string') return context

    let ary = value.split(sep)
    if (opts.trim)
      ary = ary.map(item => item.trim()).filter(item => item.length > 0)

    setByDot(context, path, opts.unique ? [...new Set(ary)] : ary)

    return context
  }
}

export function timestamp() {
  return context => {
    const date = new Date()

    let items = getItems(context)
    if (!Array.isArray(items)) items = [items]

    switch (context.method) {
      case 'create':
        items.forEach(item => {
          item.created_at = date
          item.updated_at = date
        })
        break
      case 'update':
      case 'patch':
        items.forEach(item => {
          item.updated_at = date
        })
        break
    }

    return context
  }
}

export function userstamp() {
  return context => {
    if (typeof context.params.user !== 'object') return context

    const id = context.params.user._id

    let items = getItems(context)
    if (!Array.isArray(items)) items = [items]

    switch (context.method) {
      case 'create':
        items.forEach(item => {
          item.created_by = id
          item.updated_by = id
        })
        break
      case 'update':
      case 'patch':
        items.forEach(item => {
          item.updated_by = id
        })
        break
    }

    return context
  }
}

export function uniqueArray(path) {
  return context => {
    const ary = getByDot(context, path)
    if (Array.isArray(ary)) setByDot(context, path, [...new Set(ary)])

    return context
  }
}
