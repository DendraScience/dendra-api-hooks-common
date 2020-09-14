/**
 * Main tests
 */

const { ObjectID } = require('mongodb')

describe('Module', function () {
  const date1Str = '2017-05-05T15:00:00.000Z'
  const date2Str = '2017-06-06T16:30:10Z'
  const date1 = new Date(date1Str)
  const date2 = new Date(date2Str)
  const id1Str = '592f155746a1b867a114e010'
  const id2Str = '592f155746a1b867a114e020'
  const id1 = new ObjectID(id1Str)
  const id2 = new ObjectID(id2Str)
  const naiveDate1Str = '2017-05-05T15:00:00.000'
  const naiveDate2Str = '2017-06-06T16:30:10'
  const naiveDate1 = new Date(`${naiveDate1Str}Z`)
  const naiveDate2 = new Date(`${naiveDate2Str}Z`)

  let hooks

  it('should import', function () {
    hooks = require('../../dist')

    expect(hooks).to.have.property('coerce')
    expect(hooks).to.have.property('coerceQuery')
    expect(hooks).to.have.property('coercer')
  })

  it('should coerce object ids in data', function () {
    const hook = {
      data: {
        _id: id1,
        str_id: id1Str,
        ary_ids: [id1Str, id2Str],
        obj: {
          one_id: id1Str,
          two: { two_id: id2Str }
        },
        $obj: {
          $one_id: id1Str,
          $$two: { two_id: id2Str }
        }
      }
    }

    hooks.coerce()(hook)

    assert.isOk(hook.data._id.equals(id1), '_id equals id1')
    assert.isOk(hook.data.str_id.equals(id1), 'str_id equals id1')
    assert.isOk(hook.data.ary_ids[0].equals(id1), 'ary_ids[0] equals id1')
    assert.isOk(hook.data.ary_ids[1].equals(id2), 'ary_ids[1] equals id2')
    assert.isOk(hook.data.obj.one_id.equals(id1), 'obj.one_id equals id1')
    assert.isOk(
      hook.data.obj.two.two_id.equals(id2),
      'obj.two.two_id equals id2'
    )
    assert.isOk(hook.data.$obj.$one_id.equals(id1), '$obj.$one_id equals id1')
    assert.isOk(
      hook.data.$obj.$$two.two_id.equals(id2),
      '$obj.$$two.two_id equals id2'
    )
  })

  it('should coerce object ids in query params', function () {
    const hook = {
      params: {
        query: {
          _id: id1,
          str_id: id1Str,
          ary_ids: [id1Str, id2Str],
          obj: {
            one_id: id1Str,
            two: { two_id: id2Str }
          },
          $obj: {
            $one_id: id1Str,
            $$two: { two_id: id2Str }
          }
        }
      }
    }

    hooks.coerceQuery()(hook)

    assert.isOk(hook.params.query._id.equals(id1), '_id equals id1')
    assert.isOk(hook.params.query.str_id.equals(id1), 'str_id equals id1')
    assert.isOk(
      hook.params.query.ary_ids[0].equals(id1),
      'ary_ids[0] equals id1'
    )
    assert.isOk(
      hook.params.query.ary_ids[1].equals(id2),
      'ary_ids[1] equals id2'
    )
    assert.isOk(
      hook.params.query.obj.one_id.equals(id1),
      'obj.one_id equals id1'
    )
    assert.isOk(
      hook.params.query.obj.two.two_id.equals(id2),
      'obj.two.two_id equals id2'
    )
    assert.isOk(
      hook.params.query.$obj.$one_id.equals(id1),
      '$obj.$one_id equals id1'
    )
    assert.isOk(
      hook.params.query.$obj.$$two.two_id.equals(id2),
      '$obj.$$two.two_id equals id2'
    )
  })

  it('should coerce values in data', function () {
    const hook = {
      data: {
        bool_value: true,
        num_value: 12.3,
        date_value: date1,
        date_value_str: date1Str,
        date_value_ary: [date1Str, date2Str],
        date_value_obj: {
          one: date1Str,
          two: { two: date2Str }
        },
        str_value: 'abc',
        str_value_num: "'123",
        str_value_ary: ['def', 'GHI'],
        str_value_obj: {
          one: 'One',
          two: { two: 'Two' }
        }
      }
    }

    hooks.coerce()(hook)

    assert.deepEqual(hook.data, {
      bool_value: true,
      num_value: 12.3,
      date_value: date1,
      date_value_str: date1,
      date_value_ary: [date1, date2],
      date_value_obj: {
        one: date1,
        two: { two: date2 }
      },
      str_value: 'abc',
      str_value_num: "'123",
      str_value_ary: ['def', 'GHI'],
      str_value_obj: {
        one: 'One',
        two: { two: 'Two' }
      }
    })
  })

  it('should coerce values in query params', function () {
    const hook = {
      params: {
        query: {
          bool_value: true,
          bool_value_str: 'true',
          bool_value_ary: ['false', 'true'],
          bool_value_obj: {
            f: 'false',
            t: { t: 'true' }
          },
          num_value: 12.3,
          num_value_str: '4.56',
          num_value_ary: ['7.89', '010.110'],
          num_value_obj: {
            one: '-1.1',
            two: { two: '-2.2' }
          },
          date_value: date1,
          date_value_str: date1Str,
          date_value_ary: [date1Str, date2Str],
          date_value_obj: {
            one: date1Str,
            two: { two: date2Str }
          },
          str_value: 'abc',
          str_value_num: "'123",
          str_value_ary: ['def', 'GHI'],
          str_value_obj: {
            one: 'One',
            two: { two: 'Two' }
          },
          $text: {
            $search: '10'
          },
          $op: {
            $text: {
              $search: '20'
            }
          }
        }
      }
    }

    hooks.coerceQuery()(hook)

    assert.deepEqual(hook.params.query, {
      bool_value: true,
      bool_value_str: true,
      bool_value_ary: [false, true],
      bool_value_obj: {
        f: false,
        t: { t: true }
      },
      num_value: 12.3,
      num_value_str: 4.56,
      num_value_ary: [7.89, 10.11],
      num_value_obj: {
        one: -1.1,
        two: { two: -2.2 }
      },
      date_value: date1,
      date_value_str: date1,
      date_value_ary: [date1, date2],
      date_value_obj: {
        one: date1,
        two: { two: date2 }
      },
      str_value: 'abc',
      str_value_num: "'123",
      str_value_ary: ['def', 'GHI'],
      str_value_obj: {
        one: 'One',
        two: { two: 'Two' }
      },
      $text: {
        $search: '10'
      },
      $op: {
        $text: {
          $search: '20'
        }
      }
    })
  })

  it('should coerce naive dates in query params', function () {
    const hook = {
      params: {
        query: {
          date_value: naiveDate1,
          date_value_str: naiveDate1Str,
          date_value_ary: [naiveDate1Str, naiveDate2Str],
          date_value_obj: {
            one: naiveDate1Str,
            two: { two: naiveDate2Str }
          }
        }
      }
    }

    hooks.coerceQuery({ naive: true })(hook)

    assert.deepEqual(hook.params.query, {
      date_value: naiveDate1,
      date_value_str: naiveDate1,
      date_value_ary: [naiveDate1, naiveDate2],
      date_value_obj: {
        one: naiveDate1,
        two: { two: naiveDate2 }
      }
    })
  })

  it('should split list values', function () {
    const hook = {
      params: {
        query: {
          oneItem: 'item1',
          manyItems: 'item1,item2,item3,item4',
          manyItemsSep: 'item1|item2|item3,item4',
          manyItemsTrimmed: ' item1, item2  ,  item3, item4 ',
          manyItemsNotTrimmed: ' item1, item2  ,  item3, item4 ',
          manyItemsUnique: 'item1,item1,item2,item3',
          manyItemsNotUnique: 'item1,item1,item2,item3',
          noItems: '',
          nullItems: null
        }
      }
    }

    hooks.splitList('params.query.oneItem')(hook)
    hooks.splitList('params.query.manyItems')(hook)
    hooks.splitList('params.query.manyItemsSep', '|')(hook)
    hooks.splitList('params.query.manyItemsTrimmed')(hook)
    hooks.splitList('params.query.manyItemsNotTrimmed', ',', {
      trim: false
    })(hook)
    hooks.splitList('params.query.manyItemsUnique')(hook)
    hooks.splitList('params.query.manyItemsNotUnique', ',', {
      unique: false
    })(hook)
    hooks.splitList('params.query.noItems')(hook)
    hooks.splitList('params.query.nullItems')(hook)

    assert.deepEqual(hook.params.query, {
      oneItem: ['item1'],
      manyItems: ['item1', 'item2', 'item3', 'item4'],
      manyItemsSep: ['item1', 'item2', 'item3,item4'],
      manyItemsTrimmed: ['item1', 'item2', 'item3', 'item4'],
      manyItemsNotTrimmed: [' item1', ' item2  ', '  item3', ' item4 '],
      manyItemsUnique: ['item1', 'item2', 'item3'],
      manyItemsNotUnique: ['item1', 'item1', 'item2', 'item3'],
      noItems: [],
      nullItems: null
    })
  })

  it('should timestamp create', function () {
    const hook = {
      data: {
        created_at: 'created_at',
        updated_at: 'updated_at',
        something: 'something'
      },
      method: 'create',
      type: 'before'
    }

    hooks.timestamp()(hook)

    expect(hook.data).to.have.property('something', 'something')
    expect(hook.data).to.have.property('created_at').to.be.a('date')
    expect(hook.data).to.have.property('updated_at').to.be.a('date')
  })

  it('should timestamp create multiple', function () {
    const hook = {
      data: [
        {
          created_at: 'created_at',
          updated_at: 'updated_at',
          something: 'something'
        },
        {
          created_at: 'created_at',
          updated_at: 'updated_at',
          something: 'something-else'
        }
      ],
      method: 'create',
      type: 'before'
    }

    hooks.timestamp()(hook)

    expect(hook).to.have.nested.property('data.0.something', 'something')
    expect(hook).to.have.nested.property('data.0.created_at').to.be.a('date')
    expect(hook).to.have.nested.property('data.0.updated_at').to.be.a('date')

    expect(hook).to.have.nested.property('data.1.something', 'something-else')
    expect(hook).to.have.nested.property('data.1.created_at').to.be.a('date')
    expect(hook).to.have.nested.property('data.1.updated_at').to.be.a('date')
  })

  it('should timestamp update', function () {
    const hook = {
      data: {
        created_at: 'created_at',
        updated_at: 'updated_at',
        something: 'something'
      },
      method: 'update',
      type: 'before'
    }

    hooks.timestamp()(hook)

    expect(hook.data).to.have.property('something', 'something')
    expect(hook.data).to.have.property('created_at', 'created_at')
    expect(hook.data).to.have.property('updated_at').to.be.a('date')
  })

  it('should timestamp patch', function () {
    const hook = {
      data: {
        created_at: 'created_at',
        updated_at: 'updated_at',
        something: 'something'
      },
      method: 'patch',
      type: 'before'
    }

    hooks.timestamp()(hook)

    expect(hook.data).to.have.property('something', 'something')
    expect(hook.data).to.have.property('created_at', 'created_at')
    expect(hook.data).to.have.property('updated_at').to.be.a('date')
  })

  it('should userstamp create', function () {
    const hook = {
      data: {
        created_by: 'created_by',
        updated_by: 'updated_by',
        something: 'something'
      },
      method: 'create',
      type: 'before',
      params: {
        user: {
          _id: 'user-id'
        }
      }
    }

    hooks.userstamp()(hook)

    expect(hook.data).to.have.property('something', 'something')
    expect(hook.data).to.have.property('created_by', 'user-id')
    expect(hook.data).to.have.property('updated_by', 'user-id')
  })

  it('should userstamp create multiple', function () {
    const hook = {
      data: [
        {
          created_by: 'created_by',
          updated_by: 'updated_by',
          something: 'something'
        },
        {
          created_by: 'created_by',
          updated_by: 'updated_by',
          something: 'something-else'
        }
      ],
      method: 'create',
      type: 'before',
      params: {
        user: {
          _id: 'user-id'
        }
      }
    }

    hooks.userstamp()(hook)

    expect(hook).to.have.nested.property('data.0.something', 'something')
    expect(hook).to.have.nested.property('data.0.created_by', 'user-id')
    expect(hook).to.have.nested.property('data.0.updated_by', 'user-id')

    expect(hook).to.have.nested.property('data.1.something', 'something-else')
    expect(hook).to.have.nested.property('data.1.created_by', 'user-id')
    expect(hook).to.have.nested.property('data.1.updated_by', 'user-id')
  })

  it('should userstamp update', function () {
    const hook = {
      data: {
        created_by: 'created_by',
        updated_by: 'updated_by',
        something: 'something'
      },
      method: 'update',
      type: 'before',
      params: {
        user: {
          _id: 'user-id'
        }
      }
    }

    hooks.userstamp()(hook)

    expect(hook.data).to.have.property('something', 'something')
    expect(hook.data).to.have.property('created_by', 'created_by')
    expect(hook.data).to.have.property('updated_by', 'user-id')
  })

  it('should userstamp patch', function () {
    const hook = {
      data: {
        created_by: 'created_by',
        updated_by: 'updated_by',
        something: 'something'
      },
      method: 'patch',
      type: 'before',
      params: {
        user: {
          _id: 'user-id'
        }
      }
    }

    hooks.userstamp()(hook)

    expect(hook.data).to.have.property('something', 'something')
    expect(hook.data).to.have.property('created_by', 'created_by')
    expect(hook.data).to.have.property('updated_by', 'user-id')
  })

  it('should unique array values', function () {
    const hook = {
      data: {
        manyItemsUnique: ['item1', 'item2', 'item3'],
        manyItemsNotUnique: ['item1', 'item1', 'item2', 'item3'],
        noItems: [],
        nullItems: null
      }
    }

    hooks.uniqueArray('data.manyItemsUnique')(hook)
    hooks.uniqueArray('data.manyItemsNotUnique')(hook)
    hooks.uniqueArray('data.noItems')(hook)
    hooks.uniqueArray('data.nullItems')(hook)

    assert.deepEqual(hook.data, {
      manyItemsUnique: ['item1', 'item2', 'item3'],
      manyItemsNotUnique: ['item1', 'item2', 'item3'],
      noItems: [],
      nullItems: null
    })
  })
})
