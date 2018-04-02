# mysql-insert-multiple

Node.js Utility to generate mysql insert statement, with multiple values.

Data source can be Array of object, or streamed objects.

## install
```
npm install mysql-insert-multiple
```

## Simple Usage

```js
var InsertQuery = require('mysql-insert-multiple');
InsertQuery( options );
```

**Example**:
```js
var Query = InsertQuery({
  table: 'person',
  data: [
    {
      'name': 'Jo',
      'sex' : 'Male'
    },
    {
      'name': 'Po',
      'sex' : 'Female'
    },
  ]
})

console.log(Query.next());
// insert into `person` (`name`,`sex`) values ('Jo','Male'), ('Po','Female')

```

### Default Settings
```js
{
  maxRow: 5000,
  maxByte: 10000000,
  prefix: 'insert into',
  suffix: ''
  data: undefined,
  table: undefined,
  database: undefined,
}
```

**maxRow**
> The maximum number of row in one query.

**maxByte**
> The maximum number of byte (character) in one query.

**prefix**
> Query prefix to use. e.g: *insert ignore into*

**suffix**
> Query suffix to use. e.g: *on duplicate key update \`name\` = values(\`name\`)*

**data** (optional)
> The data to insert to.

**table**
> The table to insert into.

**database** (optional)
> The database to insert into.

## Streamed data source
You can use a streamed data source. As long as the data streamed is an object.
Like, the one you get from a select statement, or streaming a csv file.

```js
var conn = require('mysql').createConnection( connOptions );

conn.query('select * from sometable').stream()
.pipe( InsertQuery({ table: 'person' }).stream() )
.on('data',function( query ){
  console.log( query );
});
```

## Composite data values
You can use mysql formatting in your data using composite data values. Composite data requires `string` and `value` to exists.

```js
var Query = InsertQuery({
  table: 'person',
  maxRow: 1,
  data: [
    {
      'name': 'Jo',
      'sex' : { 
            string: 'select name from ?? where id = ?', 
            value: ['sexes', 2] 
       }
    },
    {
      'name': 'Po',
      'sex' : { 
            string: 'select name from ?? where id = ?', 
            value: ['sexes', 1] 
       }
    },
  ]
})

console.log(Query.next());
// insert into `person` (`name`,`sex`) values ('Jo', select name from `sexes` where id = 2)

console.log(Query.next());
// insert into `person` (`name`,`sex`) values ('Po', select name from `sexes` where id = 1)
```

