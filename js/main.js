/*global Miso*/

/*
 this is not generic for now, make it generic later!
*/
Array.prototype.addNewInfo = function(newItem, newInfoCol, newColName) {
	for (var i = 0; i < this.length; i++) {
		if (this[i].schoolNum == newItem.schoolNum){
			this[i][newColName] = newItem[newInfoCol];
		}
	}
};

Array.prototype.avg = function() {
	var total;
	for (var i = 0; i < this.length; i++) {
		total = total + this[i];
	}
	return total / this.length;
};

function loadDataset () {
	var allSchInfo = [];

	var schList = new Miso.Dataset({
		url : "data/school_gps_coordinates.csv",
		delimiter : ","
	});

	//2010
	var pop2010 = new Miso.Dataset({
		url : "data/2010/2010_csv_enrl.csv",
		delimiter : ","
	});

	var frl2010 = new Miso.Dataset({
		url : "data/2010/2010_csv_frl.csv",
		delimiter : ","
	});

	//2011
	var pop2011 = new Miso.Dataset({
		url : "data/2011/2011_enrl_working.csv",
		delimiter : ","
	});

	var frl2011 = new Miso.Dataset({
		url : "data/2011/2011_k_12_FRL.csv",
		delimiter : ","
	});

	//2012
	var pop2012 = new Miso.Dataset({
		url : "data/2012/2012_enrl_working.csv",
		delimiter : ","
	}); 

	var frl2012 = new Miso.Dataset({
		url : "data/2012/2012_k_12_FRL.csv",
		delimiter : ","
	});

//first, push a list of all the schools with info
	schList.fetch({
		success : function() {
			this.each(
				function(row){
					var schInfo = {};
					schInfo.schoolNum = row['School Number'];
					schInfo.schoolName = row['School Name'];
					allSchInfo.push(schInfo);
				}
			);
		}
	});
	
//next, add in population/frl data by school
	pop2010.fetch({
		success : function() {
			this.each(
				function(row){
					var schInfo = {};
					schInfo.schoolNum = row['SCHOOL CODE'];
					schInfo.totalPop = row.TOTAL;

					allSchInfo.addNewInfo(schInfo, 'totalPop', 'pop2010Total');
				}
			);
		}
	});

	frl2010.fetch({
		success : function() {
			this.each(
				function(row){
					if (row['SCHOOL NAME'] != 'STATE TOTAL' && row['% FREE AND REDUCED'] !== null){
						var schInfo = {};
						schInfo.schoolNum = row['SCHOOL CODE'];
						schInfo.frlPct = parseFloat(row['% FREE AND REDUCED'].substring(0, row['% FREE AND REDUCED'].length - 1));

						allSchInfo.addNewInfo(schInfo, 'frlPct', 'frlPercent2010');
					}
				}
			);
		}
	});

	pop2011.fetch({
		success : function() {
			this.each(
				function(row){
					var schInfo = {};
					schInfo.schoolNum = row['School Code'];
					schInfo.totalPop = row.TOTAL;

					allSchInfo.addNewInfo(schInfo, 'totalPop', 'pop2011Total');
				}
			);
		}
	});

	frl2011.fetch({
		success : function() {
			this.each(
				function(row){
					var schInfo = {};
					schInfo.schoolNum = row['SCHOOL CODE'];
					schInfo.frlPct = parseFloat(row['% FREE AND REDUCED'].substring(0, row['% FREE AND REDUCED'].length - 1));

					allSchInfo.addNewInfo(schInfo, 'frlPct', 'frlPercent2011');				
				}
			);
		}
	});

	pop2012.fetch({
		success : function() {
			this.each(
				function(row){
					var schInfo = {};
					schInfo.schoolNum = row['School Code'];
					schInfo.totalPop = row.TOTAL;

					allSchInfo.addNewInfo(schInfo, 'totalPop', 'pop2012Total');
				}
			);
		}
	});

	frl2012.fetch({
		success : function() {
			this.each(
				function(row){
					if (row['SCHOOL NAME'] != 'STATE TOTAL' && row['% FREE AND REDUCED'] !== null){
						var schInfo = {};
						schInfo.schoolNum = row['SCHOOL CODE'];

						schInfo.frlPct = parseFloat(row['% FREE AND REDUCED'].substring(0, row['% FREE AND REDUCED'].length - 1));

						allSchInfo.addNewInfo(schInfo, 'frlPct', 'frlPercent2012');
					}
				}
			);
		}
	});

	alert(allSchInfo.length);

	for (var p = 0; p < allSchInfo.length; p++) {
		var populations = [];
		var frlTotals = [];

		if (allSchInfo[p].pop2010Total !== undefined){
			populations.push(allSchInfo[p].pop2010Total);
		}
		if (allSchInfo[p].pop2011Total !== undefined){
			populations.push(allSchInfo[p].pop2011Total);
		}
		if (allSchInfo[p].pop2012Total !== undefined){
			populations.push(allSchInfo[p].pop2012Total);
		}

		//allSchInfo[p].avgPopTotal = Math.round(populations.avg());
		//allSchInfo[i].avgFRLTotal = Math.round((allSchInfo[i].frlPercent2010 +  this[i].pop2011Total + allSchInfo[i].frlPercent2012) / 3);
	}

	console.log("hello");
}