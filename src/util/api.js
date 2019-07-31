const orderBy = require('lodash.orderby');

module.exports = {
  processResults: (config, rows) => {
    if (!config) {
      return rows;
    }

    if (!Array.isArray(rows)) {
      for (const key in rows) {
        if (Array.isArray(rows[key])) {
          rows[key] = module.exports.processResults(config, rows[key]);
        }
      }
      return rows;
    }

    const { fields, filter, q, start, end, limit, page, sort, order } = config;

    if (filter) {
      for (const key in filter) {
        const keyParts = String(key).split('_');
        const string = keyParts[0];
        const operator = keyParts[1];
        function prep(val) {
          return !isNaN(val) ? parseFloat(val) : String(val).toLowerCase();
        }
        const value = prep(filter[key]);
        if (operator === 'gte') {
          rows = rows.filter(row => prep(row[string]) >= value);
        } else if (operator === 'lte') {
          rows = rows.filter(row => prep(row[string]) <= value);
        } else if (operator === 'gt') {
          rows = rows.filter(row => prep(row[string]) > value);
        } else if (operator === 'lt') {
          rows = rows.filter(row => prep(row[string]) < value);
        } else if (operator === 'ne') {
          rows = rows.filter(row => prep(row[string]) !== value);
        } else if (operator === 'like') {
          rows = rows.filter(row => prep(row[string]).indexOf(value) > -1);
        } else {
          rows = rows.filter(row => prep(row[string]) === value);
        }
      }
    }

    if (q) {
      const str = String(q).toLowerCase();
      rows = rows.filter(row => {
        let match = false;
        for (const item in row) {
          if (
            String(row[item])
              .toLowerCase()
              .indexOf(str) > -1
          ) {
            match = true;
          }
        }
        return match;
      });
    }

    if (fields) {
      rows = rows.map(row => {
        let out = {};
        fields.forEach(f => {
          out[f] = row[f];
        });
        return out;
      });
    }

    if (start && !limit) {
      rows = rows.slice(start - 1, end);
    } else if (end) {
      rows = rows.slice(0, end);
    } else if (page) {
      const l = parseFloat(limit || 10);
      let s = parseFloat(l * (page - 1));
      s = s < 0 ? 0 : s;
      rows = rows.slice(s, s + l);
    } else if (limit) {
      let begin = (start || 1) - 1;
      rows = rows.slice(begin, begin + limit);
    }

    if (sort) {
      rows = orderBy(rows, sort, order.map(o => String(o).toLowerCase()));
    }

    rows = rows
      .map(n => {
        for (const key in n) {
          if (n[key] === undefined) {
            delete n[key];
          }
        }
        return n;
      })
      .filter(n => {
        return Object.keys(n).length > 0;
      });

    return rows;
  },
  /**
   * Converts a given date into the AD Expiricy Date format (the number of 100 nanoseconds intervals from January 1, 1601)
   * @param {*} Par - The date to be converted in YYYY-MM-DD HH:mm:ss OR YYYY-MM-DDTHH:mm:ss OR YYYY-MM-DD
   */
  convertDateToAD: Par => {
    if (Par.search(' ') > -1) {
      Par = Par.split(' ')[0];
    }
    // Add T00:00:00 if needed
    if (Par.search('T') == -1) {
      Par += 'T00:00:00';
    }
    var splitted = Par.split('T');
    // 1st part
    var splittedDate = splitted[0];
    splittedDate = splittedDate.split('-');
    var year = splittedDate[0];
    var month = splittedDate[1] - 1; // Minus 1 needed
    var day = splittedDate[2];
    // 2nd part
    var splittedTime = splitted[1];
    splittedTime = splittedTime.split(':');
    var hours = splittedTime[0];
    var minutes = splittedTime[1];
    var seconds = splittedTime[2];
    // New date object
    var adDate = Date.UTC(year, month, day, hours, minutes, seconds);
    adDate = adDate * 10000 + 116444736000000000 + 864000000000; // Has to be this high!
    // Error handling
    if (
      adDate == '' ||
      adDate == null ||
      adDate.toString() == 'NaN' ||
      Par >= '9999-12-31'
    ) {
      adDate = '9223372036854775807';
    }
    return adDate;
  },

  /**
   * Converts a AD Expiricy Date format (the number of 100 nanoseconds intervals from January 1, 1601) to a js date
   * @param {*} Par - The date to be converted in YYYY-MM-DD HH:mm:ss OR YYYY-MM-DDTHH:mm:ss OR YYYY-MM-DD
   */
  convertDateFromAD: Par => {
    var MSTimestamp = Par;
    var MSTimestampNormalized =
      (MSTimestamp - 116444736000000000 - 864000000000) / 10000;
    var date = new Date(MSTimestampNormalized);
    return date;
  }
};
