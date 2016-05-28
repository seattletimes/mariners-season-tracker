// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
var dot = require("./lib/dot");
var tooltipTemplate = dot.compile(require("./_tooltip.html"));

var data = window.seasons;
var years = Object.keys(data).sort().reverse();

var length2016 = data[2016].length
var last2016 = data[2016][length2016 - 1];
var slope = last2016.wins / length2016;
var projected = Math.floor(slope * 162);

var yearNotes = {
  1978: "Worst season",
  1995: "First playoffs",
  2001: "Best season",
  2015: "Last season",
  2016: "Current season"
};

var rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a || 1})`;

var hexToRGB = hex => [hex >> 16, hex >> 8 & 0xFF, hex & 0xFF];
var hexToRGBA = (hex, a) => rgba.apply(null, hexToRGB(hex).concat([a]));

var palette = {
  1978: rgba(0, 0, 0, .7),
  1995: hexToRGBA(0x56617d, .7),
  2001: hexToRGBA(0x269ba5, .7),
  2015: hexToRGBA(0x003166, .7),
  2016: hexToRGBA(0xf88a47, 1)
};
var padding = 2;
var offLine = 2;
var featureLine = 4;

var container = document.querySelector(".canvas-container");
var tooltip = document.querySelector(".tooltip");
var keyBlock = document.querySelector(".key");
var canvas = document.querySelector(".canvas-container canvas");
var context = canvas.getContext("2d");
var longest = 0;
var highest = 0;
for (var key in data) {
  if (data[key].length > longest) longest = data[key].length;
  var last = data[key][data[key].length - 1];
  if (last.wins > highest) highest = last.wins;
}
longest -= 1;

var focusNote = function() {
  this.focus();
};

//once we have bounds, create the notes
years.forEach(function(year) {
  var season = data[year];
  season.forEach(function(item, game) {
    if (!item.notes) return;
    var dot = document.createElement("div");
    dot.className = "note-dot";
    dot.innerHTML = `
      <div class="note">
        <h3>Game ${game + 1}, ${year}:</h3>
        <img src="${item.photo || ""}">
        ${item.notes}
      </div>`
    var x = (game / longest) * 100;
    dot.style.left = x + "%";
    var y = (item.wins / highest) * 100;
    if (x >= 50) dot.classList.add("right");
    dot.style.top = 100 - y + "%";
    dot.addEventListener("touchstart", focusNote);
    dot.tabIndex = 1;
    container.appendChild(dot);
  });
  var key = document.createElement("li");
  key.innerHTML = `<i class="dot" style="background: ${palette[year]}"></i> ${year} (${yearNotes[year]})`;
  keyBlock.appendChild(key);
});

var render = function() {
  var bounds = canvas.getBoundingClientRect();
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  var w = canvas.width - padding * 2;
  var h = canvas.height - padding * 2;
  //draw x lines
  context.lineWidth = 1;
  context.strokeStyle = rgba(0, 0, 0, .2);
  for (var i = 0; i < longest; i += 20) {
    var x = padding + (i / longest) * w
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  //draw actual data
  for (var key in data) {
    var season = data[key];
    context.lineWidth = key == 2016 ? featureLine : offLine;
    context.beginPath();
    context.moveTo(0, canvas.height);
    for (var i = 0; i < season.length; i++) {
      if (!season[i].won) break;
      var x = padding + (i / longest) * w;
      var y = h + padding - (season[i].wins / highest) * h;
      context.lineTo(x, y);
    }
    context.strokeStyle = palette[key];
    context.stroke();
  }
  //draw the trendline for the current season
  var length2016 = data[2016].length
  var last2016 = data[2016][length2016 - 1];
  var slope = last2016.wins / length2016;
  var startX = padding + ((length2016 - 1) / longest) * w;
  context.beginPath();
  context.moveTo(padding, h + padding);
  context.lineTo(padding + w, h + padding - slope * longest / highest * h);
  try {
    context.setLineDash([1, 3]);
  } catch (err) { /* do nothing */ }
  context.strokeStyle = palette[2016];
  context.lineWidth = offLine;
  context.stroke();
};

var highlight = function(e) {
  render();
  var bounds = canvas.getBoundingClientRect();
  var x = (e.touches ? e.touches[0].clientX : e.clientX) - bounds.left;
  var y = (e.touches ? e.touches[0].clientY : e.clientY) - bounds.top;
  var game = Math.floor(x / (canvas.width - padding * 2) * longest);
  context.beginPath();
  try {
    context.setLineDash([0]);
  } catch (err) { /* do nothing */ }
  context.strokeStyle = rgba(0, 0, 0, .3);
  context.lineWidth = canvas.width / longest;
  var projectedX = padding + (game / longest) * (canvas.width - padding * 2)
  context.moveTo(projectedX, padding);
  context.lineTo(projectedX, canvas.height - padding);
  context.stroke();
  var html = "";
  var selected = {};
  years.forEach(function(y) {
    var season = data[y];
    var g = season[game] || season[season.length - 1];
    selected[y] = g;
  });
  tooltip.innerHTML = tooltipTemplate({ game: game + 1, selected, notes: yearNotes, projected })
  tooltip.classList.remove("empty");
  tooltip.style.left = (x > canvas.width / 2 ? x - tooltip.offsetWidth : x) + "px";
  tooltip.style.top = y + 10 + "px";
};

render();

canvas.addEventListener("mousemove", highlight, 50);
canvas.addEventListener("touchmove", highlight);
window.addEventListener("resize", render);