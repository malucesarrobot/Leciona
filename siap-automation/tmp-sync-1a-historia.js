const fs = require('fs');
const medias = JSON.parse(fs.readFileSync('/tmp/medias_1a_historia.json'));
const cfg = [{ label: '1ªA Historia', serie: '1', letra: 'A', disc: 'Historia', alunos: medias }];
fs.writeFileSync('sync-1a-historia-agora.json', JSON.stringify(cfg, null, 1));
console.log('salvo, total alunos:', medias.length);
