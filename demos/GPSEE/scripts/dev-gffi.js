var ffi = require('gffi');
['S_IFREG','S_IFDIR','O_RDONLY'].forEach(function(mac){
  ['std','gpsee'].forEach(function(group){
    print(group+'.'+mac+' = '+ffi[group][mac])
  })
});