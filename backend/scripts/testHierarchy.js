const { getHierarchy, getRegionsForCity, getRegionsForState } = require('../data/regionHierarchy');

console.log('Kothrud →', getHierarchy('Kothrud'));
console.log('Koramangala →', getHierarchy('Koramangala'));
console.log('Whitefield →', getHierarchy('Whitefield'));
console.log('');
console.log('Regions in pune:', getRegionsForCity('pune'));
console.log('Regions in bengaluru:', getRegionsForCity('bengaluru'));
console.log('Regions in MH:', getRegionsForState('MH'));
console.log('Regions in KA:', getRegionsForState('KA'));