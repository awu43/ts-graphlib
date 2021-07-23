exports.has = function (obj, key) {
  try {
    return hasOwnProperty.call(obj, key);
  } catch (error) {
    if (error instanceof TypeError) {
      // obj is null or undefined
      return false;
    } else {
      throw error;
    }
  }
};

exports.isEmpty = function (obj) {
  if (Array.isArray(obj)) {
    return !obj.length;
  } else if (obj instanceof Map || obj instanceof Set) {
    return !obj.size;
  } else if (typeof obj === "object") {
    return !Object.keys(obj).length;
  } else {
    throw new Error("Attempted isEmpty() on non-container object");
  }
};

exports.union = function (...arrays) {
  const values = new Set();
  const newArray = [];
  for (const arr of arrays) {
    for (const e of arr) {
      if (!values.has(e)) {
        newArray.push(e);
        values.add(e);
      }
    }
  }
  return newArray;
};
