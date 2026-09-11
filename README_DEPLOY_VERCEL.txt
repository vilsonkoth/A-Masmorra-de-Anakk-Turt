A MASMORRA DE ANAKK TUR — MOBILE WEB 0.0.108

ESTA VERSÃO FOI PREPARADA PARA GITHUB + VERCEL.

1. Extraia este ZIP.
2. Envie o CONTEÚDO desta pasta para a raiz do repositório GitHub.
3. Faça commit na branch main.
4. A Vercel deve iniciar o deploy automaticamente.

IMPORTANTE:
- Não envie node_modules.
- Não precisa rodar build antes de enviar.
- O index.html usa /src/main.tsx; não depende de hashes antigos de /assets.
- As artes, SFX, músicas e vídeos estão dentro de public/assets/base.
- O vídeo de abertura está em public/assets/videos/anakk-opening.mp4.
- O vercel.json já define build com Vite e saída dist.

Se a Vercel mostrar um erro antigo de /assets/index-*.js, faça um novo deploy/commit: esse arquivo não é mais referenciado pelo index.html.
