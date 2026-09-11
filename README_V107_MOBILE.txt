A MASMORRA DE ANAKK TUR — V107 MOBILE EMBEDDED

Esta versão é preparada para publicação pelo GitHub + Netlify.

BASE EMBUTIDA
- Artes de saqueadores e monstros do backup de 11/09/2026 ficam em public/assets/base.
- SFX e BGM do backup ficam embutidos e são usados automaticamente como fallback.
- Abertura: public/assets/videos/anakk-opening.mp4.
- O jogo continua aceitando importação/exportação do backup do navegador para personalizações.

CORREÇÕES IMPORTANTES
- Ataque por arrastar não dispara um segundo ataque pelo clique sintético do navegador.
- Reação 2/3 usa 2/3 de dano por NULO.
- Cultista bloqueia habilidades antes de qualquer VFX/SFX.
- Bot pode atacar saqueadores e usar habilidades quando legal.
- Dados visuais permanecem por dado: 2 dados = 2 dados visuais.
- Descarte mostra cartas sem marcadores de dano.
- Carta não encolhe ao clique/uso de habilidade.
- Avançar Etapa não desloca no hover.
- Log maior e mais enxuto visualmente.
- ESC/Z e menu de pausa preservados.
- Interface mobile real em telas <= 900px, com mesa vertical e mão rolável.

NETLIFY
Build command: npm run build
Publish directory: dist
Branch: main
