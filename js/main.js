/*global Miso,_,d3,document*/

/*
Kristina Durivage's entry to 'Visualize the State of Public Education in Colorado'
https://www.kaggle.com/c/visualize-the-state-of-education-in-colorado
*/

/* todo
	Move styling to CSS?
	get FRL to transition like pop
	Deal with schools with less than 3 years data (ie 29, 48)
	get school grades in
	get school details in 
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
	for (var i = 0; i < this.length; i++) {
		total += this[i];
	}
	return total / this.length;
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
		url : "data/2010/2010_kaggle/2010_final_grade.csv",
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
		url : "data/2011/2012_final_grade.csv",
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
	var numInfoPoints = 3;
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

		if (allSchInfo[i].pop2010Total !== undefined){
			populations.push(allSchInfo[i].pop2010Total);
		}
		if (allSchInfo[i].pop2011Total !== undefined){
			populations.push(allSchInfo[i].pop2011Total);
		}
		if (allSchInfo[i].pop2012Total !== undefined){
			populations.push(allSchInfo[i].pop2012Total);
		}

		if (allSchInfo[i].frlPercent2010 !== undefined){
			frlTotals.push(allSchInfo[i].frlPercent2010);
		}
		if (allSchInfo[i].frlPercent2011 !== undefined){
			frlTotals.push(allSchInfo[i].frlPercent2011);
		}
		if (allSchInfo[i].frlPercent2012 !== undefined){
			frlTotals.push(allSchInfo[i].frlPercent2012);
		}

		allSchInfo[i].avgPopTotal = Math.round(populations.avg());
		allSchInfo[i].avgFRLTotal = frlTotals.avg().toFixed(2);
	}

	var svg = d3.select("svg")
		.attr("width", pageWidth)
		.attr("height", allSchInfo.length * (singleInfoBarWidth + barMargin) + (singleInfoBarWidth * numInfoPoints));

	//get the largest population number to establish domain
	var pop2010Max = d3.max(allSchInfo, function(d10) {
		return d10.pop2010Total;
	});
	var pop2011Max = d3.max(allSchInfo, function(d11) {
		return d11.pop2011Total;
	});
	var pop2012Max = d3.max(allSchInfo, function(d12) {
		return d12.pop2012Total;
	});

	var popMax = d3.max([pop2010Max, pop2011Max, pop2012Max]);

	var barWidth = d3.scale.linear()
		.domain([0, popMax])
		.range([0, maxBarWidth]);

	//Write text labels - do this first to establish baseline for bars as the maximum width of the label
	var lbls = svg.selectAll("text.barLbl").data(allSchInfo);

	lbls.enter()
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
		}
	}

/*3 scenarios:
	first click 
	click bar post clicking bar
	second click bar to close bar*/
	function clickBar(i){
		/*alert("2010: " + ((allSchInfo[i].frlPercent2010/100) * allSchInfo[i].pop2010Total) + " / " + allSchInfo[i].pop2010Total + 
			" 2011: " + ((allSchInfo[i].frlPercent2011/100) * allSchInfo[i].pop2011Total) + " / " + allSchInfo[i].pop2011Total+ 
			" 2012: " + ((allSchInfo[i].frlPercent2012/100) * allSchInfo[i].pop2012Total) + " / " + allSchInfo[i].pop2012Total);
		*/

		//unclick previous, if exists or if it's a bar's second click
		if (lastClickedIdx !== undefined || (lastClickedIdx == i)){
			svg.selectAll(".popBarDetail").remove();
			svg.selectAll(".frlBarDetail").remove();
			svg.selectAll(".popBarDetText").remove();

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
							return (lastClickedIdx * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth * (numInfoPoints - 1));
						}
						else if (lastClickedIdx < i) { //last click was after
							return (lastClickedIdx * (singleInfoBarWidth + barMargin));
						}	
					}
				});
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
						return iy * (singleInfoBarWidth + barMargin) + ((singleInfoBarWidth * numInfoPoints) + barMargin);
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
						return iy * (singleInfoBarWidth + barMargin) + ((singleInfoBarWidth * numInfoPoints) + barMargin);
					}
					else {
						return iy * (singleInfoBarWidth + barMargin);
					}
				},
				height: singleInfoBarWidth,
				fill: frlColor
			});

		if (lastClickedIdx == i){
			notClicked = lbls;
		}
		else {
			notClicked = lbls.filter(
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
						return (iy * (singleInfoBarWidth + barMargin)) + (singleInfoBarWidth/2) + ((singleInfoBarWidth * numInfoPoints) + barMargin);
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
					height: (singleInfoBarWidth * numInfoPoints),
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
					y: (i * (singleInfoBarWidth + barMargin)) + ((numInfoPoints * singleInfoBarWidth)/2)
				});

			//second add detailPopBars
			//all bars start at 2010 and grow down and away the average

			//2010
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
			appendDetailLabels(d3.select("#barLbl2010"), "2010", i);

			//2011	
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
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					y: i * (singleInfoBarWidth + barMargin) + singleInfoBarWidth,
					width : barWidth(allSchInfo[i].pop2011Total),
					fill : populationColor
				});

			svg.append("text")
				.classed("popBarDetText", true)
				.attr({
					fill: backgroundColor,
					x: maxTextWidth + 3 + barWidth((allSchInfo[i].pop2011Total > allSchInfo[i].avgPopTotal ? allSchInfo[i].pop2011Total : allSchInfo[i].avgPopTotal)),
					y: (i * (singleInfoBarWidth + barMargin)) + fontSize + singleInfoBarWidth,
					id: "barLbl2011"
				});

			appendDetailLabels(d3.select("#barLbl2011"), "2011", i);

			//2012
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
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					y: i * (singleInfoBarWidth + barMargin) + (singleInfoBarWidth * 2),
					width : barWidth(allSchInfo[i].pop2012Total),
					fill : populationColor
				});

			svg.append("text")
				.classed("popBarDetText", true)
				.attr({
					fill: backgroundColor,
					x: maxTextWidth + 3 + barWidth((allSchInfo[i].pop2012Total > allSchInfo[i].avgPopTotal ? allSchInfo[i].pop2012Total : allSchInfo[i].avgPopTotal)),
					y: (i * (singleInfoBarWidth + barMargin)) + fontSize + (singleInfoBarWidth * 2),
					id: "barLbl2012"
				});

			appendDetailLabels(d3.select("#barLbl2012"), "2012", i);

			//third, move the frlBar for the clicked bar to the front, then widen and darken
			svg.selectAll("#frlBar" + i).moveToFront();
	
			svg.selectAll("#frlBar" + i)
				.classed("clicked", true)
				.classed("unclicked", false)
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					height: (singleInfoBarWidth * numInfoPoints),
					y : i * (singleInfoBarWidth + barMargin),
					fill: frlDarkColor
				});

			//fourth, detailed frl
			//2010
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
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					fill: frlColor,
					width : barWidth((allSchInfo[i].frlPercent2010/100) * allSchInfo[i].pop2010Total)

				});
			
			//2011	
			svg.append("rect")
				.classed("frlBarDetail", true)
				.attr({
					height: singleInfoBarWidth, 
					width : barWidth((allSchInfo[i].avgFRLTotal/100) * allSchInfo[i].pop2010Total),
					x: maxTextWidth + 3,
					y: i * (singleInfoBarWidth + barMargin), 
					fill : frlDarkColor,
					id: "detFrlBar2011" + i
				})
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					y: i * (singleInfoBarWidth + barMargin) + singleInfoBarWidth, 
					fill: frlColor,
					width : barWidth((allSchInfo[i].frlPercent2011/100) * allSchInfo[i].pop2011Total)
				});

			//2012
			svg.append("rect")
				.classed("frlBarDetail", true)
				.attr({
					height: singleInfoBarWidth, 
					width : barWidth((allSchInfo[i].avgFRLTotal/100) * allSchInfo[i].pop2010Total),
					x: maxTextWidth + 3,
					y: i * (singleInfoBarWidth + barMargin), 
					fill : frlDarkColor,
					id: "detFrlBar2012" + i
				})
				.transition()
				.duration(1000)
				.ease("bounce")
				.attr({
					y: i * (singleInfoBarWidth + barMargin) + (singleInfoBarWidth * 2), 
					fill: frlColor,
					width : barWidth((allSchInfo[i].frlPercent2012/100) * allSchInfo[i].pop2012Total)
				});
		
			lastClickedIdx = i;
		}
		else { //if you reclicked the previous click, clear the last clicked index like the page is new
			lastClickedIdx = undefined;
		}
		
	}

	function appendDetailLabels(barLbl, year, i){
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
}