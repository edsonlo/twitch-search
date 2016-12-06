utils = {
  entityMap : {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  },

  escapeHTML: function(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return utils.entityMap[s];
    });
  }
}
