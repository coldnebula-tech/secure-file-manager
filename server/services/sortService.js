module.exports = {
  /**
   * Return a sorted copy of `items` based on `field` and `order`.
   *
   * @param {Array<Object>} items - Array of item objects to sort.
   * @param {string} [field='name'] - Object property to sort by.
   * @param {string} [order='asc'] - 'asc' or 'desc' sort order.
   * @returns {Array<Object>} Sorted copy of the items array.
   */
  sortItems(items, field = 'name', order = 'asc') {
    const sorted = [...items];

    sorted.sort((a, b) => {
      const first = String(a[field] || '').toLowerCase();
      const second = String(b[field] || '').toLowerCase();

      if (first < second) {
        return order === 'asc' ? -1 : 1;
      }
      if (first > second) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }
};
