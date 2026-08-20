function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID가 Script Properties에 설정되어 있지 않습니다');
  return SpreadsheetApp.openById(id);
}

function getSheet_(tabName) {
  var sheet = getSpreadsheet_().getSheetByName(tabName);
  if (!sheet) throw new Error('시트 탭을 찾을 수 없습니다: ' + tabName);
  return sheet;
}

function readRows_(tabName) {
  var sheet = getSheet_(tabName);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values.slice(1)
    .filter(function (row) { return row.some(function (c) { return c !== '' && c !== null; }); })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });
}

function appendRow_(tabName, rowObj) {
  var sheet = getSheet_(tabName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('id') !== -1 && !rowObj.id) rowObj.id = Utilities.getUuid();
  var row = headers.map(function (h) { return rowObj[h] !== undefined ? rowObj[h] : ''; });
  sheet.appendRow(row);
  return rowObj;
}

function updateRow_(tabName, id, patch) {
  var sheet = getSheet_(tabName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('id');
  if (idCol === -1) throw new Error(tabName + ' 탭에 id 컬럼이 없습니다');
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === String(id)) {
      headers.forEach(function (h, c) {
        if (patch[h] !== undefined) sheet.getRange(r + 1, c + 1).setValue(patch[h]);
      });
      var updated = {};
      headers.forEach(function (h, c) { updated[h] = patch[h] !== undefined ? patch[h] : values[r][c]; });
      return updated;
    }
  }
  throw new Error(tabName + ' 탭에서 id=' + id + ' 행을 찾을 수 없습니다');
}

function deleteRow_(tabName, id) {
  var sheet = getSheet_(tabName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('id');
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === String(id)) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

function findRow_(tabName, id) {
  var rows = readRows_(tabName);
  var found = rows.filter(function (r) { return String(r.id) === String(id); });
  return found.length ? found[0] : null;
}
