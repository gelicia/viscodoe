/*global Miso,_,d3,document,$*/

/*
Kristina Durivage's entry to 'Visualize the State of Public Education in Colorado'
https://www.kaggle.com/c/visualize-the-state-of-education-in-colorado

If something is done very wrong here, please let me know. I am (kind of) new at this! 
*/

/* todo
	document data file cleanup that was needed
	antialiasing to make stroke consistant

	wont fix : -when the avg frl is higher than one year's population, you can't see the 
	year population when you expand it out
	-When frl data does not exist for one year, the average is correct with the data 
	that is there but the dark average bar still extends through all the years- even 
	the one where there was no data to average
	-styling should be in CSS
*/


// add new information to the main info array, indexed by school number

Array.prototype.addNewInfo = function(newItem, newInfoCol, newColName) {
	for (var i = 0; i < this.length; i++) {
		if (this[i].schoolNum == newItem.schoolNum){
			this[i][newColName] = newItem[newInfoCol];
		}
	}
};

//Check if info exists, by school number
Array.prototype.exists = function(key, field){
	for (var i = 0; i < this.length; i++) {
		if (this[i].schoolNum == key){
			if (this[i][field] !== undefined){
				return true;
			}
			else {
				return false;
			}
		}
	}
	return false;
};

Array.prototype.avg = function() {
	var total = 0;
	if (this.length !== 0){
		for (var i = 0; i < this.length; i++) {
			total += this[i];
		}
		return total / this.length;
	}
	else {
		return 0;
	}
	
};

Number.prototype.toLetterGrade = function(){
	switch(this.valueOf()){
		case 13 : return "A+";
		case 12 : return "A";
		case 11 : return "A-";
		case 10 : return "B+";
		case 9 : return "B";
		case 8 : return "B-";
		case 7 : return "C+";
		case 6 : return "C";
		case 5 : return "C-";
		case 4 : return "D+";
		case 3 : return "D";
		case 2 : return "D-";
		case 1 : return "F";
		case 0 : return "";
	}
};

//thanks to mbostock and trinary in #d3.js :D 
d3.selection.prototype.moveToFront = function() { 
	return this.each(function() { 
		this.parentNode.appendChild(this); 
	}); 
}; 

var allSchInfo = [];
var lastClickedIdx;

function changeSort(){
	var orderBy = $('input[name=orderBy]:checked').val();

	if(orderBy == 'schNumber'){
		_.when(
			schoolNumberSort()
		).then(
			d3.select("svg").remove(),
			d3.select("body").append("svg"),
			drawPage(undefined)
		);
	}
	else if(orderBy == 'schName'){
		_.when(
			schoolAlphaSort()
		).then(
			d3.select("svg").remove(),
			d3.select("body").append("svg"),
			drawPage(undefined)
		);
	}
	else if(orderBy == 'gradePop'){
		_.when(
			gradePopSort()
		).then(
			d3.select("svg").remove(),
			d3.select("body").append("svg"),
			drawPage(undefined)
		);
	}
	else if(orderBy == 'distNameGradePop'){
		_.when(
			districtGradeSort()
		).then(
			d3.select("svg").remove(),
			d3.select("body").append("svg"),
			drawPage('districtNum')
		);				
	}
	else if(orderBy == 'variance'){
		_.when(
			varianceSort()
		).then(
			d3.select("svg").remove(),
			d3.select("body").append("svg"),
			drawPage(undefined)
		);
	}
}

function loadDataset () {
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

	var grd2010 = new Miso.Dataset({
		url : "data/2010_kaggle/2010_final_grade.csv",
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

	var grd2011 = new Miso.Dataset({
		url : "data/2011/2011_final_grade.csv",
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

	var grd2012 = new Miso.Dataset({
		url : "data/2012/2012_final_grade.csv",
		delimiter : ","
	});

//first, push a list of all the schools with info
//this is all done within underscore's _.when so they will all fetch before proceeding
	_.when(
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
		}),
		
	//next, add in population/frl data by school
		pop2010.fetch({
			success : function() {
				this.each(
					function(row){
						var schInfo = {};
						schInfo.schoolNum = row['SCHOOL CODE'];
						schInfo.totalPop = row.TOTAL;
						schInfo.districtNum = row['DISTRICT CODE'];
						schInfo.districtName = row['DISTRICT NAME'];

						allSchInfo.addNewInfo(schInfo, 'totalPop', 'pop2010Total');
						allSchInfo.addNewInfo(schInfo, 'districtNum', 'districtNum');
						allSchInfo.addNewInfo(schInfo, 'districtName', 'districtName');


					}
				);
			}
		}),

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
		}),

		grd2010.fetch({
			success : function() {
				this.each(
					function(row){
						if (row.School_Grade !== null){
							var schInfo = {};
							schInfo.schoolNum = row.SchoolNumber;
							schInfo.grade = row.School_Grade;

							allSchInfo.addNewInfo(schInfo, 'grade', 'grade' + row.EMH + '2010');
						}
					}
				);
			}
		}),

		pop2011.fetch({
			success : function() {
				this.each(
					function(row){
						var schInfo = {};
						schInfo.schoolNum = row['School Code'];
						schInfo.totalPop = row.TOTAL;

						allSchInfo.addNewInfo(schInfo, 'totalPop', 'pop2011Total');

						if (allSchInfo.exists(schInfo.schoolNum, "districtNum") === false){
							schInfo.districtNum = row['Org. Code'];
							schInfo.districtName = row['Organization Name'];

							allSchInfo.addNewInfo(schInfo, 'districtNum', 'districtNum');
							allSchInfo.addNewInfo(schInfo, 'districtName', 'districtName');
						}
					}
				);
			}
		}),

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
		}),

		grd2011.fetch({
			success : function() {
				this.each(
					function(row){
						if (row.School_Grade !== null){
							var schInfo = {};
							schInfo.schoolNum = row.SCHOOLNUMBER;
							schInfo.grade = row.School_Grade;

							allSchInfo.addNewInfo(schInfo, 'grade', 'grade' + row.EMH + '2011');
						}
					}
				);
			}
		}),

		pop2012.fetch({
			success : function() {
				this.each(
					function(row){
						var schInfo = {};
						schInfo.schoolNum = row['School Code'];
						schInfo.totalPop = row.TOTAL;

						allSchInfo.addNewInfo(schInfo, 'totalPop', 'pop2012Total');

						if (allSchInfo.exists(schInfo.schoolNum, "districtNum") === false){
							schInfo.districtNum = row['Organization Code'];
							schInfo.districtName = row['Organization Name'];

							allSchInfo.addNewInfo(schInfo, 'districtNum', 'districtNum');
							allSchInfo.addNewInfo(schInfo, 'districtName', 'districtName');
						}
					}
				);
			}
		}),

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
		}),

		grd2012.fetch({
			success : function() {
				this.each(
					function(row){
						if (row.School_Grade !== null){
							var schInfo = {};
							schInfo.schoolNum = row["School Code"];
							schInfo.grade = row.School_Grade;

							allSchInfo.addNewInfo(schInfo, 'grade', 'grade' + row.EMH + '2012');
						}	
					}
				);
			}
		})
	).then(
		function(){
			document.getElementById("loading").style.display = 'none';
			document.getElementById("instructions").style.display = 'block';
			document.getElementById("selectionOptions").style.display = 'block';
			prepDataset();
			drawPage(undefined);
		}
	);
}

