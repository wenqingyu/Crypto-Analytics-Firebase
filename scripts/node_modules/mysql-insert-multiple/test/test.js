
var InsertQuery = require('../index.js');
var should = require('chai').Should();

describe('normal',function(){

	it('should return sql query',function(){
		var Query = InsertQuery({
			maxRow: 2,
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

		Query.next().should.equal("insert into `person` (`name`,`sex`) values ('Jo','Male'),('Po','Female')");
	});

});

describe('composite',function(){

	it('should return sql query with composite data',function(){
		var Query = InsertQuery({
			maxRow: 2,
			table: 'person',
			data: [
				{
					'name': 'Jo',
					'sex' : {string: 'select ?? from ?? where ?? = ?', value: ['name','sexes','id',2]}
				},
				{
					'name': 'Po',
					'sex' : {string: 'select ?? from ?? where ?? = ?', value: ['name','sexes','id',1]}
				},
			]
		})

		Query.next().should.equal("insert into `person` (`name`,`sex`) values ('Jo',select `name` from `sexes` where `id` = 2),('Po',select `name` from `sexes` where `id` = 1)");
	});

});

describe('stream',function(){

	it('should return sql query from stream',function(d){

		var q = [];
		var data = [
			{
				'name': 'Jo',
				'sex' : 'Male'
			},
			{
				'name': 'Po',
				'sex' : 'Female'
			},
		];

		var result = [ 
			'insert into `person` (`name`,`sex`) values (\'Jo\',\'Male\')',
	  		'insert into `person` (`name`,`sex`) values (\'Po\',\'Female\')' 
	  	];

		var Query = InsertQuery({
			maxRow: 1,
			table: 'person',
		}).stream().on('data',function(d){
			q.push(d);
		}).on('end',function(){
			for(var i in q) q[i].should.equal(result[i]);
			d();
		});

		for(var i in data) Query.write(data[i]);
		Query.end();

	});

});