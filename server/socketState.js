let _io = null;
let _adminSocketIds = null;

function init(io, adminSocketIds) {
  _io = io;
  _adminSocketIds = adminSocketIds;
}

function emitToAdmins(event, data) {
  if (!_io || !_adminSocketIds) return;
  for (const sid of _adminSocketIds) {
    _io.to(sid).emit(event, data);
  }
}

module.exports = { init, emitToAdmins };