function prepDataset() {
	//in the drawn part of the chart, we care about population/FRL averages
	for (var i = 0; i < allSchInfo.length; i++) {
		var populations = [];
		var frlTotals = [];
		var grades = [];

		for(var prop in allSchInfo[i]){
			var propPre = prop.substring(0,3);
			//popYYYYTotal
			if (propPre == 'pop'){
				populations.push(allSchInfo[i][prop]);
			}
			//frlPercentYYYY
			else if (propPre == 'frl'){
				frlTotals.push(allSchInfo[i][prop]);
			}
			//gradeXYYYY
			else if (propPre == 'gra'){
				grades.push(allSchInfo[i][prop]);
			}
		}

		allSchInfo[i].avgPopTotal = Math.round(populations.avg());
		allSchInfo[i].avgFRLTotal = frlTotals.avg().toFixed(2);
		allSchInfo[i].avgGradeTotal = Math.round(grades.avg());
	}
}

//sorts
function schoolNumberSort() {
	allSchInfo = _.sortBy(allSchInfo, function(schoolInfo){ return schoolInfo.schoolNum; });
}

function schoolAlphaSort() {
	allSchInfo = _.sortBy(allSchInfo, function(schoolInfo){ return schoolInfo.schoolName; });
}

function districtGradeSort(){
	allSchInfo = allSchInfo.sort(function (a,b){
		if (a.districtName > b.districtName) return 1;
		if (a.districtName < b.districtName) return -1;
		if (a.avgGradeTotal < b.avgGradeTotal) return  1;
		if (a.avgGradeTotal > b.avgGradeTotal) return -1;
		if (a.avgPopTotal < b.avgPopTotal) return  1;
		if (a.avgPopTotal > b.avgPopTotal) return -1;
		return 0;
	});
}

function gradePopSort() {
	allSchInfo = allSchInfo.sort(function (a,b) {
		if (a.avgGradeTotal < b.avgGradeTotal) return  1;
		if (a.avgGradeTotal > b.avgGradeTotal) return -1;
		if (a.avgPopTotal < b.avgPopTotal) return  1;
		if (a.avgPopTotal > b.avgPopTotal) return -1;
		return 0;
	});
}

function varianceSort(){
	allSchInfo = allSchInfo.sort(function (a,b){
		var aVariance = 0;
		var bVariance = 0;
		if (a.avgGradeTotal !== undefined && b.avgGradeTotal !== undefined){
			//swap these out
			var yearOneGrade = getGrdByYear(2010, a);
			var yearTwoGrade = getGrdByYear(2011, a);

			if (yearOneGrade !== undefined && yearTwoGrade !== undefined){
				aVariance += Math.abs(yearOneGrade - yearTwoGrade);
			}
			yearOneGrade = getGrdByYear(2012, a);
			if (yearOneGrade !== undefined && yearTwoGrade !== undefined){
				aVariance += Math.abs(yearTwoGrade - yearOneGrade);
			}

			yearOneGrade = getGrdByYear(2010, b);
			yearTwoGrade = getGrdByYear(2011, b);

			if (yearOneGrade !== undefined && yearTwoGrade !== undefined){
				bVariance += Math.abs(yearOneGrade - yearTwoGrade);
			}
			yearOneGrade = getGrdByYear(2012, b);
			if (yearOneGrade !== undefined && yearTwoGrade !== undefined){
				bVariance += Math.abs(yearTwoGrade - yearOneGrade);
			}

		}

		if (aVariance < bVariance) return 1;
		if (aVariance > bVariance) return -1;
		return 0;
	});
}

function getGrdByYear(year, row){
	var gradeByYr = [];

	for(var prop in row){
		if (prop.substring(0,5) == "grade" && prop.substring(6, prop.length) == year){
			var schType = prop.substring(5, 6);
			gradeByYr.push(row["grade" + schType + year]);
		}
	}

	if (gradeByYr.length === 0){
		return undefined;
	}
	else if (gradeByYr.length == 1){ //if only one, display that
		return gradeByYr[0];
	}
	else {
		return Math.round(gradeByYr.avg());
	}
}

/* the subheading is done the worst way, but I am running out of time*/

