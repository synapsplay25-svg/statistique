/* Fill cells of an .xlsx template by editing sheet XML as text (keeps all formatting). */
(function (root) {
  function colNum(ref) { var m = /^([A-Z]+)/.exec(ref)[1], n = 0; for (var i = 0; i < m.length; i++) n = n * 26 + m.charCodeAt(i) - 64; return n; }
  function rowNum(ref) { return +/(\d+)$/.exec(ref)[1]; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function attr(tag, name) { var m = new RegExp('\\s' + name + '="([^"]*)"').exec(tag); return m ? m[1] : null; }
  function cellXml(ref, style, v) {
    var s = style != null ? ' s="' + style + '"' : '';
    if (v === null || v === undefined || v === '' || v === 0) return '<c r="' + ref + '"' + s + '/>';
    if (typeof v === 'number') return '<c r="' + ref + '"' + s + '><v>' + (Math.round(v * 1000) / 1000) + '</v></c>';
    return '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + esc(v) + '</t></is></c>';
  }
  var CELL = /<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g;
  function setRow(rowInner, cells) {
    var list = rowInner.match(CELL) || [];
    var byRef = {};
    list.forEach(function (c, i) { byRef[attr(c.slice(0, c.indexOf('>') + 1), 'r')] = i; });
    Object.keys(cells).forEach(function (ref) {
      if (byRef[ref] !== undefined) {
        var old = list[byRef[ref]]; var open = old.slice(0, old.indexOf('>') + 1);
        list[byRef[ref]] = cellXml(ref, attr(open, 's'), cells[ref]);
      } else {
        var cn = colNum(ref), idx = list.length;
        for (var i = 0; i < list.length; i++) { if (colNum(attr(list[i], 'r')) > cn) { idx = i; break; } }
        list.splice(idx, 0, cellXml(ref, null, cells[ref]));
        byRef = {}; list.forEach(function (c, j) { byRef[attr(c, 'r')] = j; });
      }
    });
    return list.join('');
  }
  function setCells(xml, cells) {
    var rows = {};
    Object.keys(cells).forEach(function (ref) { var r = rowNum(ref); (rows[r] = rows[r] || {})[ref] = cells[ref]; });
    var sdStart = xml.indexOf('<sheetData');
    var sdOpenEnd = xml.indexOf('>', sdStart);
    if (xml[sdOpenEnd - 1] === '/') { xml = xml.slice(0, sdStart) + '<sheetData></sheetData>' + xml.slice(sdOpenEnd + 1); sdOpenEnd = xml.indexOf('>', sdStart); }
    var sdEnd = xml.indexOf('</sheetData>');
    var body = xml.slice(sdOpenEnd + 1, sdEnd);
    var ROW = /<row\b[^>]*?(?:\/>|>[\s\S]*?<\/row>)/g;
    var rowList = body.match(ROW) || [];
    Object.keys(rows).map(Number).sort(function (a, b) { return a - b; }).forEach(function (r) {
      var found = -1;
      for (var i = 0; i < rowList.length; i++) { if (+attr(rowList[i].slice(0, rowList[i].indexOf('>') + 1), 'r') === r) { found = i; break; } }
      if (found >= 0) {
        var row = rowList[found], openEnd = row.indexOf('>');
        var open = row.slice(0, openEnd + 1), selfClose = open[open.length - 2] === '/';
        open = open.replace(/\sspans="[^"]*"/, '');
        if (selfClose) open = open.slice(0, -2) + '>';
        var inner = selfClose ? '' : row.slice(openEnd + 1, row.lastIndexOf('</row>'));
        rowList[found] = open + setRow(inner, rows[r]) + '</row>';
      } else {
        var idx = rowList.length;
        for (var j = 0; j < rowList.length; j++) { if (+attr(rowList[j], 'r') > r) { idx = j; break; } }
        rowList.splice(idx, 0, '<row r="' + r + '">' + setRow('', rows[r]) + '</row>');
      }
    });
    return xml.slice(0, sdOpenEnd + 1) + rowList.join('') + xml.slice(sdEnd);
  }
  function sheetFiles(wbXml, relsXml) {
    var rid = {}, out = {};
    (relsXml.match(/<Relationship\b[^>]*>/g) || []).forEach(function (t) { rid[attr(t, 'Id')] = attr(t, 'Target'); });
    (wbXml.match(/<sheet\b[^>]*>/g) || []).forEach(function (t) {
      var name = attr(t, 'name').replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"');
      var tg = rid[attr(t, 'r:id')].replace(/^\//, ''); if (tg.indexOf('xl/') !== 0) tg = 'xl/' + tg;
      out[name.replace(/ /g, ' ').trim()] = tg;
    });
    return out;
  }
  async function fill(zip, plan) {
    var map = sheetFiles(await zip.file('xl/workbook.xml').async('string'), await zip.file('xl/_rels/workbook.xml.rels').async('string'));
    for (var name in plan) {
      var path = map[name]; if (!path) throw new Error('sheet missing: ' + name);
      var xml = await zip.file(path).async('string');
      zip.file(path, setCells(xml, plan[name]));
    }
    return zip;
  }
  root.XL = { setCells: setCells, sheetFiles: sheetFiles, fill: fill, colNum: colNum };
})(typeof window !== 'undefined' ? window : module.exports);
