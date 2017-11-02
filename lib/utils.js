/** @module utils */


/**
 * Returns a key from a given date for statistics object.
 * If date no given uses current date.
 * 
 * @param {any} [date=new Date()] 
 * @returns 
 */
function keyFromDate(date = new Date()) {
  let day = date.getDate();
  day = day > 9 ? day : `0${day}`;
  let month = date.getMonth();
  month = month > 8 ? month + 1 : `0${month + 1}`;
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
}


module.exports = {
  keyFromDate,
};
