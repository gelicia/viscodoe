/*global Miso,_,d3,document*/

/*
Kristina Durivage's entry to 'Visualize the State of Public Education in Colorado'
https://www.kaggle.com/c/visualize-the-state-of-education-in-colorado
*/

/* todo
	document data file cleanup that was needed
	Move styling to CSS?
	make it easier to close 
	make svg width larger see 1752
	add district into info for sorting
	grades formatting
	sorting/ schoolsubselect
	sort by variance, district(?), population, poorest then performing

	wont fix : -when avg frl is higher than one year's population, you can't see the 
	year population when you expand it out
	-When frl data does not exist for one year, the average is correct with the data 
	that is there but the dark average bar still extends to all the years- even 
	the one where the data was not averaged
*/

/*
 add new information to the main info array, indexed by school number
*/
Array.prototype.addNewInfo = function(newItem, newInfoCol, newColName) {
	for (var i = 0; i < this.length; i++) {
		if (this[i].schoolNum == newItem.schoolNum){
			this[i][newColName] = newItem[newInfoCol];
		}
	}
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

						allSchInfo.addNewInfo(schInfo, 'totalPop', 'pop2010Total');
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
			drawPage();
		}
	);
}

function drawPage(){
	//widths

	//page width needs to be bigger than maxBarWidth so the labels can fit
	var pageWidth = 1500;
	var maxBarWidth = 1000;
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

	//other
	var backgroundColor = "#E0E4CC";

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

	var svg = d3.select("svg")
		.attr("width", pageWidth)
		.attr("height", allSchInfo.length * (singleInfoBarWidth + barMargin) + (singleInfoBarWidth * maxNumInfoPoints));

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

	//Write text labels - do this first to establish baseline for bars as the maximum width of the label
	var barLbls = svg.selectAll("text.barLbl").data(allSchInfo);

	barLbls.enter()
		.append("text")
		.text(function(d){
			return d.schoolNum + " - " + d.schoolName;
		})
		.attr({
			y: function(d, i){
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

	popBars.enter()
		.append("rect")
		.attr({
			width : function(d){
				return barWidth(d.avgPopTotal);
			},
			height: singleInfoBarWidth, 
			x: maxTextWidth + 3,
			y: function (d, i) {
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

	frlBars.enter()
		.append("rect")
		.attr({
			width : function(d){
				return barWidth((d.avgFRLTotal/100) * d.avgPopTotal);
			},
			height: singleInfoBarWidth, 
			x: maxTextWidth + 3,
			y: function (d, i) {
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
	function clickBar(i){
		//we don't care about a year if it doesn't have a population
		var numPopInfoPoints = 0;
		//if FRL Info points is less, then make all undefined = 0
		//var numFRLInfoPoints = 0;
		
		for(var prop in allSchInfo[i]){
			if (prop.substring(0, 3) == "pop"){
				numPopInfoPoints += 1;
			}
			//else if (prop.substring(0, 10) == "frlPercent"){
			//	numFRLInfoPoints += 1;
			//}
		}

		/*if (numFRLInfoPoints < numPopInfoPoints){
			if (allSchInfo[i].frlPercent2010 === undefined){
				allSchInfo[i].frlPercent2010 = 0;
			}
			if (allSchInfo[i].frlPercent2011 === undefined){
				allSchInfo[i].frlPercent2011 = 0;
			}
			if (allSchInfo[i].frlPercent2012 === undefined){
				allSchInfo[i].frlPercent2012 = 0;
			}
		}*/



		/*alert("2010: " + ((allSchInfo[i].frlPercent2010/100) * allSchInfo[i].pop2010Total) + " / " + allSchInfo[i].pop2010Total + 
			" 2011: " + ((allSchInfo[i].frlPercent2011/100) * allSchInfo[i].pop2011Total) + " / " + allSchInfo[i].pop2011Total+ 
			" 2012: " + ((allSchInfo[i].frlPercent2012/100) * allSchInfo[i].pop2012Total) + " / " + allSchInfo[i].pop2012Total);
		*/

		//unclick previous, if exists or if it's a bar's second click
		if (lastClickedIdx !== undefined || (lastClickedIdx == i)){
			svg.selectAll(".popBarDetail").remove();
			svg.selectAll(".frlBarDetail").remove();
			svg.selectAll(".popBarDetText").remove();
			svg.selectAll(".grdDetText").remove();

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
						if (lastClickedIdx > i){ //last click is before
							return (lastClickedIdx * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth * (numPopInfoPoints - 1));
						}
						else if (lastClickedIdx < i) { //last click was after
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

		if (lastClickedIdx == i){ //if second click, then all are not clicked
			notClicked = popBars;
		}
		else {
			notClicked = popBars.filter(
				function(dIn, iIn){
					return iIn != i;
				}
			);
		}

		notClicked
			.classed("clicked", false)
			.classed("unclicked", true)
			.transition()
			.duration(1000)
			.ease("bounce")
			.attr({
				y: function (dy, iy) {
					if (i == lastClickedIdx){
						return iy * (singleInfoBarWidth + barMargin);
					}
					else if (iy > (i-1)){
						return iy * (singleInfoBarWidth + barMargin) + ((singleInfoBarWidth * numPopInfoPoints) + barMargin);
					}
					else {
						return iy * (singleInfoBarWidth + barMargin);
					}
				},
				height: singleInfoBarWidth,
				fill: populationColor
			});

		//think this has to be done like this because the indexes for the two sets of bars are the same
		//TODO I can't get it to unclick both sets at once
		if (lastClickedIdx == i){
			notClicked = frlBars;
		}
		else {
			notClicked = frlBars.filter(
				function(dIn, iIn){
					return iIn != i;
				}
			);
		}

		notClicked
			.classed("clicked", false)
			.classed("unclicked", true)
			.transition()
			.duration(1000)
			.ease("bounce")
			.attr({
				y: function (dy, iy) {
					if (i == lastClickedIdx){
						return iy * (singleInfoBarWidth + barMargin);
					}
					else if (iy > (i-1)){
						return iy * (singleInfoBarWidth + barMargin) + ((singleInfoBarWidth * numPopInfoPoints) + barMargin);
					}
					else {
						return iy * (singleInfoBarWidth + barMargin);
					}
				},
				height: singleInfoBarWidth,
				fill: frlColor
			});

		if (lastClickedIdx == i){
			notClicked = barLbls;
		}
		else {
			notClicked = barLbls.filter(
				function(dIn, iIn){
					return iIn != i;
				}
			);
		}

		notClicked
			.classed("clicked", false)
			.classed("unclicked", true)
			.transition()
			.duration(1000)
			.ease("bounce")
			.attr({
				y: function (dy, iy) {
					if (i == lastClickedIdx){
						return (iy * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2);
					}
					else if (iy > (i-1)){
						return (iy * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2) + ((singleInfoBarWidth * numPopInfoPoints) + barMargin);
					}
					else {
						return (iy * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2);
					}
				},
				fill: textColor
			});	

		if (lastClickedIdx == i){
			notClicked = gradeLabels;
		}
		else {
			notClicked = gradeLabels.filter(
				function(dIn, iIn){
					return iIn != i;
				}
			);
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
					if (i == lastClickedIdx){
						return (iy * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2);
					}
					else if (iy > (i-1)){
						return (iy * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2) + ((singleInfoBarWidth * numPopInfoPoints) + barMargin);
					}
					else {
						return (iy * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2);
					}
				},
				fill: textColor
			});	

		//Run click logic - if bar's second click, nothing is clicked
		if (lastClickedIdx != i){
			//svg does not support z-index, go from back to front
			//darkened average population bar and widen
			svg.select("#popBar" + i)
				.classed("clicked", true)
				.classed("unclicked", false)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: (singleInfoBarWidth * numPopInfoPoints),
					y : i * (singleInfoBarWidth + barMargin),
					fill: populationDarkColor
				}),
			
			//Move label to stay centered	
			svg.select("#barLbl" + i)
				.classed("clicked", true)
				.classed("unclicked", false)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					y: (i * (singleInfoBarWidth + barMargin)) + ((numPopInfoPoints * singleInfoBarWidth)/2)
				});

			//second add detailPopBars
			//all bars start at 2010 and grow down and away the average

			//2010
			if (allSchInfo[i].pop2010Total !== undefined){
				svg.append("rect")
					.classed("popBarDetail", true)
					.attr({
						height: singleInfoBarWidth,
						x: maxTextWidth + 3, 
						y: i * (singleInfoBarWidth + barMargin), 
						fill : populationDarkColor,
						width : barWidth(allSchInfo[i].avgPopTotal),
						id: "detPopBar2010" + i
					})
					.on("click", function (d, i){
						clickBar(i);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						width : barWidth(allSchInfo[i].pop2010Total),
						fill : populationColor
					});

				svg.append("text")
					.classed("popBarDetText", true)
					.attr({
						x:  maxTextWidth + 3 + barWidth((allSchInfo[i].pop2010Total > allSchInfo[i].avgPopTotal ? allSchInfo[i].pop2010Total : allSchInfo[i].avgPopTotal)),
						y: (i * (singleInfoBarWidth + barMargin)) + fontSize,
						id: "barLbl2010"
					});

				//this is extracted how it is to keep whatever doesn't need to be different by year (like the y coord) out
				appendPopDetailLabels(d3.select("#barLbl2010"), "2010", i);
			}
			

			//2011	
			if (allSchInfo[i].pop2011Total !== undefined){
				svg.append("rect")
					.classed("popBarDetail", true)
					.attr({
						height: singleInfoBarWidth, 
						x: maxTextWidth + 3,
						y: i * (singleInfoBarWidth + barMargin), 
						fill : populationDarkColor,
						width : barWidth(allSchInfo[i].avgPopTotal),
						id: "detPopBar2011" + i
					})
					.on("click", function (d, i){
						clickBar(i);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						y: i * (singleInfoBarWidth + barMargin) + (allSchInfo[i].pop2010Total !== undefined ? singleInfoBarWidth : 0),
						width : barWidth(allSchInfo[i].pop2011Total),
						fill : populationColor
					});

				svg.append("text")
					.classed("popBarDetText", true)
					.attr({
						x: maxTextWidth + 3 + barWidth((allSchInfo[i].pop2011Total > allSchInfo[i].avgPopTotal ? allSchInfo[i].pop2011Total : allSchInfo[i].avgPopTotal)),
						y: (i * (singleInfoBarWidth + barMargin)) + fontSize + (allSchInfo[i].pop2010Total !== undefined ? singleInfoBarWidth : 0),
						id: "barLbl2011"
					});

				appendPopDetailLabels(d3.select("#barLbl2011"), "2011", i);
			} 
			

			//2012
			if (allSchInfo[i].pop2012Total !== undefined){
				svg.append("rect")
					.classed("popBarDetail", true)
					.attr({
						height: singleInfoBarWidth, 
						x: maxTextWidth + 3,
						y: i * (singleInfoBarWidth + barMargin),
						width : barWidth(allSchInfo[i].avgPopTotal), 
						fill : populationDarkColor,
						id: "detPopBar2012" + i
					})
					.on("click", function (d, i){
						clickBar(i);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						y: i * (singleInfoBarWidth + barMargin) + (allSchInfo[i].pop2010Total !== undefined ? singleInfoBarWidth : 0) + (allSchInfo[i].pop2011Total !== undefined ? singleInfoBarWidth : 0),
						width : barWidth(allSchInfo[i].pop2012Total),
						fill : populationColor
					});

				svg.append("text")
					.classed("popBarDetText", true)
					.attr({
						x: maxTextWidth + 3 + barWidth((allSchInfo[i].pop2012Total > allSchInfo[i].avgPopTotal ? allSchInfo[i].pop2012Total : allSchInfo[i].avgPopTotal)),
						y: (i * (singleInfoBarWidth + barMargin)) + fontSize + (allSchInfo[i].pop2010Total !== undefined ? singleInfoBarWidth : 0) + (allSchInfo[i].pop2011Total !== undefined ? singleInfoBarWidth : 0),
						id: "barLbl2012"
					});

				appendPopDetailLabels(d3.select("#barLbl2012"), "2012", i);
			}
			

			//third, move the frlBar for the clicked bar to the front, then widen and darken
			svg.selectAll("#frlBar" + i).moveToFront();
	
			svg.selectAll("#frlBar" + i)
				.classed("clicked", true)
				.classed("unclicked", false)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: (singleInfoBarWidth * numPopInfoPoints),
					y : i * (singleInfoBarWidth + barMargin),
					fill: frlDarkColor
				});

			//fourth, detailed frl
			//2010
			if (allSchInfo[i].frlPercent2010 !== undefined){
				svg.append("rect")
					.classed("frlBarDetail", true)
					.attr({
						height: singleInfoBarWidth, 
						width : barWidth((allSchInfo[i].avgFRLTotal/100) * allSchInfo[i].pop2010Total),
						x: maxTextWidth + 3,
						y: i * (singleInfoBarWidth + barMargin), 
						fill : frlDarkColor,
						id: "detFrlBar2010" + i
					})
					.on("click", function (d, i){
						clickBar(i);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						fill: frlColor,
						width : barWidth((allSchInfo[i].frlPercent2010/100) * allSchInfo[i].pop2010Total)

					});
			}
			
			
			//2011	
			if (allSchInfo[i].frlPercent2011 !== undefined){
				svg.append("rect")
					.classed("frlBarDetail", true)
					.attr({
						height: singleInfoBarWidth, 
						width : barWidth((allSchInfo[i].avgFRLTotal/100) * allSchInfo[i].pop2011Total),
						x: maxTextWidth + 3,
						y: i * (singleInfoBarWidth + barMargin), 
						fill : frlDarkColor,
						id: "detFrlBar2011" + i
					})
					.on("click", function (d, i){
						clickBar(i);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						y: i * (singleInfoBarWidth + barMargin) + (allSchInfo[i].frlPercent2010 !== undefined ? singleInfoBarWidth : 0), 
						fill: frlColor,
						width : barWidth((allSchInfo[i].frlPercent2011/100) * allSchInfo[i].pop2011Total)
					});
			}

			//2012
			if (allSchInfo[i].frlPercent2012 !== undefined){
				svg.append("rect")
					.classed("frlBarDetail", true)
					.attr({
						height: singleInfoBarWidth, 
						width : barWidth((allSchInfo[i].avgFRLTotal/100) * allSchInfo[i].pop2012Total),
						x: maxTextWidth + 3,
						y: i * (singleInfoBarWidth + barMargin), 
						fill : frlDarkColor,
						id: "detFrlBar2012" + i
					})
					.on("click", function (d, i){
						clickBar(i);
					})
					.transition()
					.duration(1000)
					.ease("bounce")
					.attr({
						y: i * (singleInfoBarWidth + barMargin) + (allSchInfo[i].frlPercent2010 !== undefined ? singleInfoBarWidth : 0) + (allSchInfo[i].frlPercent2011 !== undefined ? singleInfoBarWidth : 0), 
						fill: frlColor,
						width : barWidth((allSchInfo[i].frlPercent2012/100) * allSchInfo[i].pop2012Total)
					});
			}

			//fifth - grade detail information
			//goes avg by year, detail by year, line, average overall 
			var maxBar = d3.max([allSchInfo[i].pop2010Total, allSchInfo[i].pop2011Total, allSchInfo[i].pop2012Total]);
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
			if (allSchInfo[i].pop2010Total !== undefined){
				svg.append("text")
					.classed("grdDetText", true)
					.attr({
						"font-family" : "sans-serif",
						"font-size": fontSize - 2,
						x: grdDetX,
						y: (i * (singleInfoBarWidth + barMargin)) + fontSize,
						id: "grdLbl2010"
					});

				appendGrdDetailLabels(d3.select("#grdLbl2010"), "2010", i);
			}

			//2011
			if (allSchInfo[i].pop2011Total !== undefined){
				svg.append("text")
					.classed("grdDetText", true)
					.attr({
						"font-family" : "sans-serif",
						"font-size": fontSize - 2,
						x: grdDetX,
						y: (i * (singleInfoBarWidth + barMargin)) + fontSize + (allSchInfo[i].pop2010Total !== undefined ? singleInfoBarWidth : 0),
						id: "grdLbl2011"
					});

				appendGrdDetailLabels(d3.select("#grdLbl2011"), "2011", i);
			}

			//2012
			if (allSchInfo[i].pop2012Total !== undefined){
				svg.append("text")
					.classed("grdDetText", true)
					.attr({
						"font-family" : "sans-serif",
						"font-size": fontSize - 2,
						x: grdDetX,
						y: (i * (singleInfoBarWidth + barMargin)) + fontSize + (allSchInfo[i].pop2010Total !== undefined ? singleInfoBarWidth : 0) + (allSchInfo[i].pop2011Total !== undefined ? singleInfoBarWidth : 0),
						id: "grdLbl2012"
					});

				appendGrdDetailLabels(d3.select("#grdLbl2012"), "2012", i);
			}
			
			// move average to leftmost
			svg.select("#grdLbl" + i)
				.classed("clicked", true)
				.classed("unclicked", false)
				.attr({
					x: function(){
						var maxLbl = 0;

						d3.selectAll(".grdDetText")
						.each(function(){
							var textWidth = this.getComputedTextLength();
							if (textWidth > maxLbl){
								maxLbl = textWidth;
							}
						});
						//alert(maxLbl);
						return grdDetX +  maxLbl + this.getComputedTextLength() + 3;
					},
					y: (i * (singleInfoBarWidth + barMargin)) + ((numPopInfoPoints * singleInfoBarWidth)/2),
					"fill-opacity" : 0.0001
				})
				.transition()
				.duration(1000)
				.ease("linear")
				.attr({
					"fill-opacity" : 1,
					"font-weight" : "bold"
				});


			lastClickedIdx = i;
		}
		else { //if you reclicked the previous click, clear the last clicked index like the page is new
			lastClickedIdx = undefined;
		}
		
	}

	function appendPopDetailLabels(barLbl, year, i){
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

		if (allSchInfo[i]["frlPercent" + year] !== undefined){
			barLbl.append("tspan")
				.text(Math.round((allSchInfo[i]["frlPercent" + year]/100) * allSchInfo[i]["pop" + year + "Total"]))
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
			.text(allSchInfo[i]["pop" + year + "Total"])
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

	function getLblStr(year, i){
		var gradeByYr = [];

		for(var prop in allSchInfo[i]){
			if (prop.substring(0,5) == "grade" && prop.substring(6, prop.length) == year){
				var schType = prop.substring(5, 6);
				gradeByYr.push(allSchInfo[i]["grade" + schType + year]);
			}
		}

		if (gradeByYr.length == 1){ //if only one, display that
			return gradeByYr[0];
		}
		else {
			return Math.round(gradeByYr.avg());
		}

	}

	function appendGrdDetailLabels(barLbl, year, i){
		var detailFontSize = 10;
		var improveGradeColor = "#23B23C";
		var declineGradeColor = "#D9472B";

		//in it's own method to get prev years easily
		var lblStr = getLblStr(year, i);
		var lblDetStrs = [];


		if (allSchInfo[i]["gradeE" + year] !== undefined){
			lblDetStrs.push({grade : allSchInfo[i]["gradeE" + year], level : "E"});
		}
		if (allSchInfo[i]["gradeM" + year] !== undefined){
			lblDetStrs.push({grade : allSchInfo[i]["gradeM" + year], level : "M"});
		}
		if (allSchInfo[i]["gradeH" + year] !== undefined){
			lblDetStrs.push({grade : allSchInfo[i]["gradeH" + year], level : "H"});
		}

		barLbl.append("tspan")
			.text(Number(lblStr).toLetterGrade())
			.attr({
				fill: function(){
					if(year == 2010){
						return textColor;
					}
					else {
						var lastLblStr = getLblStr(year-1, i);

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

		if (lblDetStrs.length > 1){
			for (var j = 0; j < lblDetStrs.length; j++) {
				barLbl.append("tspan")
				.text(" " + Number(lblDetStrs[j].grade).toLetterGrade() + "(" + lblDetStrs[j].level + ")")
				.attr({
					fill: function(){
						var lastDetStr  = allSchInfo[i]["grade"  + lblDetStrs[j].level + (year - 1)];

						if (lblDetStrs[j].grade > lastDetStr){ //improvement
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
					"font-size" : detailFontSize
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