
var Transform = require('stream').Transform;
var inherits = require('util').inherits;
var mysql = require('mysql');

// QueryCreator
var QueryCreator = function(opt){
	this.count = 0;
	this.prefix = opt.prefix;
	this.suffix = opt.suffix;
	this.query = this.prefix;
	this.sep = '';
	this.valsep = '';
	this.keys = [];
};

QueryCreator.prototype.add = function(obj){
	this.count++;

	if(!this.keys.length){
		this.query += ' (';
		this.keys = Object.keys(obj);
		for(var i in this.keys) {
			this.query += this.sep + mysql.format('??',this.keys[i]);
			this.sep = ',';
		}
		this.query += ') values ';
		this.sep = '';
	};
	
	this.query += this.sep + '(';
	for(var i in this.keys){
		if (obj[this.keys[i]] == undefined)
			this.query += this.valsep +'null';
		else if( obj[this.keys[i]].string && obj[this.keys[i]].value)
			this.query += this.valsep + mysql.format( obj[this.keys[i]].string, obj[this.keys[i]].value );
		else this.query += this.valsep + mysql.format('?', [obj[this.keys[i]]] );
		this.valsep = ',';
	}

	this.query += ')';
	this.valsep = '';
	this.sep = ',';
};

QueryCreator.prototype.length = function(){
	return this.query.length;
};

QueryCreator.prototype.close = function(){
	this.count = 0;
	this.sep = '';
	this.valsep = '';
	this.keys = [];
	var query = this.query + '';
	this.query = this.prefix;
	return query + ( this.suffix ? ' ' + this.suffix : '' );
}


// streamer interface
var Streamer = function(opt){

	this.qc = opt.qc;
	this.maxRow = opt.maxRow;
	this.maxByte = opt.maxByte;
	Transform.call(this,{writableObjectMode:true,readableObjectMode:true});

};

inherits(Streamer,Transform);

Streamer.prototype._transform = function(c,e,d){
	this.qc.add(c);
	if(this.qc.length>=this.maxByte) this.push(this.qc.close(),'utf8');
	else if(this.qc.count>=this.maxRow) this.push(this.qc.close(),'utf8');
	d();
};

Streamer.prototype._flush = function(d){
	if(this.qc.length && this.qc.query != this.qc.prefix) this.push(this.qc.close(),'utf8');
	d();
};


var MysqlInsertQuery = function(opt){
	
	this._data = opt.data || false;
	this._lastIndex = 0;

	this.database = opt.database || '';
	this.table = opt.table;

	var tablePrefix = (this.database ? this.database + '.' : '') + this.table;

	this.prefix = opt.prefix ? opt.prefix.trim() : 'insert into';
	this.suffix = opt.suffix ? opt.suffix.trim() : '';
	this.maxRow = isNaN(opt.maxRow*1) ? 5000 : opt.maxRow*1;
	this.maxByte = isNaN(opt.maxByte*1) ? 10000000 : opt.maxByte*1;
	this.queryCreator = new QueryCreator({ prefix:this.prefix + ' ' + mysql.format('??',[tablePrefix]), suffix:this.suffix });

};

MysqlInsertQuery.prototype.stream = function(){
	
	if(this._data){
		throw new Error('mysql-insert-multiple: Transform should not be used if data exists');
	}

	return new Streamer({
		qc: this.queryCreator,
		maxByte: this.maxByte,
		maxRow: this.maxRow
	});

}

MysqlInsertQuery.prototype.next = function(){

	if(!this._data){
		throw new Error('mysql-insert-multiple: next function call should only be used with data');
	}

	var q = '';	
	var limit = this._lastIndex + this.maxRow;
	for(this._lastIndex;this._lastIndex<limit;this._lastIndex++){

		this.queryCreator.add( this._data[this._lastIndex] );
		if( 
			this._lastIndex >= this._data.length ||
			this.queryCreator.length >= this.maxByte 
		) return this.queryCreator.close();

	}

	return this.queryCreator.close();

}

module.exports = exports = function(opt){
	return new MysqlInsertQuery(opt);
};