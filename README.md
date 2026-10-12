# Injection — scripts e macros por assinatura

Site estático (HTML, CSS e JS puro), pronto para GitHub Pages.

## Páginas
- `index.html`: vitrine com todos os jogos, como funciona e FAQ.
- `jogos/<jogo>.html`: página de cada jogo (recursos, planos e FAQ), ex.: `jogos/optpokemon.html`.
- `area.html`: login da área do assinante (ainda sem back-end). `area.html#painel` mostra a prévia do painel com dados de exemplo.

## Como editar
- **Jogos, textos, recursos e preços:** `assets/games.js`. Cada jogo é um bloco; `status: "em-breve"` mostra o card desativado.
- **Adicionar um jogo:** crie o bloco em `assets/games.js` e copie `jogos/optpokemon.html` para `jogos/<slug>.html`, trocando `data-game="<slug>"` e o título.
- **Links de pagamento, Discord e e-mail:** `assets/config.js`. Sem link de checkout, o botão "Assinar" leva ao Discord.
- **Cor de cada jogo:** campo `cor` do jogo em `assets/games.js`.
- **Ilustrações do topo:** SVGs próprios em `assets/arte/`, ligados pelo campo `slides`.
- **Status, changelog e demonstração:** campos `script`, `changelog` e `demo` do jogo. Com `demo.video` vazio, a página mostra a simulação do painel.
- **Tabela comparativa:** campo `comparativo` (uma linha por recurso, uma coluna por plano).
- **Cores e visual:** variáveis no topo de `assets/styles.css`.

## Ver localmente
```bash
python3 -m http.server 8000
# abra http://localhost:8000
```
