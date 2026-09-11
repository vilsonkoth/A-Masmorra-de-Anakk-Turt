ANAKK TUR V102 - PATCH DESKTOP REAL
Base: projeto-fonte enviado pelo usuario em 11/09/2026.

Alteracoes principais:
- remove CoinTossModal do fluxo de inicio; primeiro jogador e sorteado diretamente.
- corrige hits: acertos = quantidade de dados com dano; damageDealt = dano total.
- remove floating combat damage duplicado disparado junto da resolucao.
- DiceRollModal agora usa ThemedDice3D para mostrar dados fisicos de madeira individuais.
- resultado individual de cada dado permanece visivel.
- adiciona texto de roleplay na resolucao.
- habilidade usa o proprio icone e a carta nao escala/encolhe ao selecionar/hover.
- somente desktop; nenhuma alteracao mobile.

IMPORTANTE:
Este ZIP e projeto-fonte. Rode npm install e npm run build em Windows/Netlify.
A dependencia @rollup/rollup-win32-x64-msvc foi removida do package.json para permitir build cross-platform; o npm instala a dependencia nativa adequada no ambiente de build.
