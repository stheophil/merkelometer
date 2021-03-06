"use strict";

require.config({
    baseUrl: "./assets/js",
    shim: {
        'highcharts': {
            deps: ['jquery']
        }
    }
});

require(["jquery", "marked", "highcharts"], function($, marked) {
	var deferredStmts = $.ajax({url: 'http://www.wahlversprechen2013.de/json/items/Koalitionsvertrag'});
	var deferredCategories = $.ajax({url: 'http://www.wahlversprechen2013.de/json/categories'});
	$.when(deferredStmts, deferredCategories).done(
		function(stmtsResult, categoriesResult) {
			var stmts = stmtsResult[0];
			var categories = categoriesResult[0];

			var ratings = [
				{ value: "PromiseKept", id: 0, name: "Gehalten", glyph: "glyphicon-thumbs-up", color: "#5cb85c" },
				{ value: "Compromise", id: 1, name: "Kompromiss", glyph: "glyphicon-adjust", color: "#f0ad4e"  }, 
				{ value: "PromiseBroken", id: 2, name: "Gebrochen", glyph: "glyphicon-thumbs-down", color: "#d9534f" }, 
				{ value: "Stalled", id: 3, name: "Blockiert", glyph: "glyphicon-time", color: "#d9984f"  },
				{ value: "InTheWorks", id: 4, name: "In Arbeit", glyph: "glyphicon-cog", color: "#5bc0de"  },
				{ value: "Unrated", id: 5, name: "Unbewertet", glyph: "glyphicon-question-sign", color: "#aaaaaa"  }
			];
			var idxUndefined = "Unrated";

		    function display(index) {
		    	var stmt = stmts[index];
				console.log("Display quote " + stmt);
				var title = $('#entry-title');
				var quote = $('#entry-quote');
				var quote_src = $('#entry-source');
				var rating = $('#rating');

				title.html("<a href='http://www.wahlversprechen2013.de/item/"+stmt.id+"' target=_blank>"+stmt.title+"</a>");
				quote.html(marked(stmt.quote));
				quote_src.html(marked(stmt.quote_src));

				var ratingValue = (stmt.ratings.length===0 ? idxUndefined : stmt.ratings[stmt.ratings.length-1].rating);
				var i = ratings.map(function(r) { return r.value; }).indexOf(ratingValue);
				if(i!==-1) {
					rating.html("<span style='color: "+ratings[i].color+"'>"+
						"<span class='glyphicon "+ratings[i].glyph+"'></span>&nbsp;"+
						ratings[i].name+
						"</span>");
				}

				$('#category').html(stmt.category);

	            DISQUS.reset({
	                reload: true,
	                config: function () {
	                    this.page.identifier = stmt.id;
	                    this.page.url = 'http://www.wahlversprechen2013.de/item/' + stmt.id;
	                    this.page.title = stmt.title;
	                    this.language = 'de';
	                }
	            });
			}

			function reload() {
				var index = Math.ceil( Math.random() * stmts.length );
				window.location.hash = index;
				display(index);
			}

			function doRouting() {
				var arg = window.location.hash;
				var regex = /#([0-9]+)/ig;
				var r = regex.exec(arg);
				if(r===null) {
					reload();
				} else {
					display(r[1]);
				}
			}

			function renderHighscorePage(commenters, page, elementsPerPage, element) {
				var begin = (page-1) * elementsPerPage;
				var end = page * elementsPerPage;				
				var commentersPage = commenters.slice(begin, end).map(
					function(c, i) {
						if(begin + i < 10) {
							c.glyph = "<sup><span class='glyphicon glyphicon-star' style='color: gold'/></sup>";
						} else if(begin + i < 20) {
							c.glyph = "<sup><span class='glyphicon glyphicon-star' style='color: silver'/></sup>";
						}
						return c;
					});

				element.children().remove();

				var elementsPerColumn = elementsPerPage/2;

				var div = $("<div style='display: inline-block; margin-left: auto; margin-right:auto'>").appendTo(element);

				for(var rightTable = 0; rightTable <= 1; rightTable++) {				
					var table = $("<table style='float: left'>").appendTo(div);

					for(var row = 0; row < elementsPerColumn; row++) {
						var i = rightTable * elementsPerColumn + row;
						if(i < commentersPage.length) {
							var c = commentersPage[i];
							var title = "Zeige alle "+c.numPosts+" Kommentare";
							$("<tr>"+
							"<td class='numposts'><a href="+ c.profileUrl +" title='"+title+"'' style='text-decoration: none'>"+
							c.numPosts+"</a>"+c.glyph+"</td>"+
							"<td class='username'>"+
								"<img src="+c.avatar.small.permalink+" height='46px' width='46px' alt='Avatar'>&nbsp;"+
								"<a href="+c.profileUrl+" title='"+title+"''>"+c.name+"</a>"+
							"</td>"+
							"</tr>").appendTo(table);
						} else {
							$("<tr>"+
							"<td class='numposts'>&nbsp;</td>"+
							"<td class='username'>"+
								"<div height='46px' width='46px'>&nbsp;</div>"+
							"</td>"+
							"</tr>").appendTo(table);
						}
					}					
				}
			}

			function setupHighscoreList() {
				$.ajax({url: 'http://www.wahlversprechen2013.de/json/mostActiveCommenters', dataType: "json"}).done( 
					function(response) {
						var filteredNames = ["scripteddemocracy", "wahlversprechen2013", "sebastian_wahlversprechen", "wanja_seifert", "wanjaseifert"];
						
						var commenters = response.response.filter(function(user) {
							return filteredNames.indexOf(user.username)===-1;
						});

						var highscore = $("#highscore");
						var elementsPerPage = 10;
						var pages = Math.ceil(commenters.length / elementsPerPage);
						var elementPages = $("#highscore_pages");

						if(1<pages) {
	                  		var prevLink = $("<li><a href='#' data-target='prev'>&laquo;</a></li>").appendTo(elementPages);
	                  		for(var i = 0; i < pages; i++) {
	                  			$("<li><a href='#' data-target='"+(i+1)+"'>"+(i+1)+"</a></li>").appendTo(elementPages);
	                  		}
	                  		var nextLink = $("<li><a href='#' data-target='next'>&raquo;</a></li>").appendTo(elementPages);	

	                  		elementPages.find("a").click( function(evt) {
								evt.preventDefault();
	                  			var a = $(evt.target);
	                  			if(a.parent().hasClass("disabled")) return;

								var target = a.data("target");

								var active = elementPages.find(".active");

								if(target==="prev" || target==="next") {
									var activeTarget = active.children("a").data("target");
									if(target==="prev") {
										activeTarget--;
									} else {
										activeTarget++;
									}
									target = activeTarget;
									a = elementPages.find("[data-target="+activeTarget+"]");
								}

								if(target===1) {
									prevLink.addClass("disabled");
								} else {
									prevLink.removeClass("disabled");
								}

								if(target===pages) {
									nextLink.addClass("disabled");
								} else {
									nextLink.removeClass("disabled");
								}

								active.removeClass("active");
								a.parent().addClass("active");
								renderHighscorePage(commenters, target, elementsPerPage, highscore);

							});
							elementPages.find("[data-target=1]").trigger("click");

						} else {							
							renderHighscorePage(commenters, 1, elementsPerPage, highscore);
						}
					});
			}

			function setupButtonHandler() {
				$('a[href^=#]').on('click', function(e){
				    var href = $(this).attr('href');
				    if(href!="#") {
					    $('html, body').animate({
					        scrollTop:$(href).offset().top
					    },'slow');
				    }
					e.preventDefault();
				});

				$('a.reload').on('click', function(e){
				    reload();
				    e.preventDefault();
				});
			}

			function setupTabs() {
				$('[data-toggle=tab]').each(function(){
					var element = $(this);
					var id = element.attr("href");
					var tab = $(id);
					if(element.hasClass("active")) {
						tab.show();
						$(window).resize();
					} else {
						tab.hide();
					}
				});
				$('[data-toggle=tab]').on('click', function(e){
					var element = $(this);
					var id = element.attr("href");
					var tab = $(id);
					
					var buttons = element.parents(".btn-group");
					buttons.children("[href='"+id+"']").addClass("active");
					buttons.children("[href!='"+id+"']").removeClass("active");

					var tabcontent = tab.parents(".tab-content");

					tabcontent.children("[id!='"+id.substr(1)+"']").hide();
					var visible = tabcontent.children(id);
					visible.show();
					$(window).resize();
				});
			}

			function setupCharts() {
				var ratingZero = {};
				ratings.forEach(function(r) {
					ratingZero[r.value] = 0;
				});

				// map rating.value -> int	
				var ratingCounts = $.extend(true, {}, ratingZero);

				// map category.name -> rating.value -> int
				var ratingCountsPerCategory = {};

				// changes in total ratings with date
				var ratingDiff = [];
		
				stmts.forEach( function(stmt) {
					if(ratingCountsPerCategory[stmt.category]===undefined) {
						ratingCountsPerCategory[stmt.category] = $.extend(true, {}, ratingZero);
					}

					var rating = stmt.ratings.length===0 ? idxUndefined : stmt.ratings[stmt.ratings.length-1].rating
					if(ratingCounts[rating]===undefined) {
						ratingCounts[rating] = 1;
					} else {
						ratingCounts[rating]++;
					}

					var ratingPerCategory = ratingCountsPerCategory[stmt.category];

					if(ratingPerCategory[rating]===undefined) {
						ratingPerCategory[rating] = 1;
					} else {
						ratingPerCategory[rating]++;
					}

					for(var i=0; i<stmt.ratings.length; i++) {
						var prev = i===0 ? idxUndefined : stmt.ratings[i-1];
						var current = stmt.ratings[i].rating;
						if(prev!==current) {
							var date = new Date(stmt.ratings[i].date);
							ratingDiff.push( {
								prev: i===0 ? idxUndefined : stmt.ratings[i-1],
								current: stmt.ratings[i].rating,
								date: new Date(date.getFullYear(), date.getMonth(), date.getDay())
							} );	
						}
					}
				});

				ratingDiff.sort(function(lhs, rhs) {
					if(lhs.date < rhs.date) return -1;
					if(rhs.date < lhs.date) return 1;
					return 0;
				});

				var initialRatings = $.extend(true, {}, ratingZero);
				initialRatings[idxUndefined] = stmts.length;
				initialRatings.date = ratingDiff[0].date;

				var ratingsOverTime = [ initialRatings ];
				for(var i=0; i<ratingDiff.length; i++) {
					var ratingLast = ratingsOverTime[ratingsOverTime.length-1];

					var ratingNew;
					if(ratingLast.date.getTime() !== ratingDiff[i].date.getTime()) {
						ratingNew = $.extend(true, {}, ratingLast);
						ratingsOverTime.push(ratingNew);
					} else {
						ratingNew = ratingLast; // overwrite
					}
					ratingNew.date = ratingDiff[i].date;
					ratingNew[ratingDiff[i].prev]--;
					ratingNew[ratingDiff[i].current]++;
				}

				var style = {
					fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif', // default font
					fontSize: '14px',
					fontWeight: 'bold'
				};

				var categoriesFiltered = categories.filter( function(c) {
					return ratingCountsPerCategory[c.name] != undefined;
				});
				{
					$('#status').highcharts({
				        chart: {
				            type: 'bar',
				            style: style
				        },
				        plotOptions: {
				        	bar: {
				        		colorByPoint: true,
				        		dataLabels: {
				        			enabled: true,
				        			formatter: function() {
				        				var p = this.point;
				        				return "<a href='http://www.wahlversprechen2013.de/rating/"+p.id+"' target='_blank' class='chart'><span style='color: "+p.color + "'>"+ this.y +"</span></a>";
				        			},
				        			useHTML: true,
				        			style: style
				        		}
				        	}
				        },
				        colors: ratings.map(function(r) { return r.color; }),
				        title: {
				            text: 'Wahlversprechen nach aktueller Bewertung'
				        },
				        xAxis: {
				            categories: ratings.map(function(r) { return r; }),
				            labels: {
				            	formatter: function() {
				            		var rating = this.value;
				            		return "<a href='http://www.wahlversprechen2013.de/rating/"+rating.id+"' target='_blank' class='chart'><span style='color: "+rating.color + "'><span class='glyphicon " + rating.glyph + "'></span>&nbsp;"+rating.name+"</span></a>";
				            	},
				            	useHTML: true,
				            	style: style
				            }
				        },
				        yAxis: {
				            title: {
				                text: 'Anzahl der Wahlversprechen'
				            },
				            gridLineColor: null
				        },
				        series: [{
				        	name: "Anzahl",
				        	data: ratings.map(function(r) { 
				        		return {
				        				name: r.name,
				        				color: r.color,
				        				id: r.id,
				        				y: ratingCounts[r.value]
				        			};
				        	})
				        }],
				        legend: { 
				        	enabled: false
				        }
				    });
				}
				{
					$('#ressort').highcharts({
				        chart: {
				            type: 'bar',
				            style: style,
			                events: {
			                  load: function() {
			                    $(window).resize();
			                  }
			                }
				        },
				        plotOptions: {
				        	bar: {
				        		stacking: "normal"
				        	}
				        },
				        colors: ratings.map(function(r) { return r.color; }),
				        title: {
				            text: 'Bewertung der Wahlversprechen nach Ressorts'
				        },
				        xAxis: {
				            categories: categoriesFiltered.map(function(c) { return c.name; }),
				            labels: {
				            	formatter: function() {
				            		var category = this.value;
				            		return "<a href='http://www.wahlversprechen2013.de/category/"+category+"' target='_blank' class='chart'>"+category+"</a>";
				            	},
				            	useHTML: true,
				            	style: {
									textAlign: 'right'									
								}
				            }
				        },
				        yAxis: {
				            title: {
				                text: 'Anzahl der Wahlversprechen'
				            },
				            gridLineColor: null
				        },
				        series: ratings.map(function(r) { 
				        	return {
				        		name: r.name,
				        		data: categoriesFiltered.map( function(c) {
				        				return ratingCountsPerCategory[c.name][r.value];
				        			})
				        		}; 
				        	}),
				        legend: { 
				        	enabled: false
				        }
				    });
				}
				{
					var series = ratings.map(function(r) { 
				        	return {
				        		name: r.name,
				        		data: ratingsOverTime.map( function(t) {
				        			return [t.date.getTime(), t[r.value]];
				        		})
				        	}; 
				        });
					$('#zeit').highcharts({
				        chart: {
				            type: 'area',
				            style: style,
			                events: {
			                  load: function() {
			                    $(window).resize();
			                  }
			                }
				        },
				        plotOptions: {
				        	area: {
				        		stacking: "normal"
							},
				            series: {
				                marker: {
				                    enabled: false
				                }
				            }
				        },
				        colors: ratings.map(function(r) { return r.color; }),
				        title: {
				            text: 'Bewertung der Wahlversprechen über die Zeit'
				        },
				        xAxis: {
            				type: 'datetime'
            			},
				        yAxis: {
				        	title: "Anzahl",
				            gridLineColor: null
				        },
				        series: ratings.map(function(r) { 
				        	var visible = true;
				        	if(r.value === idxUndefined) {
				        		visible = false;
				        	}
				        	return {
				        		name: r.name,
				        		data: ratingsOverTime.map( function(t) {
				        			return [t.date.getTime(), t[r.value]];
				        		}),
				        		visible: visible
				        	}; 
				        }),
				        legend: { 
				        	enabled: true
				        }
				    });
				}
			}

			$(document).ready(function() {
				setupButtonHandler();
				setupHighscoreList();
				setupTabs();
				setupCharts();

				$.ajax({
			         type: "GET",
			         url: "http://wahlversprechen2013.disqus.com/embed.js",
			         dataType: "script",
			         cache: true
			    }).done(function() {
					doRouting();

					$(window).on("hashchange", doRouting);
			    });
			});
		}
	)
});