function drawPage(subheading){
	//widths

	//page width needs to be bigger than maxBarWidth so the labels can fit
	var pageWidth = 2000;
	var maxBarWidth = 850;
	var singleInfoBarWidth = 20;
	var maxNumInfoPoints = 3;
	var barMargin = 5; 

	//bar colors
	var populationColor = "#69D2E7";
	var populationDarkColor = "#57AFC0";
	var frlColor = "#F18911"; 
	var frlDarkColor = "#C7710E";

	//text 
	var textColor = "#8F4F1C";
	var textDarkColor = "#694223";
	var fontSize = 14;

	//build Subheading info
	var subHeadInfo = [];

	if (subheading !== undefined){
		if (subheading=='districtNum'){ //this will probably always be the same but I only need this for one thing atm so I am not sure
			for (var i = 0; i < allSchInfo.length; i++) {
				if (i === 0 || allSchInfo[i].districtNum !== allSchInfo[i-1].districtNum){
					var distChg = {};
					distChg.districtNum = allSchInfo[i].districtNum;
					distChg.districtName = allSchInfo[i].districtName;
					distChg.rowChg = i;
					subHeadInfo.push(distChg);
				}
			}
		}
	}

	var svg = d3.select("svg")
		.attr({
			width : pageWidth,
			height : ((allSchInfo.length + subHeadInfo.length) * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth * maxNumInfoPoints)
		}); 

	//get the largest population number to establish domain
	var pop2010Max = d3.max(allSchInfo, function(d10) {
		return d10.pop2010Total;
	});
	var pop2011Max = d3.max(allSchInfo, function(d11) {
		return d11.pop2011Total;
	});
	var pop2012Max = d3.max(allSchInfo, function(d12) {
		if (d12.pop2012Total !== "NaN"){
			return d12.pop2012Total;
		}
		else {
			return 0;
		}
	});

	var popMax = d3.max([pop2010Max, pop2011Max, pop2012Max]);

	var barWidth = d3.scale.linear()
		.domain([0, popMax])
		.range([0, maxBarWidth]);

	//only used for subheadings
	var offset = 1;
	var nextChangeRow;

	if(subHeadInfo.length !== 0){
		for (var j = 0; j < subHeadInfo.length; j++) {
			var distNum = subHeadInfo[j].districtNum;
			var distName = subHeadInfo[j].districtName;
			if (distNum === undefined) {
				distNum = "0000";
			}
			if (distName === undefined) {
				distNum = "District Not Defined";
			}

			var headText =  distNum + " - " + distName;

			svg.append("text")
				.text(headText)
				.attr({
					x : 0,
					y: (j + subHeadInfo[j].rowChg) * (singleInfoBarWidth + barMargin) + 15,
					fill: textColor,
					"font-family" : "sans-serif",
					"font-size": fontSize,
					"font-weight": "bold",
					id: "subHeadLbl" + j
				});
		}

		nextChangeRow = subHeadInfo[offset].rowChg;	
	}
	 
	//Write text labels - do this first to establish baseline for bars as the maximum width of the label
	var barLbls = svg.selectAll("text.barLbl").data(allSchInfo);

	barLbls.enter()
		.append("text")
		.text(function(d){
			return d.schoolNum + " - " + d.schoolName;
		})
		.attr({
			y: function(d, i){
				if (subHeadInfo.length !== 0){
					if(i >= nextChangeRow){
						offset+=1;
						if (subHeadInfo[offset] !== undefined){
							nextChangeRow =subHeadInfo[offset].rowChg;	
						}
						else {
							nextChangeRow = allSchInfo.length;
						}
					}

					i +=  offset;
				}

				return (i * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2);
			},
			fill: textColor,
			"font-family" : "sans-serif",
			"font-size": fontSize,
			"text-anchor": "end",
			"dominant-baseline": "middle",
			id: function(d,i){
				return "barLbl" + i;
			}
		})
		.classed("barLbl", true)
		.classed("unclicked", true)		
		.on("mouseover", function (d, i) {
			mouseOverBars(i);
		})
		.on("mouseout", function (d, i) {
			mouseOutBars(i);
		})
		.on("click", function (d, i){
			clickBar(i);
		});

	//there's probably a better way to find the largest text width
	var maxTextWidth = 0;

	d3.selectAll(".barLbl")
		.each(function(){
			var textWidth = this.getComputedTextLength();
			if (textWidth > maxTextWidth){
				maxTextWidth = textWidth;
			}
		});

	d3.selectAll(".barLbl")
		.attr({
			x: maxTextWidth
		});

//popBars
	var popBars = svg.selectAll("rect.popBars").data(allSchInfo);

	if(subHeadInfo.length !== 0){
		offset = 1;
		nextChangeRow = subHeadInfo[offset].rowChg;	
	}

	popBars.enter()
		.append("rect")
		.attr({
			width : function(d){
				return barWidth(d.avgPopTotal);
			},
			height: singleInfoBarWidth, 
			x: maxTextWidth + 3,
			y: function (d, i) {
				if (subHeadInfo.length !== 0){
					if(i >= nextChangeRow){
						offset+=1;
						if (subHeadInfo[offset] !== undefined){
							nextChangeRow =subHeadInfo[offset].rowChg;	
						}
						else {
							nextChangeRow = allSchInfo.length;
						}
					}

					i +=  offset;
				}

				return i * (singleInfoBarWidth + barMargin);
			}, 
			fill : populationColor,
			id: function(d,i){
				return "popBar" + i;
			}
		})
		.classed("popBars", true)
		.classed("unclicked", true)
		.on("mouseover", function (d, i) {
			mouseOverBars(i);
		})
		.on("mouseout", function (d, i) {
			mouseOutBars(i);
		})
		.on("click", function (d, i){
			clickBar(i);
		});

//frlBars
	var frlBars = svg.selectAll("rect.frlBars").data(allSchInfo);

	if(subHeadInfo.length !== 0){
		offset = 1;
		nextChangeRow = subHeadInfo[offset].rowChg;	
	}

	frlBars.enter()
		.append("rect")
		.attr({
			width : function(d){
				return barWidth((d.avgFRLTotal/100) * d.avgPopTotal);
			},
			height: singleInfoBarWidth, 
			x: maxTextWidth + 3,
			y: function (d, i) {
				if (subHeadInfo.length !== 0){
					if(i >= nextChangeRow){
						offset+=1;
						if (subHeadInfo[offset] !== undefined){
							nextChangeRow =subHeadInfo[offset].rowChg;	
						}
						else {
							nextChangeRow = allSchInfo.length;
						}
					}

					i +=  offset;
				}

				return i * (singleInfoBarWidth + barMargin);
			}, 
			fill : frlColor,
			id: function(d,i){
				return "frlBar" + i;
			}
		})
		.classed("frlBars", true)
		.classed("unclicked", true)
		.on("mouseover", function (d, i) {
			mouseOverBars(i);
		})
		.on("mouseout", function (d, i) {
			mouseOutBars(i);
		})
		.on("click", function (d, i){
			clickBar(i); 
		});

//gradeAvg
	var gradeLabels = svg.selectAll("text.grdLbls").data(allSchInfo);

	if(subHeadInfo.length !== 0){
		offset = 1;
		nextChangeRow = subHeadInfo[offset].rowChg;	
	}

	gradeLabels.enter()
		.append("text")
		.text(function(d){
			return Number(d.avgGradeTotal).toLetterGrade();
		})
		.attr({
			x: function(d){
				return maxTextWidth + 3 + barWidth(d.avgPopTotal) + this.getComputedTextLength();
			},
			y: function(d, i){
				if (subHeadInfo.length !== 0){
					if(i >= nextChangeRow){
						offset+=1;
						if (subHeadInfo[offset] !== undefined){
							nextChangeRow =subHeadInfo[offset].rowChg;	
						}
						else {
							nextChangeRow = allSchInfo.length;
						}
					}

					i +=  offset;
				}

				return (i * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2);
			},
			fill: textColor,
			"font-family" : "sans-serif",
			"font-size": fontSize,
			"text-anchor": "end",
			"dominant-baseline": "middle",
			id: function(d,i){
				return "grdLbl" + i;
			}
		})
		.classed("grdLbls", true)
		.classed("unclicked", true)		
		.on("mouseover", function (d, i) {
			mouseOverBars(i);
		})
		.on("mouseout", function (d, i) {
			mouseOutBars(i);
		})
		.on("click", function (d, i){
			clickBar(i);
		});

	function mouseOverBars(i){
		var className = document.getElementById("popBar" + i).className.baseVal;
		//alert(className);
		if (className == "popBars unclicked"){
			svg.selectAll("#popBar" + i)
				.attr({
					fill: populationDarkColor//populationMouseOverColor
				});
			svg.selectAll("#frlBar" + i)
				.attr({
					fill: frlDarkColor//frlMouseOverColor
				});
			svg.selectAll("#barLbl" + i)
				.attr({
					fill: textDarkColor
				});
			svg.selectAll("#grdLbl" + i)
				.attr({
					fill: textDarkColor
				});
		}
	}

	function mouseOutBars(i){
		var className = document.getElementById("popBar" + i).className.baseVal;
		//alert(className);
		if (className == "popBars unclicked"){
			svg.selectAll("#popBar" + i)
				.attr({
					fill: populationColor
				});
			svg.selectAll("#frlBar" + i)
				.attr({
					fill: frlColor
				});
			svg.selectAll("#barLbl" + i)
				.attr({
					fill: textColor
				});
			svg.selectAll("#grdLbl" + i)
				.attr({
					fill: textColor
				});
		}
	}

/*3 scenarios:
	first click 
	click bar post clicking bar
	second click bar to close bar*/
	function clickBar(clickedIdx){
		//we don't care about a year if it doesn't have a population
		var numPopInfoPoints = 0;

		for(var prop in allSchInfo[clickedIdx]){
			if (prop.substring(0, 3) == "pop"){
				numPopInfoPoints += 1;
			}
		}

		//unclick previous, if exists or if it's a bar's second click
		if (lastClickedIdx !== undefined || (lastClickedIdx == clickedIdx)){
			svg.selectAll(".popBarDetail").remove();
			svg.selectAll(".frlBarDetail").remove();
			svg.selectAll(".popBarDetText").remove();
			svg.selectAll(".grdDetText").remove();
			svg.selectAll(".grdDetLbls").remove();
			svg.select(".grdDetLine").remove();

			svg.selectAll("#popBar" + lastClickedIdx)
				.classed("clicked", false)
				.classed("unclicked", true)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: singleInfoBarWidth,
					fill: populationColor
				});

			svg.selectAll("#frlBar" + lastClickedIdx)
				.classed("clicked", false)
				.classed("unclicked", true)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: singleInfoBarWidth,
					fill: frlColor,
					y: function(){
						if (lastClickedIdx > clickedIdx){ //last click is before
							return (lastClickedIdx * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth * (numPopInfoPoints - 1));
						}
						else if (lastClickedIdx < clickedIdx) { //last click was after
							return (lastClickedIdx * (singleInfoBarWidth + barMargin));
						}	
					}
				});

			//I can't get this to work at all with a transition and I don't know why - oh well
			svg.selectAll("#grdLbl" + lastClickedIdx)
				.classed("clicked", false)
				.classed("unclicked", true)
				//.transition()
				//.duration(1000)
				//.ease("linear")
				.attr({
					"fill-opacity": 1,
					"font-weight" : "normal",
					x: maxTextWidth + barWidth(allSchInfo[lastClickedIdx].avgPopTotal) + d3.select("#grdLbl" + lastClickedIdx).node().getComputedTextLength() + 6
				});
				/*.transition()
				.duration(1000)
				.ease("linear")
				.attr({
					"fill-opacity": 1
				});*/
		}

		//move those that were not clicked out of the way of the expanding clicked bar
		var notClicked;

		if (lastClickedIdx == clickedIdx){ //if second click, then all are not clicked
			notClicked = popBars;
		}
		else {
			notClicked = popBars.filter(
				function(dIn, iIn){
					return iIn != clickedIdx;
				}
			);
		}

		offset = 1;
		if(subHeadInfo.length !== 0){
			nextChangeRow = subHeadInfo[offset].rowChg;	
		}

		notClicked
			.classed("clicked", false)
			.classed("unclicked", true)
			.transition()
			.duration(1000)
			.ease("bounce")
			.attr({
				y: function (dy, iy) {
					var iyo = iy;

					if (subHeadInfo.length !== 0){
						//this is expecting the row number, which, if the click is past this index, is one more than this index
						if((iy >= clickedIdx && clickedIdx != lastClickedIdx ? iy+1 : iy) >= nextChangeRow){
							offset+=1;
							if (subHeadInfo[offset] !== undefined){
								nextChangeRow =subHeadInfo[offset].rowChg;	
							}
							else {
								nextChangeRow = allSchInfo.length;
							}
						}

						iyo +=  offset;
					}

					if (clickedIdx == lastClickedIdx){
						return iyo * (singleInfoBarWidth + barMargin);
					}
					else if (iy > (clickedIdx - 1)){
						return (iyo * (singleInfoBarWidth + barMargin)) + ((singleInfoBarWidth * numPopInfoPoints) + barMargin);
					}
					else {
						return iyo * (singleInfoBarWidth + barMargin);
					}
				},
				height: singleInfoBarWidth,
				fill: populationColor
			});

		//think this has to be done like this because the indexes for the two sets of bars are the same
		if (lastClickedIdx == clickedIdx){
			notClicked = frlBars;
		}
		else {
			notClicked = frlBars.filter(
				function(dIn, iIn){
					return iIn != clickedIdx;
				}
			);
		}

		offset = 1;
		if(subHeadInfo.length !== 0){
			nextChangeRow = subHeadInfo[offset].rowChg;	
		}

		notClicked
			.classed("clicked", false)
			.classed("unclicked", true)
			.transition()
			.duration(1000)
			.ease("bounce")
			.attr({
				y: function (dy, iy) {
					var iyo = iy;

					if (subHeadInfo.length !== 0){
						if((iy >= clickedIdx && clickedIdx != lastClickedIdx? iy+1 : iy)  >= nextChangeRow){
							offset+=1;
							if (subHeadInfo[offset] !== undefined){
								nextChangeRow =subHeadInfo[offset].rowChg;	
							}
							else {
								nextChangeRow = allSchInfo.length;
							}
						}

						iyo +=  offset;
					}

					if (clickedIdx == lastClickedIdx){
						return iyo * (singleInfoBarWidth + barMargin);
					}
					else if (iy > (clickedIdx-1)){
						return (iyo * (singleInfoBarWidth + barMargin)) + ((singleInfoBarWidth * numPopInfoPoints) + barMargin);
					}
					else {
						return iyo * (singleInfoBarWidth + barMargin);
					}
				},
				height: singleInfoBarWidth,
				fill: frlColor
			});

		if (lastClickedIdx == clickedIdx){
			notClicked = barLbls;
		}
		else {
			notClicked = barLbls.filter(
				function(dIn, iIn){
					return iIn != clickedIdx;
				}
			);
		}

		offset = 1;
		if(subHeadInfo.length !== 0){
			nextChangeRow = subHeadInfo[offset].rowChg;	
		}

		notClicked
			.classed("clicked", false)
			.classed("unclicked", true)
			.transition()
			.duration(1000)
			.ease("bounce")
			.attr({
				y: function (dy, iy) {
					var iyo = iy;
					
					if (subHeadInfo.length !== 0){
						if((iy >= clickedIdx && clickedIdx != lastClickedIdx ? iy+1 : iy)  >= nextChangeRow){
							offset+=1;
							if (subHeadInfo[offset] !== undefined){
								nextChangeRow =subHeadInfo[offset].rowChg;	
							}
							else {
								nextChangeRow = allSchInfo.length;
							}
						}

						iyo +=  offset;
					}

					if (clickedIdx == lastClickedIdx){
						return (iyo * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2);
					}
					else if (iy > (clickedIdx-1)){
						return (iyo * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2) + ((singleInfoBarWidth * numPopInfoPoints) + barMargin);
					}
					else {
						return (iyo * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2);
					}
				},
				fill: textColor
			});	

		if (lastClickedIdx == clickedIdx){
			notClicked = gradeLabels;
		}
		else {
			notClicked = gradeLabels.filter(
				function(dIn, iIn){
					return iIn != clickedIdx;
				}
			);
		}

		offset = 1;
		if(subHeadInfo.length !== 0){
			nextChangeRow = subHeadInfo[offset].rowChg;	
		}

		notClicked
			.classed("clicked", false)
			.classed("unclicked", true)
			.transition()
			.duration(1000)
			.ease("bounce")
			.attr({
				//x: 0,
				y: function (dy, iy) {
					var iyo = iy;

					if (subHeadInfo.length !== 0){
						if((iy >= clickedIdx && clickedIdx != lastClickedIdx ? iy+1 : iy)  >= nextChangeRow){
							offset+=1;
							if (subHeadInfo[offset] !== undefined){
								nextChangeRow =subHeadInfo[offset].rowChg;	
							}
							else {
								nextChangeRow = allSchInfo.length;
							}
						}

						iyo +=  offset;
					}

					if (clickedIdx == lastClickedIdx){
						return (iyo * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2);
					}
					else if (iy > (clickedIdx-1)){
						return (iyo * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2) + ((singleInfoBarWidth * numPopInfoPoints) + barMargin);
					}
					else {
						return (iyo * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2);
					}
				},
				fill: textColor
			});

		//if there are headings, move those too
		if (subHeadInfo.length !== 0){
			for (var i = 0; i < subHeadInfo.length; i++) {
				//we care if the clicked index is before the heading (grow) or if it's after but the prior click was before (shrink)
				if (subHeadInfo[i].rowChg > clickedIdx || ( subHeadInfo[i].rowChg <= clickedIdx && subHeadInfo[i].rowChg > lastClickedIdx )){ 
					d3.select("#subHeadLbl" + i)
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						y: function () {
							if (lastClickedIdx === undefined || (subHeadInfo[i].rowChg > clickedIdx && subHeadInfo[i].rowChg <= lastClickedIdx) ){
								return Number(d3.select("#subHeadLbl" + i).attr("y")) + (singleInfoBarWidth * (numPopInfoPoints - 1));
							}
							else if ((subHeadInfo[i].rowChg <= clickedIdx || clickedIdx == lastClickedIdx) && subHeadInfo[i].rowChg > lastClickedIdx) {
								return Number(d3.select("#subHeadLbl" + i).attr("y")) - (singleInfoBarWidth * (numPopInfoPoints - 1));
							}
							else {
								return Number(d3.select("#subHeadLbl" + i).attr("y")); //dont do anything
							}
							
						}
					});
				}
			}
		}

		//Run click logic - if bar's second click, nothing is clicked
		if (lastClickedIdx != clickedIdx){
			var io = clickedIdx;
		
			if (subHeadInfo.length !== 0){
				//we will always need the offset to be at least one because of the first heading
				for (var j = 1; j < subHeadInfo.length; j++) {
					if(clickedIdx < subHeadInfo[j].rowChg){
						offset = j;
						break;
					}
				}
				io +=  offset;
			}

			//svg does not support z-index, go from back to front
			//darkened average population bar and widen
			svg.select("#popBar" + clickedIdx)
				.classed("clicked", true)
				.classed("unclicked", false)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: (singleInfoBarWidth * numPopInfoPoints),
					y : io * (singleInfoBarWidth + barMargin),
					fill: populationDarkColor
				}),
			
			//Move label to stay centered	
			svg.select("#barLbl" + clickedIdx)
				.classed("clicked", true)
				.classed("unclicked", false)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					y: (io * (singleInfoBarWidth + barMargin)) + ((numPopInfoPoints * singleInfoBarWidth)/2)
				});

			//second add detailPopBars
			//all bars start at 2010 and grow down and away the average

			//2010
			if (allSchInfo[clickedIdx].pop2010Total !== undefined){
				svg.append("rect")
					.classed("popBarDetail", true)
					.attr({
						height: singleInfoBarWidth,
						x: maxTextWidth + 3, 
						y: io * (singleInfoBarWidth + barMargin), 
						fill : populationDarkColor,
						width : barWidth(allSchInfo[clickedIdx].avgPopTotal),
						id: "detPopBar2010" + clickedIdx
					})
					.on("click", function (){
						clickBar(clickedIdx);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						width : barWidth(allSchInfo[clickedIdx].pop2010Total),
						fill : populationColor
					});

				svg.append("text")
					.classed("popBarDetText", true)
					.attr({
						x:  maxTextWidth + 3 + barWidth((allSchInfo[clickedIdx].pop2010Total > allSchInfo[clickedIdx].avgPopTotal ? allSchInfo[clickedIdx].pop2010Total : allSchInfo[clickedIdx].avgPopTotal)),
						y: (io * (singleInfoBarWidth + barMargin)) + fontSize,
						id: "barLbl2010"
					});

				//this is extracted how it is to keep whatever doesn't need to be different by year (like the y coord) out
				appendPopDetailLabels(d3.select("#barLbl2010"), "2010", clickedIdx);
			}
			

			//2011	
			if (allSchInfo[clickedIdx].pop2011Total !== undefined){
				svg.append("rect")
					.classed("popBarDetail", true)
					.attr({
						height: singleInfoBarWidth, 
						x: maxTextWidth + 3,
						y: io * (singleInfoBarWidth + barMargin), 
						fill : populationDarkColor,
						width : barWidth(allSchInfo[clickedIdx].avgPopTotal),
						id: "detPopBar2011" + clickedIdx
					})
					.on("click", function (){
						clickBar(clickedIdx);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						y: io * (singleInfoBarWidth + barMargin) + (allSchInfo[clickedIdx].pop2010Total !== undefined ? singleInfoBarWidth : 0),
						width : barWidth(allSchInfo[clickedIdx].pop2011Total),
						fill : populationColor
					});

				svg.append("text")
					.classed("popBarDetText", true)
					.attr({
						x: maxTextWidth + 3 + barWidth((allSchInfo[clickedIdx].pop2011Total > allSchInfo[clickedIdx].avgPopTotal ? allSchInfo[clickedIdx].pop2011Total : allSchInfo[clickedIdx].avgPopTotal)),
						y: (io * (singleInfoBarWidth + barMargin)) + fontSize + (allSchInfo[clickedIdx].pop2010Total !== undefined ? singleInfoBarWidth : 0),
						id: "barLbl2011"
					});

				appendPopDetailLabels(d3.select("#barLbl2011"), "2011", clickedIdx);
			} 
			

			//2012
			if (allSchInfo[clickedIdx].pop2012Total !== undefined){
				svg.append("rect")
					.classed("popBarDetail", true)
					.attr({
						height: singleInfoBarWidth, 
						x: maxTextWidth + 3,
						y: io * (singleInfoBarWidth + barMargin),
						width : barWidth(allSchInfo[clickedIdx].avgPopTotal), 
						fill : populationDarkColor,
						id: "detPopBar2012" + clickedIdx
					})
					.on("click", function (){
						clickBar(clickedIdx);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						y: io * (singleInfoBarWidth + barMargin) + (allSchInfo[clickedIdx].pop2010Total !== undefined ? singleInfoBarWidth : 0) + (allSchInfo[clickedIdx].pop2011Total !== undefined ? singleInfoBarWidth : 0),
						width : barWidth(allSchInfo[clickedIdx].pop2012Total),
						fill : populationColor
					});

				svg.append("text")
					.classed("popBarDetText", true)
					.attr({
						x: maxTextWidth + 3 + barWidth((allSchInfo[clickedIdx].pop2012Total > allSchInfo[clickedIdx].avgPopTotal ? allSchInfo[clickedIdx].pop2012Total : allSchInfo[clickedIdx].avgPopTotal)),
						y: (io * (singleInfoBarWidth + barMargin)) + fontSize + (allSchInfo[clickedIdx].pop2010Total !== undefined ? singleInfoBarWidth : 0) + (allSchInfo[clickedIdx].pop2011Total !== undefined ? singleInfoBarWidth : 0),
						id: "barLbl2012"
					});

				appendPopDetailLabels(d3.select("#barLbl2012"), "2012", clickedIdx);
			}
			

			//third, move the frlBar for the clicked bar to the front, then widen and darken
			svg.selectAll("#frlBar" + clickedIdx).moveToFront();
	
			svg.selectAll("#frlBar" + clickedIdx)
				.classed("clicked", true)
				.classed("unclicked", false)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: (singleInfoBarWidth * numPopInfoPoints),
					y : io * (singleInfoBarWidth + barMargin),
					fill: frlDarkColor
				});

			//fourth, detailed frl
			//2010
			if (allSchInfo[clickedIdx].frlPercent2010 !== undefined){
				svg.append("rect")
					.classed("frlBarDetail", true)
					.attr({
						height: singleInfoBarWidth, 
						width : barWidth((allSchInfo[clickedIdx].avgFRLTotal/100) * allSchInfo[clickedIdx].pop2010Total),
						x: maxTextWidth + 3,
						y: io * (singleInfoBarWidth + barMargin), 
						fill : frlDarkColor,
						id: "detFrlBar2010" + clickedIdx
					})
					.on("click", function (){
						clickBar(clickedIdx);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						fill: frlColor,
						width : barWidth((allSchInfo[clickedIdx].frlPercent2010/100) * allSchInfo[clickedIdx].pop2010Total)

					});
			}
			
			
			//2011	
			if (allSchInfo[clickedIdx].frlPercent2011 !== undefined){
				svg.append("rect")
					.classed("frlBarDetail", true)
					.attr({
						height: singleInfoBarWidth, 
						width : barWidth((allSchInfo[clickedIdx].avgFRLTotal/100) * allSchInfo[clickedIdx].pop2011Total),
						x: maxTextWidth + 3,
						y: io * (singleInfoBarWidth + barMargin), 
						fill : frlDarkColor,
						id: "detFrlBar2011" + clickedIdx
					})
					.on("click", function (){
						clickBar(clickedIdx);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						y: io * (singleInfoBarWidth + barMargin) + (allSchInfo[clickedIdx].frlPercent2010 !== undefined ? singleInfoBarWidth : 0), 
						fill: frlColor,
						width : barWidth((allSchInfo[clickedIdx].frlPercent2011/100) * allSchInfo[clickedIdx].pop2011Total)
					});
			}

			//2012
			if (allSchInfo[clickedIdx].frlPercent2012 !== undefined){
				svg.append("rect")
					.classed("frlBarDetail", true)
					.attr({
						height: singleInfoBarWidth, 
						width : barWidth((allSchInfo[clickedIdx].avgFRLTotal/100) * allSchInfo[clickedIdx].pop2012Total),
						x: maxTextWidth + 3,
						y: io * (singleInfoBarWidth + barMargin), 
						fill : frlDarkColor,
						id: "detFrlBar2012" + clickedIdx
					})
					.on("click", function (){
						clickBar(clickedIdx);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						y: io * (singleInfoBarWidth + barMargin) + (allSchInfo[clickedIdx].frlPercent2010 !== undefined ? singleInfoBarWidth : 0) + (allSchInfo[clickedIdx].frlPercent2011 !== undefined ? singleInfoBarWidth : 0), 
						fill: frlColor,
						width : barWidth((allSchInfo[clickedIdx].frlPercent2012/100) * allSchInfo[clickedIdx].pop2012Total)
					});
			}

			//fifth - grade detail information
			//goes avg by year, detail by year, line, average overall 
			//do it in that order to get the text length 

			var maxBar = d3.max([allSchInfo[clickedIdx].pop2010Total, allSchInfo[clickedIdx].pop2011Total, allSchInfo[clickedIdx].pop2012Total]);
			var maxLbl = 0;

			d3.selectAll(".popBarDetText")
			.each(function(){
				var textWidth = this.getComputedTextLength();
				if (textWidth > maxLbl){
					maxLbl = textWidth;
				}
			});

			var grdDetX = maxTextWidth + barWidth(maxBar) + maxLbl + 6;

			//2010
			if (allSchInfo[clickedIdx].pop2010Total !== undefined){
				svg.append("text")
					.classed("grdDetText", true)
					.attr({
						"font-family" : "sans-serif",
						"font-size": fontSize - 2,
						x: grdDetX,
						y: (io * (singleInfoBarWidth + barMargin)) + fontSize,
						id: "grdLbl2010"
					});

				appendGrdYearAvgLabel(d3.select("#grdLbl2010"), "2010", clickedIdx);
			}

			//2011
			if (allSchInfo[clickedIdx].pop2011Total !== undefined){
				svg.append("text")
					.classed("grdDetText", true)
					.attr({
						"font-family" : "sans-serif",
						"font-size": fontSize - 2,
						x: grdDetX,
						y: (io * (singleInfoBarWidth + barMargin)) + fontSize + (allSchInfo[clickedIdx].pop2010Total !== undefined ? singleInfoBarWidth : 0),
						id: "grdLbl2011"
					});

				appendGrdYearAvgLabel(d3.select("#grdLbl2011"), "2011", clickedIdx);
			}

			//2012
			if (allSchInfo[clickedIdx].pop2012Total !== undefined){
				svg.append("text")
					.classed("grdDetText", true)
					.attr({
						"font-family" : "sans-serif",
						"font-size": fontSize - 2,
						x: grdDetX,
						y: (io * (singleInfoBarWidth + barMargin)) + fontSize + (allSchInfo[clickedIdx].pop2010Total !== undefined ? singleInfoBarWidth : 0) + (allSchInfo[clickedIdx].pop2011Total !== undefined ? singleInfoBarWidth : 0),
						id: "grdLbl2012"
					});

				appendGrdYearAvgLabel(d3.select("#grdLbl2012"), "2012", clickedIdx);
			}

			//details
			var startNextLbl = 0;

			d3.selectAll(".avgGrade")
				.each(function(){
					var textWidth = this.getComputedTextLength();
					if (textWidth > startNextLbl){
						startNextLbl = textWidth;
					}
			});

			//2010
			appendGrdDetailLabels(d3.select("#grdLbl2010"), "2010", clickedIdx, startNextLbl);
			//2011
			appendGrdDetailLabels(d3.select("#grdLbl2011"), "2011", clickedIdx, startNextLbl);
			//2012
			appendGrdDetailLabels(d3.select("#grdLbl2012"), "2012", clickedIdx, startNextLbl);

			//draw a line seperating details from overall average if there is grade information
			if (svg.select("#grdLbl" + clickedIdx).node().textContent !== "") {
				if (!d3.select(".grdDetLbls").empty()){
					maxLbl = 0;

					d3.selectAll(".grdDetLbls")
					.each(function(){
						var textWidth = this.getComputedTextLength();
						if (textWidth > maxLbl){
							maxLbl = textWidth;
						}
					});

					maxLbl += Number(d3.select(".grdDetLbls").attr("x"));
				}
				else {
					maxLbl = grdDetX + startNextLbl;
				}

				svg.append("line")
					.classed("grdDetLine", true)
					.attr({
						//all grdDetLbls x values will be the same, just select the first one
						"x1": maxLbl + 3,
						"y1": io * (singleInfoBarWidth + barMargin),
						"x2": maxLbl + 3,
						"y2": io * (singleInfoBarWidth + barMargin) + (singleInfoBarWidth * numPopInfoPoints)
					})
					.style("stroke", textColor);
			}

			// move average to leftmost
			svg.select("#grdLbl" + clickedIdx)
				.classed("clicked", true)
				.classed("unclicked", false)
				.attr({
					x: maxLbl + d3.select("#grdLbl" + clickedIdx).node().getComputedTextLength() + 6,
					y: (io * (singleInfoBarWidth + barMargin)) + ((numPopInfoPoints * singleInfoBarWidth)/2),
					"fill-opacity" : 0.0001
				})
				.transition()
				.duration(1000)
				.ease("linear")
				.attr({
					"fill-opacity" : 1,
					"font-weight" : "bold"
				});


			lastClickedIdx = clickedIdx;
		}
		else { //if you reclicked the previous click, clear the last clicked index like the page is new
			lastClickedIdx = undefined;
		}
		
	}

	function appendPopDetailLabels(barLbl, year, clickedIdx){
		var detailFontSize = 10;

		barLbl.append("tspan")
			.text(year + " ")
			.attr({
				fill: textColor,
				"fill-opacity": 0.0001,
				"font-weight": "bold"
			})
			.transition()
			.duration(1000)
			.ease("linear")
			.attr({
				"fill-opacity": 1
			});

		if (allSchInfo[clickedIdx]["frlPercent" + year] !== undefined){
			barLbl.append("tspan")
				.text(Math.round((allSchInfo[clickedIdx]["frlPercent" + year]/100) * allSchInfo[clickedIdx]["pop" + year + "Total"]))
				.attr({
					fill: frlDarkColor,
					"fill-opacity": 0.0001,
					"font-size" : 10
				})
				.transition()
				.duration(1000)
				.ease("linear")
				.attr({
					"fill-opacity": 1
				});

			barLbl.append("tspan")
				.text("/")
				.attr({
					fill: textColor,
					"fill-opacity": 0.0001,
					"font-size" : 10
				})
				.transition()
				.duration(1000)
				.ease("linear")
				.attr({
					"fill-opacity": 1
				});
		}

		barLbl.append("tspan")
			.text(allSchInfo[clickedIdx]["pop" + year + "Total"])
			.attr({
				fill: populationDarkColor,
				"fill-opacity": 0.0001,
				"font-size" : detailFontSize
			})
			.transition()
			.duration(1000)
			.ease("linear")
			.attr({
				"fill-opacity": 1 
			});
	}

	function getLblStrByIdx(year, clickedIdx){
		return getGrdByYear(year, allSchInfo[clickedIdx]);

	}

	function appendGrdYearAvgLabel(barLbl, year, clickedIdx){
		var improveGradeColor = "#23B23C";
		var declineGradeColor = "#D9472B";

		//in it's own method to get prev years easily
		var lblStr = getLblStrByIdx(year, clickedIdx);

		barLbl.append("tspan")
			.text(Number(lblStr).toLetterGrade())
			.classed("avgGrade", true)
			.attr({
				id : "avgGrade" + year,
				fill: function(){
					if(year == 2010){
						return textColor;
					}
					else {
						var lastLblStr = getLblStrByIdx(year-1, clickedIdx);

						if (lblStr > lastLblStr){ //improvement
							return improveGradeColor;
						}
						else if (lblStr < lastLblStr){ //not an improvement
							return declineGradeColor;
						}
						else {
							return textColor;
						}
					}
				},
				"fill-opacity": 0.0001,
				"font-weight": "bold"
			})
			.transition()
			.duration(1000)
			.ease("linear")
			.attr({
				"fill-opacity": 1
			});
	}

	function appendGrdDetailLabels(barLbl, year, clickedIdx, startNextLbl){
		var lblDetStrs = [];

		if (allSchInfo[clickedIdx]["gradeE" + year] !== undefined){
			lblDetStrs.push({grade : allSchInfo[clickedIdx]["gradeE" + year], level : "E"});
		}
		if (allSchInfo[clickedIdx]["gradeM" + year] !== undefined){
			lblDetStrs.push({grade : allSchInfo[clickedIdx]["gradeM" + year], level : "M"});
		}
		if (allSchInfo[clickedIdx]["gradeH" + year] !== undefined){
			lblDetStrs.push({grade : allSchInfo[clickedIdx]["gradeH" + year], level : "H"});
		}

		if (lblDetStrs.length > 1){
			var detailFontSize = 10;
			var improveGradeColor = "#23B23C";
			var declineGradeColor = "#D9472B";	

			barLbl.append("tspan")
				.classed("grdDetLbls" , true)
				.attr({
					id: "grdDet" + year,
					x: Number(barLbl.attr("x")) + Number(startNextLbl)
				});

			var yrGrdLine = svg.select("#grdDet" + year);

			for (var j = 0; j < lblDetStrs.length; j++) {
				yrGrdLine.append("tspan")
				.text(" " + Number(lblDetStrs[j].grade).toLetterGrade() + "(" + lblDetStrs[j].level + ")")
				.attr({
					x: function(){
						if (j === 0){
							return Number(barLbl.attr("x")) + Number(startNextLbl);
						}
						else {
							return Number(d3.select("#grdDet" + lblDetStrs[j-1].level + year).attr("x")) + d3.select("#grdDet" + lblDetStrs[j-1].level + year).node().getComputedTextLength();
						}
					},
					fill: function(){
						var lastDetStr  = allSchInfo[clickedIdx]["grade"  + lblDetStrs[j].level + (year - 1)];

						if (lastDetStr !== undefined){
							return textColor;
						}
						else if (lblDetStrs[j].grade > lastDetStr){ //improvement
							return improveGradeColor;
						}
						else if (lblDetStrs[j].grade < lastDetStr){ //not an improvement
							return declineGradeColor;
						}
						else {
							return textColor;
						}
					},
					"fill-opacity": 0.0001,
					"font-size" : detailFontSize,
					id : "grdDet" + lblDetStrs[j].level + year
				})
				.transition()
				.duration(1000)
				.ease("linear")
				.attr({
					"fill-opacity": 1
				});
			}
		}
	}
}